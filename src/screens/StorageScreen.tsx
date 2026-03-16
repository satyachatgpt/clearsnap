import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGalleryContext } from '../context/GalleryContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS, colors } from '../utils/theme';

export function StorageScreen() {
  const { stats } = useGalleryContext();
  const total = stats.totalBytes;

  const slices = CAT_KEYS
    .map(cat => ({ cat, bytes: stats.byCategory[cat]?.bytes ?? 0, color: CAT_CONFIG[cat].color }))
    .filter(s => s.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage</Text>
        <Text style={styles.sub}>Total: {formatSize(total)}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Bar chart */}
        <View style={styles.barChart}>
          {slices.map(s => {
            const pct = total > 0 ? s.bytes / total : 0;
            return (
              <View key={s.cat} style={[styles.barSegment, { flex: pct, backgroundColor: s.color }]} />
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {slices.map(s => {
            const pct = total > 0 ? Math.round(s.bytes / total * 100) : 0;
            return (
              <View key={s.cat} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={styles.legendLabel}>{CAT_CONFIG[s.cat].label}</Text>
                <Text style={styles.legendPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Rows */}
        <View style={styles.rows}>
          {slices.map(s => {
            const pct = total > 0 ? s.bytes / total : 0;
            return (
              <View key={s.cat} style={styles.storRow}>
                <View style={styles.storTop}>
                  <Text style={styles.storLabel}>{CAT_CONFIG[s.cat].label}</Text>
                  <Text style={styles.storSize}>{formatSize(s.bytes)} · {Math.round(pct * 100)}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: s.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {total === 0 && (
          <Text style={styles.empty}>Scan your gallery first to see storage stats.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.bg },
  header:   { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  title:    { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  sub:      { fontSize: 13, color: colors.muted, marginTop: 4 },
  content:  { paddingBottom: 40 },
  barChart: { flexDirection: 'row', height: 16, marginHorizontal: 18, borderRadius: 8, overflow: 'hidden', marginBottom: 20 },
  barSegment: { height: '100%' },
  legend:   { paddingHorizontal: 18, marginBottom: 24, gap: 8 },
  legendRow:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.sub },
  legendPct:   { fontSize: 13, fontWeight: '700', color: colors.text },
  rows:     { paddingHorizontal: 18, gap: 10 },
  storRow:  { backgroundColor: colors.card, borderRadius: 10, padding: 12 },
  storTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  storLabel:{ fontSize: 13, fontWeight: '600', color: colors.text },
  storSize: { fontSize: 12, color: colors.muted },
  track:    { height: 5, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 3 },
  empty:    { textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 60 },
});
