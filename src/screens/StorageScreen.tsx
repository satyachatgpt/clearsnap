import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { useTheme } from '../context/ThemeContext';
import { formatSize } from '../utils/imageAnalyzer';
import { CAT_CONFIG, CAT_KEYS } from '../utils/theme';

const W = Dimensions.get('window').width;

export function StorageScreen() {
  const g = useGalleryContext();
  const { colors, theme, toggleTheme } = useTheme();
  const s = makeStyles(colors);
  const total = g.stats.totalBytes;
  const slices = CAT_KEYS.map(cat => ({ cat, bytes: g.stats.byCategory[cat]?.bytes ?? 0, color: CAT_CONFIG[cat].color }))
    .filter(s => s.bytes > 0).sort((a, b) => b.bytes - a.bytes);

  const maxMonth = Math.max(...g.monthlyData.map(m => m.photos + m.videos), 1);

  if (g.stats.total === 0) {
    return (
      <View style={s.screen}>
        <View style={s.header}>
          <View style={s.headerRow}><Text style={s.title}>Storage</Text>
            <TouchableOpacity onPress={toggleTheme}><Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} /></TouchableOpacity>
          </View>
        </View>
        <View style={s.empty}>
          <Ionicons name="pie-chart-outline" size={72} color={colors.muted} />
          <Text style={s.emptyTitle}>No data yet</Text>
          <Text style={s.emptySub}>Scan your gallery to see storage analysis</Text>
          <TouchableOpacity style={[s.scanBtn, { backgroundColor: colors.green }]} onPress={g.scan} disabled={g.scanning}>
            <Text style={s.scanBtnText}>{g.scanning ? 'Scanning...' : 'Scan Gallery'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Storage</Text>
          <TouchableOpacity onPress={toggleTheme}><Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} /></TouchableOpacity>
        </View>
        <Text style={s.sub}>Estimated total: {formatSize(total)}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Summary row */}
        <View style={s.summRow}>
          {[
            { label: 'Photos', val: String(g.stats.photos), color: colors.blue },
            { label: 'Videos', val: String(g.stats.videos), color: colors.purple },
            { label: 'Total size', val: formatSize(total), color: colors.green },
            { label: 'Can save', val: formatSize(g.stats.dupSaving), color: colors.orange },
          ].map(item => (
            <View key={item.label} style={s.summCard}>
              <Text style={[s.summVal, { color: item.color }]}>{item.val}</Text>
              <Text style={s.summLbl}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        {slices.length > 0 && (
          <>
            <Text style={s.sectionTitle}>BY CATEGORY</Text>
            <View style={s.barChart}>
              {slices.map(sl => <View key={sl.cat} style={[s.barSeg, { flex: sl.bytes / total, backgroundColor: sl.color }]} />)}
            </View>
            <View style={s.rows}>
              {slices.map(sl => {
                const pct = Math.round(sl.bytes / total * 100);
                const count = g.stats.byCategory[sl.cat]?.count ?? 0;
                return (
                  <View key={sl.cat} style={s.storRow}>
                    <View style={[s.catDot, { backgroundColor: sl.color }]} />
                    <View style={s.storMeta}>
                      <Text style={s.storLabel}>{CAT_CONFIG[sl.cat].label}</Text>
                      <Text style={s.storCount}>{count} files</Text>
                    </View>
                    <Text style={s.storSize}>{formatSize(sl.bytes)}</Text>
                    <Text style={s.storPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Monthly chart */}
        {g.monthlyData.length > 0 && (
          <>
            <Text style={s.sectionTitle}>MONTHLY TREND (LAST 12 MONTHS)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.monthScroll}>
              <View style={s.monthChart}>
                {g.monthlyData.map(m => {
                  const total = m.photos + m.videos;
                  const h = Math.max(4, Math.round((total / maxMonth) * 100));
                  return (
                    <View key={m.label} style={s.monthBar}>
                      <Text style={s.monthCount}>{total}</Text>
                      <View style={s.monthBarOuter}>
                        <View style={[s.monthBarInner, { height: h, backgroundColor: colors.blue }]} />
                        {m.videos > 0 && <View style={[s.monthBarVideo, { height: Math.round((m.videos / maxMonth) * 100), backgroundColor: colors.purple }]} />}
                      </View>
                      <Text style={s.monthLabel}>{m.label.split(' ')[0]}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View style={s.monthLegend}>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.blue }]} /><Text style={s.legendText}>Photos</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.purple }]} /><Text style={s.legendText}>Videos</Text></View>
            </View>
          </>
        )}

        {/* Scan history trend */}
        {g.scanHistory.length > 1 && (
          <>
            <Text style={s.sectionTitle}>SCAN HISTORY</Text>
            <View style={s.histRows}>
              {g.scanHistory.slice(0, 5).map((rec, i) => (
                <View key={i} style={s.histRow}>
                  <View style={[s.histDot, { backgroundColor: i === 0 ? colors.green : colors.muted }]} />
                  <View style={s.histInfo}>
                    <Text style={s.histDate}>{new Date(rec.scannedAt).toLocaleDateString()}</Text>
                    <Text style={s.histDetail}>{rec.totalPhotos} photos · {rec.totalVideos} videos · {formatSize(rec.totalBytes)}</Text>
                  </View>
                  {i > 0 && (() => {
                    const prev = g.scanHistory[i - 1];
                    const diff = prev.totalPhotos - rec.totalPhotos;
                    return diff !== 0 ? (
                      <Text style={[s.histDiff, { color: diff > 0 ? colors.red : colors.green }]}>
                        {diff > 0 ? `+${diff}` : diff}
                      </Text>
                    ) : null;
                  })()}
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={s.note}>* Sizes estimated from photo dimensions</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: c.muted },
  content: { paddingBottom: 40 },
  summRow: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 20 },
  summCard: { flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
  summVal: { fontSize: 18, fontWeight: '700' },
  summLbl: { fontSize: 11, color: c.muted, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: c.muted, letterSpacing: 0.8, paddingHorizontal: 18, marginBottom: 10, marginTop: 4 },
  barChart: { flexDirection: 'row', height: 16, marginHorizontal: 18, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
  barSeg: { height: '100%' },
  rows: { paddingHorizontal: 18, gap: 6, marginBottom: 16 },
  storRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, gap: 10 },
  catDot: { width: 12, height: 12, borderRadius: 6 },
  storMeta: { flex: 1 },
  storLabel: { fontSize: 14, fontWeight: '600', color: c.text },
  storCount: { fontSize: 12, color: c.muted },
  storSize: { fontSize: 14, fontWeight: '600', color: c.text },
  storPct: { fontSize: 13, color: c.muted, minWidth: 36, textAlign: 'right' },
  monthScroll: { marginHorizontal: 18, marginBottom: 8 },
  monthChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 18 },
  monthBar: { alignItems: 'center', gap: 4 },
  monthCount: { fontSize: 10, color: c.muted },
  monthBarOuter: { width: 28, height: 100, backgroundColor: c.card, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  monthBarInner: { width: '100%', borderRadius: 6 },
  monthBarVideo: { position: 'absolute', bottom: 0, width: '40%', right: 0, borderRadius: 3 },
  monthLabel: { fontSize: 10, color: c.muted },
  monthLegend: { flexDirection: 'row', gap: 16, paddingHorizontal: 18, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: c.muted },
  histRows: { paddingHorizontal: 18, gap: 2, marginBottom: 16 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  histDot: { width: 10, height: 10, borderRadius: 5 },
  histInfo: { flex: 1 },
  histDate: { fontSize: 14, fontWeight: '600', color: c.text },
  histDetail: { fontSize: 12, color: c.muted, marginTop: 2 },
  histDiff: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, color: c.sub, textAlign: 'center', paddingHorizontal: 18, marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  emptySub: { fontSize: 15, color: c.muted, textAlign: 'center' },
  scanBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  scanBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
