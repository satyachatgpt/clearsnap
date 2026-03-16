// src/screens/TimelineScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { ImageGrid } from '../components/ImageGrid';
import { CategoryChips } from '../components/CategoryChips';
import { BottomBar } from '../components/BottomBar';
import { formatSize } from '../utils/imageAnalyzer';
import { colors } from '../utils/theme';

export function TimelineScreen() {
  const {
    grouped, buckets, selected, scanning, scanProgress,
    activeCategory, stats, deleting,
    scan, toggleSelect, selectBucket, clearSelection,
    isBucketFullySelected, deleteSelected, setActiveCategory,
  } = useGalleryContext();

  const catCounts = Object.fromEntries(
    Object.entries(stats.byCategory).map(([k, v]) => [k, v.count])
  );

  return (
    <View style={styles.screen}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Clear<Text style={styles.titleAccent}>Snap</Text></Text>
          <TouchableOpacity
            style={[styles.scanBtn, scanning && styles.scanBtnBusy]}
            onPress={scan}
            disabled={scanning}
          >
            {scanning
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={styles.scanBtnText}>
                  {stats.total === 0 ? 'Scan Gallery' : 'Rescan'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Stat pills */}
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillVal}>{stats.total}</Text>
            <Text style={styles.pillLabel}> photos</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillVal}>{formatSize(stats.totalBytes)}</Text>
            <Text style={styles.pillLabel}> used</Text>
          </View>
          {stats.selectedCount > 0 && (
            <View style={[styles.pill, styles.pillAccent]}>
              <Text style={[styles.pillVal, { color: colors.green }]}>{stats.selectedCount}</Text>
              <Text style={styles.pillLabel}> selected</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Scanning progress ──────────────────────────────────────── */}
      {scanning && (
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            Scanning… {scanProgress.loaded} / {scanProgress.total || '?'} photos
          </Text>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: scanProgress.total
                  ? `${Math.round(scanProgress.loaded / scanProgress.total * 100)}%`
                  : '0%' }
            ]} />
          </View>
        </View>
      )}

      {/* ── Category chips ─────────────────────────────────────────── */}
      {stats.total > 0 && !scanning && (
        <CategoryChips
          active={activeCategory}
          counts={catCounts}
          onChange={setActiveCategory}
        />
      )}

      {/* ── Image grid ─────────────────────────────────────────────── */}
      <View style={styles.grid}>
        {stats.total === 0 && !scanning ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={colors.muted} />
            <Text style={styles.emptyTitle}>Your gallery is empty</Text>
            <Text style={styles.emptyBody}>Tap "Scan Gallery" to load your photos</Text>
          </View>
        ) : (
          <ImageGrid
            grouped={grouped}
            buckets={buckets}
            selected={selected}
            onToggle={toggleSelect}
            onSelectBucket={selectBucket}
            isBucketFullySelected={isBucketFullySelected}
          />
        )}
      </View>

      {/* ── Bottom action bar ──────────────────────────────────────── */}
      <BottomBar
        selectedCount={stats.selectedCount}
        selectedBytes={stats.selectedBytes}
        deleting={deleting}
        onDelete={deleteSelected}
        onClear={clearSelection}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.bg },
  header:  { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 6 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:   { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  titleAccent: { color: colors.green },
  scanBtn: {
    backgroundColor: colors.green, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, minWidth: 80, alignItems: 'center',
  },
  scanBtnBusy:    { opacity: 0.7 },
  scanBtnText:    { fontSize: 13, fontWeight: '700', color: '#000' },
  pills:   { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillAccent:  { borderWidth: 1, borderColor: colors.green + '40' },
  pillVal:     { fontSize: 13, fontWeight: '700', color: colors.text },
  pillLabel:   { fontSize: 13, color: colors.muted },
  progress:    { paddingHorizontal: 18, paddingBottom: 10 },
  progressText:{ fontSize: 12, color: colors.muted, marginBottom: 6 },
  progressTrack: { height: 3, backgroundColor: colors.card, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: colors.green, borderRadius: 2 },
  grid:  { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.muted },
  emptyBody:  { fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 40 },
});
