import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS, colors } from '../utils/theme';

export function CategoriesScreen() {
  const { stats, setActiveCategory } = useGalleryContext();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.sub}>{stats.total} photos</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {CAT_KEYS.map(cat => {
          const cfg = CAT_CONFIG[cat];
          const info = stats.byCategory[cat] ?? { count: 0, bytes: 0 };
          if (!info.count) return null;
          const pct = stats.total > 0 ? Math.round(info.count / stats.total * 100) : 0;
          return (
            <TouchableOpacity key={cat} style={styles.row} onPress={() => setActiveCategory(cat as any)} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: cfg.color + '20' }]}>
                <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.label}>{cfg.label}</Text>
                <Text style={styles.detail}>{info.count} images · {formatSize(info.bytes)}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                </View>
              </View>
              <Text style={styles.pct}>{pct}%</Text>
            </TouchableOpacity>
          );
        })}
        {stats.total === 0 && (
          <View style={styles.empty}>
            <Ionicons name="grid-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>Scan your gallery first</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.bg },
  header:  { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  title:   { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  sub:     { fontSize: 13, color: colors.muted, marginTop: 4 },
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  meta:    { flex: 1 },
  label:   { fontSize: 15, fontWeight: '600', color: colors.text },
  detail:  { fontSize: 12, color: colors.muted, marginTop: 2 },
  track:   { height: 3, backgroundColor: colors.card, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  fill:    { height: '100%', borderRadius: 2 },
  pct:     { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 12 },
  empty:   { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: colors.muted },
});
