// src/screens/CategoriesScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS, colors } from '../utils/theme';

export function CategoriesScreen() {
  const { stats, setActiveCategory } = useGalleryContext();
  const total = stats.total;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>{total} photos · {formatSize(stats.totalBytes)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {CAT_KEYS.map(cat => {
          const cfg = CAT_CONFIG[cat];
          const info = stats.byCategory[cat] ?? { count: 0, bytes: 0 };
          if (info.count === 0) return null;
          const pct = total > 0 ? Math.round(info.count / total * 100) : 0;

          return (
            <TouchableOpacity
              key={cat}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setActiveCategory(cat as any)}
            >
              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: cfg.color + '20' }]}>
                <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>

              {/* Info */}
              <View style={styles.meta}>
                <Text style={styles.rowLabel}>{cfg.label}</Text>
                <Text style={styles.rowSub}>{info.count} images · {formatSize(info.bytes)}</Text>
                {/* Progress bar */}
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                </View>
              </View>

              {/* Percent + chevron */}
              <View style={styles.right}>
                <Text style={styles.pct}>{pct}%</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: colors.bg },
  header:   { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  title:    { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },
  list:     { paddingBottom: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconBox:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  meta:     { flex: 1, gap: 3 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub:   { fontSize: 12, color: colors.muted },
  track:    { height: 3, backgroundColor: colors.card, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  fill:     { height: '100%', borderRadius: 2 },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pct:      { fontSize: 14, fontWeight: '700', color: colors.text },
});
