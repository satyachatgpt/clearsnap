import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { colors, CAT_CONFIG } from '../utils/theme';
import { AnalyzedImage } from '../utils/imageAnalyzer';

const COLS = 3;
const CELL = (Dimensions.get('window').width - 4) / COLS;

export function TimelineScreen() {
  const {
    grouped, buckets, selected, scanning, scanProgress,
    activeCategory, stats, deleting,
    scan, toggleSelect, selectBucket, clearSelection,
    isBucketFullySelected, deleteSelected, setActiveCategory,
  } = useGalleryContext();

  const CATS = ['all', 'whatsapp', 'screenshot', 'facebook', 'promo', 'personal', 'received'];
  const CAT_LABELS: Record<string, string> = {
    all: 'All', whatsapp: 'WhatsApp', screenshot: 'Screenshots',
    facebook: 'Facebook', promo: 'Promos', personal: 'Personal', received: 'Received',
  };

  type Row =
    | { type: 'header'; bucket: string; count: number }
    | { type: 'grid'; images: AnalyzedImage[] };

  const rows: Row[] = [];
  for (const bucket of buckets) {
    const imgs = grouped[bucket] ?? [];
    rows.push({ type: 'header', bucket, count: imgs.length });
    for (let i = 0; i < imgs.length; i += COLS) {
      rows.push({ type: 'grid', images: imgs.slice(i, i + COLS) });
    }
  }

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === 'header') {
      const full = isBucketFullySelected(item.bucket);
      return (
        <View style={styles.bucketHeader}>
          <View style={styles.bucketLeft}>
            <Text style={styles.bucketTitle}>{item.bucket.toUpperCase()}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.count}</Text></View>
          </View>
          <TouchableOpacity onPress={() => selectBucket(item.bucket)}>
            <Text style={styles.selAll}>{full ? 'Deselect all' : 'Select all'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.row}>
        {item.images.map(img => {
          const sel = selected.has(img.id);
          const catColor = CAT_CONFIG[img.category]?.color ?? colors.muted;
          return (
            <TouchableOpacity key={img.id} style={styles.cell} onPress={() => toggleSelect(img.id)} activeOpacity={0.8}>
              <Image source={{ uri: img.uri }} style={styles.thumb} />
              <View style={[styles.catBar, { backgroundColor: catColor }]} />
              {sel && <View style={styles.selOverlay} />}
              <View style={[styles.chk, sel && styles.chkSel]}>
                {sel && <Ionicons name="checkmark" size={11} color="#000" />}
              </View>
            </TouchableOpacity>
          );
        })}
        {item.images.length < COLS && Array.from({ length: COLS - item.images.length }).map((_, i) => (
          <View key={i} style={styles.cell} />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Clear<Text style={styles.accent}>Snap</Text></Text>
          <TouchableOpacity style={styles.scanBtn} onPress={scan} disabled={scanning}>
            {scanning ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.scanBtnText}>{stats.total === 0 ? 'Scan Gallery' : 'Rescan'}</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.pills}>
          <View style={styles.pill}><Text style={styles.pillVal}>{stats.total}</Text><Text style={styles.pillLbl}> photos</Text></View>
          {stats.selectedCount > 0 && <View style={styles.pill}><Text style={[styles.pillVal, { color: colors.green }]}>{stats.selectedCount}</Text><Text style={styles.pillLbl}> selected</Text></View>}
        </View>
      </View>

      {scanning && (
        <View style={styles.progress}>
          <Text style={styles.progressText}>Scanning {scanProgress.loaded} / {scanProgress.total || '?'}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: scanProgress.total ? `${Math.round(scanProgress.loaded / scanProgress.total * 100)}%` : '0%' }]} />
          </View>
        </View>
      )}

      {stats.total > 0 && !scanning && (
        <View style={styles.chips}>
          {CATS.map(cat => {
            const on = activeCategory === cat;
            const color = cat === 'all' ? colors.green : (CAT_CONFIG[cat]?.color ?? colors.green);
            return (
              <TouchableOpacity key={cat} style={[styles.chip, on && { backgroundColor: color, borderColor: color }]} onPress={() => setActiveCategory(cat as any)}>
                <Text style={[styles.chipText, on && { color: '#000' }]}>{CAT_LABELS[cat]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {stats.total === 0 && !scanning ? (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={64} color={colors.muted} />
          <Text style={styles.emptyTitle}>Tap "Scan Gallery" to start</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderRow}
          initialNumToRender={30}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.bbar}>
        <View>
          <Text style={styles.bbarSel}>{stats.selectedCount} selected</Text>
        </View>
        <View style={styles.bbarBtns}>
          {stats.selectedCount > 0 && (
            <TouchableOpacity style={styles.clrBtn} onPress={clearSelection}>
              <Text style={styles.clrText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.delBtn, !stats.selectedCount && styles.delBtnOff]} onPress={stats.selectedCount ? deleteSelected : undefined}>
            {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[styles.delText, !stats.selectedCount && { color: colors.muted }]}>Delete</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.bg },
  header:      { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 8 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:       { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  accent:      { color: colors.green },
  scanBtn:     { backgroundColor: colors.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  scanBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
  pills:       { flexDirection: 'row', gap: 8 },
  pill:        { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillVal:     { fontSize: 13, fontWeight: '700', color: colors.text },
  pillLbl:     { fontSize: 13, color: colors.muted },
  progress:    { paddingHorizontal: 18, marginBottom: 8 },
  progressText:{ fontSize: 12, color: colors.muted, marginBottom: 4 },
  progressTrack: { height: 3, backgroundColor: colors.card, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: colors.green },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 6, paddingBottom: 8 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipText:    { fontSize: 12, fontWeight: '600', color: colors.muted },
  bucketHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  bucketLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.8 },
  badge:       { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:   { fontSize: 11, color: colors.sub },
  selAll:      { fontSize: 12, color: colors.green, fontWeight: '600' },
  row:         { flexDirection: 'row', gap: 2, marginHorizontal: 2 },
  cell:        { width: CELL, height: CELL, overflow: 'hidden' },
  thumb:       { width: '100%', height: '100%' },
  catBar:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  selOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,201,167,0.25)' },
  chk:         { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  chkSel:      { backgroundColor: colors.green, borderColor: colors.green },
  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle:  { fontSize: 16, color: colors.muted },
  bbar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, paddingBottom: 28, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  bbarSel:     { fontSize: 14, fontWeight: '600', color: colors.text },
  bbarBtns:    { flexDirection: 'row', gap: 8 },
  clrBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  clrText:     { fontSize: 13, color: colors.sub, fontWeight: '600' },
  delBtn:      { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.red, minWidth: 70, alignItems: 'center' },
  delBtnOff:   { backgroundColor: colors.card },
  delText:     { fontSize: 13, fontWeight: '700', color: '#fff' },
});
