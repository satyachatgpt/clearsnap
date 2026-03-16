// src/screens/StorageScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGalleryContext } from '../context/GalleryContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS, colors } from '../utils/theme';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

const R = 52;
const CX = 70;
const CY = 70;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface SliceProps {
  color: string;
  fraction: number;
  offset: number;
}

function DonutSlice({ color, fraction, offset }: SliceProps) {
  const dash = fraction * CIRCUMFERENCE;
  return (
    <Circle
      cx={CX} cy={CY} r={R}
      fill="none"
      stroke={color}
      strokeWidth={18}
      strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
      strokeDashoffset={-offset}
      transform={`rotate(-90 ${CX} ${CY})`}
    />
  );
}

export function StorageScreen() {
  const { stats } = useGalleryContext();
  const totalBytes = stats.totalBytes;

  const slices = CAT_KEYS
    .map(cat => ({
      cat,
      bytes: stats.byCategory[cat]?.bytes ?? 0,
      color: CAT_CONFIG[cat].color,
    }))
    .filter(s => s.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  let offsetAcc = 0;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Storage</Text>
        <Text style={styles.subtitle}>Total: {formatSize(totalBytes)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Donut chart */}
        <View style={styles.donutRow}>
          <Svg width={140} height={140} viewBox="0 0 140 140">
            {/* Background ring */}
            <Circle cx={CX} cy={CY} r={R} fill="none" stroke={colors.card} strokeWidth={18} />
            {slices.map(s => {
              const fraction = totalBytes > 0 ? s.bytes / totalBytes : 0;
              const node = (
                <DonutSlice
                  key={s.cat}
                  color={s.color}
                  fraction={fraction}
                  offset={offsetAcc}
                />
              );
              offsetAcc += fraction * CIRCUMFERENCE;
              return node;
            })}
            <SvgText x={CX} y={CY - 6} textAnchor="middle" fill={colors.text} fontSize={16} fontWeight="700">
              {formatSize(totalBytes).split(' ')[0]}
            </SvgText>
            <SvgText x={CX} y={CY + 10} textAnchor="middle" fill={colors.muted} fontSize={11}>
              {formatSize(totalBytes).split(' ')[1]}
            </SvgText>
          </Svg>

          {/* Legend */}
          <View style={styles.legend}>
            {slices.map(s => (
              <View key={s.cat} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={styles.legendLabel}>{CAT_CONFIG[s.cat].label.split(' ')[0]}</Text>
                <Text style={styles.legendVal}>
                  {totalBytes > 0 ? Math.round(s.bytes / totalBytes * 100) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bar rows */}
        <View style={styles.rows}>
          {slices.map(s => {
            const pct = totalBytes > 0 ? s.bytes / totalBytes : 0;
            return (
              <View key={s.cat} style={styles.storRow}>
                <View style={styles.storTop}>
                  <Text style={styles.storLabel}>
                    {CAT_CONFIG[s.cat].label}
                  </Text>
                  <Text style={styles.storSize}>
                    {formatSize(s.bytes)} · {Math.round(pct * 100)}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: s.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {totalBytes === 0 && (
          <Text style={styles.empty}>Scan your gallery first to see storage stats.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.bg },
  header:    { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  title:     { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle:  { fontSize: 13, color: colors.muted, marginTop: 4 },
  content:   { paddingBottom: 40 },
  donutRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 20, gap: 16 },
  legend:    { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 12, color: colors.sub },
  legendVal: { fontSize: 12, fontWeight: '700', color: colors.text },
  rows:      { paddingHorizontal: 18, gap: 12 },
  storRow:   { backgroundColor: colors.card, borderRadius: 10, padding: 12 },
  storTop:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  storLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  storSize:  { fontSize: 12, color: colors.muted },
  track:     { height: 5, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' },
  fill:      { height: '100%', borderRadius: 3 },
  empty:     { textAlign: 'center', color: colors.muted, fontSize: 14, marginTop: 60 },
});
