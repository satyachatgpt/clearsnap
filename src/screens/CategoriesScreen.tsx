import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { useTheme } from '../context/ThemeContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS } from '../utils/theme';

type AlbumView = 'categories' | 'albums';

export function CategoriesScreen() {
  const g = useGalleryContext();
  const { colors, theme, toggleTheme } = useTheme();
  const [view, setView] = useState<AlbumView>('categories');
  const s = makeStyles(colors);

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Organise</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        {/* Toggle */}
        <View style={s.toggle}>
          <TouchableOpacity style={[s.toggleBtn, view === 'categories' && { backgroundColor: colors.green }]} onPress={() => setView('categories')}>
            <Text style={[s.toggleText, view === 'categories' && { color: '#fff' }]}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleBtn, view === 'albums' && { backgroundColor: colors.blue }]} onPress={() => setView('albums')}>
            <Text style={[s.toggleText, view === 'albums' && { color: '#fff' }]}>Albums</Text>
          </TouchableOpacity>
        </View>
      </View>

      {g.stats.total === 0 ? (
        <View style={s.empty}>
          <Ionicons name="grid-outline" size={56} color={colors.muted} />
          <Text style={s.emptyTitle}>Scan your gallery first</Text>
          <Text style={s.emptySub}>Go to Timeline and tap Scan</Text>
        </View>
      ) : view === 'categories' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {CAT_KEYS.map(cat => {
            const cfg = CAT_CONFIG[cat];
            const info = g.stats.byCategory[cat] ?? { count: 0, bytes: 0 };
            if (!info.count) return null;
            const pct = g.stats.total > 0 ? Math.round(info.count / g.stats.total * 100) : 0;
            return (
              <TouchableOpacity key={cat} style={s.row} onPress={() => g.setActiveCategory(cat as any)} activeOpacity={0.7}>
                <View style={[s.iconBox, { backgroundColor: cfg.color + '20' }]}>
                  <Ionicons name={cfg.icon as any} size={24} color={cfg.color} />
                </View>
                <View style={s.meta}>
                  <Text style={s.label}>{cfg.label}</Text>
                  <Text style={s.detail}>{info.count} files · {formatSize(info.bytes)}</Text>
                  <View style={s.track}>
                    <View style={[s.fill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                  </View>
                </View>
                <View style={s.right}>
                  <Text style={s.pct}>{pct}%</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.albumGrid}>
          {g.albums.length === 0 ? (
            <View style={s.empty}>
              <ActivityIndicator color={colors.green} />
              <Text style={s.emptySub}>Loading albums...</Text>
            </View>
          ) : g.albums.map(album => (
            <View key={album.id} style={s.albumCard}>
              {album.coverUri
                ? <Image source={{ uri: album.coverUri }} style={s.albumCover} />
                : <View style={[s.albumCover, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="images-outline" size={32} color={colors.muted} />
                  </View>
              }
              <Text style={s.albumTitle} numberOfLines={1}>{album.title}</Text>
              <Text style={s.albumCount}>{album.count} items</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  toggle: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  toggleText: { fontSize: 14, fontWeight: '600', color: c.muted },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  meta: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: c.text },
  detail: { fontSize: 13, color: c.muted, marginTop: 2 },
  track: { height: 4, backgroundColor: c.card, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  fill: { height: '100%', borderRadius: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pct: { fontSize: 15, fontWeight: '700', color: c.text },
  albumGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  albumCard: { width: '47%' },
  albumCover: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  albumTitle: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 6 },
  albumCount: { fontSize: 12, color: c.muted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: c.text },
  emptySub: { fontSize: 14, color: c.muted, textAlign: 'center', paddingHorizontal: 40 },
});
