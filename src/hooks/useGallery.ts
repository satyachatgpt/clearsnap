import { useState, useCallback, useMemo, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';
import {
  AnalyzedImage, Category, DuplicateGroup, Album,
  scanGallery, deleteImages, groupByBucket, sortedBuckets,
  detectDuplicates, getAlbums, getMonthlyBreakdown, MonthlyCount,
} from '../utils/imageAnalyzer';
import {
  getProtectedIds, saveProtectedIds,
  addToDeleteHistory, getScanHistory, addScanRecord,
  DeleteRecord, ScanRecord,
} from '../utils/storage';

export type FilterCategory = Category | 'all';
export type SortMode = 'newest' | 'oldest' | 'largest' | 'smallest';

export function useGallery() {
  const [images, setImages]           = useState<AnalyzedImage[]>([]);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [protectedIds, setProtectedIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning]       = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [scanProgress, setScanProgress] = useState({ loaded: 0, total: 0 });
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sortMode, setSortMode]       = useState<SortMode>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom]       = useState<Date | null>(null);
  const [dateTo, setDateTo]           = useState<Date | null>(null);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [minResolution, setMinResolution] = useState(0);
  const [blurryOnly, setBlurryOnly]   = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [albums, setAlbums]           = useState<Album[]>([]);
  const [deleteHistory, setDeleteHistory] = useState<DeleteRecord[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyCount[]>([]);

  // Load persisted data
  useEffect(() => {
    getProtectedIds().then(ids => setProtectedIds(ids));
    getScanHistory().then(h => setScanHistory(h));
  }, []);

  const scan = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    setScanning(true);
    setSelected(new Set());
    setScanProgress({ loaded: 0, total: 0 });
    try {
      const result = await scanGallery(includeVideos, (loaded, total) => setScanProgress({ loaded, total }));
      const protected_ = await getProtectedIds();
      const tagged = result.map(img => ({ ...img, isProtected: protected_.has(img.id) }));
      setImages(tagged);
      setDuplicateGroups(detectDuplicates(tagged));
      setMonthlyData(getMonthlyBreakdown(tagged));
      const albumList = await getAlbums();
      setAlbums(albumList);
      const record: ScanRecord = {
        scannedAt: Date.now(),
        totalPhotos: tagged.filter(i => i.mediaType === 'photo').length,
        totalVideos: tagged.filter(i => i.mediaType === 'video').length,
        totalBytes: tagged.reduce((s, i) => s + i.fileSize, 0),
      };
      await addScanRecord(record);
      setScanHistory(prev => [record, ...prev].slice(0, 30));
    } finally {
      setScanning(false);
    }
  }, [includeVideos]);

  // Filtered + sorted images
  const filteredImages = useMemo(() => {
    let list = images;
    if (activeCategory !== 'all') list = list.filter(i => i.category === activeCategory);
    if (mediaTypeFilter !== 'all') list = list.filter(i => i.mediaType === mediaTypeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.filename.toLowerCase().includes(q));
    }
    if (dateFrom) list = list.filter(i => i.creationTime >= dateFrom.getTime());
    if (dateTo)   list = list.filter(i => i.creationTime <= dateTo.getTime());
    if (blurryOnly) list = list.filter(i => i.isBlurry);
    if (minResolution > 0) list = list.filter(i => i.width * i.height < minResolution * minResolution);

    switch (sortMode) {
      case 'newest':   list = [...list].sort((a, b) => b.creationTime - a.creationTime); break;
      case 'oldest':   list = [...list].sort((a, b) => a.creationTime - b.creationTime); break;
      case 'largest':  list = [...list].sort((a, b) => b.fileSize - a.fileSize); break;
      case 'smallest': list = [...list].sort((a, b) => a.fileSize - b.fileSize); break;
    }
    return list;
  }, [images, activeCategory, mediaTypeFilter, searchQuery, dateFrom, dateTo, blurryOnly, minResolution, sortMode]);

  const grouped = useMemo(() => groupByBucket(filteredImages), [filteredImages]);
  const buckets = useMemo(() => sortedBuckets(grouped), [grouped]);

  // Selection
  const toggleSelect = useCallback((id: string) => {
    const img = images.find(i => i.id === id);
    if (img?.isProtected) return;
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, [images]);

  const selectBucket = useCallback((bucket: string) => {
    const ids = (grouped[bucket] ?? []).filter(i => !i.isProtected).map(i => i.id);
    setSelected(prev => {
      const n = new Set(prev);
      const allIn = ids.every(id => n.has(id));
      ids.forEach(id => allIn ? n.delete(id) : n.add(id));
      return n;
    });
  }, [grouped]);

  const selectOlderThan = useCallback((days: number) => {
    const cutoff = Date.now() - days * 86_400_000;
    const ids = images.filter(i => i.creationTime < cutoff && !i.isProtected).map(i => i.id);
    setSelected(new Set(ids));
  }, [images]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const isBucketFullySelected = useCallback((bucket: string) => {
    const ids = (grouped[bucket] ?? []).filter(i => !i.isProtected).map(i => i.id);
    return ids.length > 0 && ids.every(id => selected.has(id));
  }, [grouped, selected]);

  // Protect
  const toggleProtect = useCallback(async (id: string) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, isProtected: !img.isProtected } : img));
    setProtectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveProtectedIds(next);
      return next;
    });
  }, []);

  // Delete
  const _doDelete = useCallback(async (ids: string[]) => {
    const toDelete = images.filter(i => ids.includes(i.id) && !i.isProtected);
    const safeIds = toDelete.map(i => i.id);
    if (!safeIds.length) return;
    const records: DeleteRecord[] = toDelete.map(i => ({
      id: i.id, filename: i.filename, category: i.category,
      deletedAt: Date.now(), fileSize: i.fileSize,
    }));
    await deleteImages(safeIds);
    await addToDeleteHistory(records);
    setDeleteHistory(prev => [...records, ...prev].slice(0, 200));
    setImages(prev => {
      const next = prev.filter(i => !safeIds.includes(i.id));
      setDuplicateGroups(detectDuplicates(next));
      setMonthlyData(getMonthlyBreakdown(next));
      return next;
    });
    setSelected(prev => { const n = new Set(prev); safeIds.forEach(id => n.delete(id)); return n; });
  }, [images]);

  const deleteSelected = useCallback(async () => {
    if (!selected.size) return;
    setDeleting(true);
    try { await _doDelete(Array.from(selected)); }
    finally { setDeleting(false); }
  }, [selected, _doDelete]);

  const deleteIds = useCallback(async (ids: string[]) => {
    setDeleting(true);
    try { await _doDelete(ids); }
    finally { setDeleting(false); }
  }, [_doDelete]);

  // Share
  const shareSelected = useCallback(async () => {
    const uris = images.filter(i => selected.has(i.id)).map(i => i.uri);
    if (!uris.length) return;
    try {
      await Share.share({ message: uris.join('\n'), url: uris[0] });
    } catch {}
  }, [images, selected]);

  // Stats
  const stats = useMemo(() => {
    const totalBytes    = images.reduce((s, i) => s + i.fileSize, 0);
    const selectedBytes = images.filter(i => selected.has(i.id)).reduce((s, i) => s + i.fileSize, 0);
    const byCategory: Record<string, { count: number; bytes: number }> = {};
    const photos = images.filter(i => i.mediaType === 'photo').length;
    const videos = images.filter(i => i.mediaType === 'video').length;
    const blurry = images.filter(i => i.isBlurry).length;
    const privacy = images.filter(i => i.isPrivacyRisk).length;
    const protected_ = images.filter(i => i.isProtected).length;
    for (const img of images) {
      if (!byCategory[img.category]) byCategory[img.category] = { count: 0, bytes: 0 };
      byCategory[img.category].count++;
      byCategory[img.category].bytes += img.fileSize;
    }
    const dupSaving = duplicateGroups.reduce((s, g) => s + g.potentialSaving, 0);
    return { total: images.length, totalBytes, selectedCount: selected.size, selectedBytes, byCategory, dupSaving, photos, videos, blurry, privacy, protected: protected_ };
  }, [images, selected, duplicateGroups]);

  return {
    images, filteredImages, grouped, buckets, selected, protectedIds,
    scanning, scanProgress, deleting, activeCategory, sortMode, searchQuery,
    dateFrom, dateTo, includeVideos, mediaTypeFilter, blurryOnly, minResolution,
    stats, duplicateGroups, albums, deleteHistory, scanHistory, monthlyData,
    scan, toggleSelect, selectBucket, selectOlderThan, clearSelection,
    isBucketFullySelected, deleteSelected, deleteIds, shareSelected,
    toggleProtect, setActiveCategory, setSortMode, setSearchQuery,
    setDateFrom, setDateTo, setIncludeVideos, setMediaTypeFilter,
    setBlurryOnly, setMinResolution,
  };
}
