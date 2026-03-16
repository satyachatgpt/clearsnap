// src/components/ImageGrid.tsx

import React, { memo } from 'react';
import {
  View, FlatList, Image, TouchableOpacity,
  StyleSheet, Text, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnalyzedImage } from '../utils/imageAnalyzer';
import { colors, CAT_CONFIG } from '../utils/theme';

const { width } = Dimensions.get('window');
const COLS = 3;
const CELL = (width - 4) / COLS;

interface Props {
  grouped: Record<string, AnalyzedImage[]>;
  buckets: string[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectBucket: (bucket: string) => void;
  isBucketFullySelected: (bucket: string) => boolean;
}

const ImageCell = memo(({
  item, selected, onToggle,
}: {
  item: AnalyzedImage;
  selected: boolean;
  onToggle: (id: string) => void;
}) => {
  const catColor = CAT_CONFIG[item.category]?.color ?? colors.muted;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onToggle(item.id)}
      style={[styles.cell, selected && styles.cellSelected]}
    >
      <Image source={{ uri: item.uri }} style={styles.thumb} />

      {/* Category colour bar at bottom */}
      <View style={[styles.catBar, { backgroundColor: catColor }]} />

      {/* Selection overlay */}
      {selected && <View style={styles.selOverlay} />}

      {/* Checkmark */}
      <View style={[styles.chk, selected && { backgroundColor: colors.green, borderColor: colors.green }]}>
        {selected && <Ionicons name="checkmark" size={12} color="#000" />}
      </View>
    </TouchableOpacity>
  );
});

export function ImageGrid({ grouped, buckets, selected, onToggle, onSelectBucket, isBucketFullySelected }: Props) {
  // Flatten into sections for FlatList
  type Row =
    | { type: 'header'; bucket: string; count: number; fullySelected: boolean }
    | { type: 'row'; images: AnalyzedImage[] };

  const rows: Row[] = [];
  for (const bucket of buckets) {
    const imgs = grouped[bucket] ?? [];
    rows.push({ type: 'header', bucket, count: imgs.length, fullySelected: isBucketFullySelected(bucket) });
    // chunk into rows of COLS
    for (let i = 0; i < imgs.length; i += COLS) {
      rows.push({ type: 'row', images: imgs.slice(i, i + COLS) });
    }
  }

  const renderItem = ({ item }: { item: Row }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.bucketHeader}>
          <View style={styles.bucketLeft}>
            <Text style={styles.bucketTitle}>{item.bucket.toUpperCase()}</Text>
            <View style={styles.bucketBadge}>
              <Text style={styles.bucketBadgeText}>{item.count}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onSelectBucket(item.bucket)}>
            <Text style={styles.selAll}>
              {item.fullySelected ? 'Deselect all' : 'Select all'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.row}>
        {item.images.map(img => (
          <ImageCell
            key={img.id}
            item={img}
            selected={selected.has(img.id)}
            onToggle={onToggle}
          />
        ))}
        {/* Fill empty cells in last row */}
        {item.images.length < COLS &&
          Array.from({ length: COLS - item.images.length }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.cellEmpty} />
          ))}
      </View>
    );
  };

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyText}>No images found</Text>
        <Text style={styles.emptySubText}>Try changing the filter above</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderItem}
      initialNumToRender={30}
      maxToRenderPerBatch={30}
      windowSize={5}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  bucketHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },
  bucketLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketTitle:  { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.8 },
  bucketBadge:  { backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  bucketBadgeText: { fontSize: 11, color: colors.sub },
  selAll:       { fontSize: 12, color: colors.green, fontWeight: '600' },

  row:  { flexDirection: 'row', gap: 2, marginHorizontal: 2 },
  cell: { width: CELL, height: CELL, overflow: 'hidden' },
  cellSelected: {},
  cellEmpty:    { width: CELL, height: CELL },
  thumb:        { width: '100%', height: '100%' },
  catBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  selOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,201,167,0.25)' },
  chk: {
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText:    { fontSize: 16, color: colors.muted, fontWeight: '600' },
  emptySubText: { fontSize: 13, color: colors.muted },
});
