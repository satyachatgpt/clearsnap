// src/hooks/useGallery.ts

import { useState, useCallback, useMemo } from 'react';
import * as MediaLibrary from 'expo-media-library';
import {
  AnalyzedImage,
  Category,
  scanGallery,
  deleteImages,
  groupByBucket,
  sortedBuckets,
} from '../utils/imageAnalyzer';

export type FilterCategory = Category | 'all';

export function useGallery() {
  const [images, setImages]           = useState<AnalyzedImage[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [scanning, setScanning]       = useState(false);
  const [scanProgress, setScanProgress] = useState({ loaded: 0, total: 0 });
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [deleting, setDeleting]       = useState(false);
  const [lastDeleted, setLastDeleted] = useState(0);

  // ── Permission ──────────────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  // ── Scan ────────────────────────────────────────────────────────────────────
  const scan = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) return;

    setScanning(true);
    setScanProgress({ loaded: 0, total: 0 });
    setSelected(new Set());

    try {
      const result = await scanGallery((loaded, total) => {
        setScanProgress({ loaded, total });
      });
      setImages(result);
    } finally {
      setScanning(false);
    }
  }, [requestPermission]);

  // ── Filtered images ─────────────────────────────────────────────────────────
  const filteredImages = useMemo(() => {
    if (activeCategory === 'all') return images;
    return images.filter(img => img.category === activeCategory);
  }, [images, activeCategory]);

  // ── Grouped & sorted buckets ────────────────────────────────────────────────
  const grouped = useMemo(() => groupByBucket(filteredImages), [filteredImages]);
  const buckets  = useMemo(() => sortedBuckets(grouped), [grouped]);

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectBucket = useCallback((bucketName: string) => {
    const ids = (grouped[bucketName] ?? []).map(img => img.id);
    setSelected(prev => {
      const next = new Set(prev);
      const allIn = ids.every(id => next.has(id));
      ids.forEach(id => allIn ? next.delete(id) : next.add(id));
      return next;
    });
  }, [grouped]);

  const selectCategory = useCallback((cat: FilterCategory) => {
    const pool = cat === 'all' ? images : images.filter(i => i.category === cat);
    setSelected(new Set(pool.map(i => i.id)));
  }, [images]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const isBucketFullySelected = useCallback((bucketName: string) => {
    const ids = (grouped[bucketName] ?? []).map(img => img.id);
    return ids.length > 0 && ids.every(id => selected.has(id));
  }, [grouped, selected]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const ids = Array.from(selected);
    try {
      await deleteImages(ids);
      setImages(prev => prev.filter(img => !selected.has(img.id)));
      setLastDeleted(ids.length);
      setSelected(new Set());
    } catch (e) {
      console.warn('Delete error:', e);
    } finally {
      setDeleting(false);
    }
  }, [selected]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBytes = images.reduce((s, i) => s + (i.fileSize || 0), 0);
    const selectedBytes = images
      .filter(i => selected.has(i.id))
      .reduce((s, i) => s + (i.fileSize || 0), 0);

    const byCategory: Record<string, { count: number; bytes: number }> = {};
    for (const img of images) {
      if (!byCategory[img.category]) byCategory[img.category] = { count: 0, bytes: 0 };
      byCategory[img.category].count++;
      byCategory[img.category].bytes += img.fileSize || 0;
    }

    return {
      total: images.length,
      totalBytes,
      selectedCount: selected.size,
      selectedBytes,
      byCategory,
    };
  }, [images, selected]);

  return {
    images,
    filteredImages,
    grouped,
    buckets,
    selected,
    scanning,
    scanProgress,
    permissionStatus,
    activeCategory,
    deleting,
    lastDeleted,
    stats,
    // Actions
    scan,
    toggleSelect,
    selectBucket,
    selectCategory,
    clearSelection,
    isBucketFullySelected,
    deleteSelected,
    setActiveCategory,
    requestPermission,
  };
}
