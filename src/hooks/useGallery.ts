import { useState, useCallback, useMemo } from 'react';
import * as MediaLibrary from 'expo-media-library';
import {
  AnalyzedImage, Category, scanGallery, deleteImages,
  groupByBucket, sortedBuckets,
} from '../utils/imageAnalyzer';

export type FilterCategory = Category | 'all';

export function useGallery() {
  const [images, setImages]         = useState<AnalyzedImage[]>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [scanning, setScanning]     = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [scanProgress, setScanProgress] = useState({ loaded: 0, total: 0 });
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  const scan = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    setScanning(true);
    setSelected(new Set());
    setScanProgress({ loaded: 0, total: 0 });
    try {
      const result = await scanGallery((loaded, total) => setScanProgress({ loaded, total }));
      setImages(result);
    } finally {
      setScanning(false);
    }
  }, []);

  const filteredImages = useMemo(() =>
    activeCategory === 'all' ? images : images.filter(i => i.category === activeCategory),
    [images, activeCategory]
  );

  const grouped  = useMemo(() => groupByBucket(filteredImages), [filteredImages]);
  const buckets  = useMemo(() => sortedBuckets(grouped), [grouped]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectBucket = useCallback((bucket: string) => {
    const ids = (grouped[bucket] ?? []).map(i => i.id);
    setSelected(prev => {
      const next = new Set(prev);
      const allIn = ids.every(id => next.has(id));
      ids.forEach(id => allIn ? next.delete(id) : next.add(id));
      return next;
    });
  }, [grouped]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const isBucketFullySelected = useCallback((bucket: string) => {
    const ids = (grouped[bucket] ?? []).map(i => i.id);
    return ids.length > 0 && ids.every(id => selected.has(id));
  }, [grouped, selected]);

  const deleteSelected = useCallback(async () => {
    if (!selected.size) return;
    setDeleting(true);
    try {
      await deleteImages(Array.from(selected));
      setImages(prev => prev.filter(i => !selected.has(i.id)));
      setSelected(new Set());
    } catch (e) {
      console.warn('Delete error:', e);
    } finally {
      setDeleting(false);
    }
  }, [selected]);

  const stats = useMemo(() => {
    const totalBytes    = images.reduce((s, i) => s + i.fileSize, 0);
    const selectedBytes = images.filter(i => selected.has(i.id)).reduce((s, i) => s + i.fileSize, 0);
    const byCategory: Record<string, { count: number; bytes: number }> = {};
    for (const img of images) {
      if (!byCategory[img.category]) byCategory[img.category] = { count: 0, bytes: 0 };
      byCategory[img.category].count++;
      byCategory[img.category].bytes += img.fileSize;
    }
    return { total: images.length, totalBytes, selectedCount: selected.size, selectedBytes, byCategory };
  }, [images, selected]);

  return {
    images, filteredImages, grouped, buckets, selected,
    scanning, scanProgress, deleting, activeCategory, stats,
    scan, toggleSelect, selectBucket, clearSelection,
    isBucketFullySelected, deleteSelected, setActiveCategory,
  };
}
