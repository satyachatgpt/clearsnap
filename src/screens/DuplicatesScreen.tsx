import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { useTheme } from '../context/ThemeContext';
import { formatSize } from '../utils/imageAnalyzer';

type DupFilter = 'all' | 'burst' | 'similar' | 'blurry';

export function DuplicatesScreen() {
  const g = useGalleryContext();
  const { colors, theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<DupFilter>('all');
  const s = makeStyles(colors);

  const blurryImages = g.images.filter(i => i.isBlurry);

  const filteredGroups = filter === 'blurry'
    ? []
    : g.duplicateGroups.filter(g => filter === 'all' || g.type === filter);

  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDeleteGroup = (keepId: string, deleteIds: string[]) => {
    Alert.alert('Delete Duplicates', `Delete ${deleteIds.length} duplicate${deleteIds.length > 1 ? 's' : ''}, keeping the first one?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => g.deleteIds(deleteIds) },
    ]);
  };

  const handleDeleteAllDuplicates = () => {
    const allToDelete = g.duplicateGroups.flatMap(gr => gr.images.slice(1).map(i => i.id));
    if (!allToDelete.length) return;
    Alert.alert('Delete All Duplicates', `Delete ${allToDelete.length} photos and free up ${formatSize(g.stats.dupSaving)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: () => g.deleteIds(allToDelete) },
    ]);
  };

  const handleDeleteAllBlurry = () => {
    const ids = blurryImages.filter(i => !i.isProtected).map(i => i.id);
    Alert.alert('Delete Blurry Photos', `Delete ${ids.length} blurry photos?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => g.deleteIds(ids) },
    ]);
  };

  if (g.stats.total === 0) {
    return (
      <View style={s.screen}>
        <View style={s.header}>
          <View style={s.headerRow}><Text style={s.title}>Smart Clean</Text>
            <TouchableOpacity onPress={toggleTheme}><Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} /></TouchableOpacity>
          </View>
        </View>
        <View style={s.empty}>
          <Ionicons name="sparkles-outline" size={72} color={colors.muted} />
          <Text style={s.emptyTitle}>Scan first</Text>
          <Text style={s.emptySub}>Scan your gallery to detect duplicates and blurry photos</Text>
        </View>
      </View>
    );
  }

  const totalDups = g.duplicateGroups.reduce((s, gr) => s + gr.images.length - 1, 0);
  const burstCount = g.duplicateGroups.filter(gr => gr.type === 'burst').length;
  const similarCount = g.duplicateGroups.filter(gr => gr.type === 'similar').length;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Smart Clean</Text>
          <TouchableOpacity onPress={toggleTheme}><Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} /></TouchableOpacity>
        </View>

        {/* Summary cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={s.summaryCards}>
            <TouchableOpacity style={[s.summCard, filter === 'all' && { borderColor: colors.green, borderWidth: 2 }]} onPress={() => setFilter('all')}>
              <Text style={[s.summNum, { color: colors.green }]}>{totalDups}</Text>
              <Text style={s.summLbl}>All duplicates</Text>
              <Text style={[s.summSave, { color: colors.green }]}>{formatSize(g.stats.dupSaving)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.summCard, filter === 'burst' && { borderColor: colors.blue, borderWidth: 2 }]} onPress={() => setFilter('burst')}>
              <Text style={[s.summNum, { color: colors.blue }]}>{burstCount}</Text>
              <Text style={s.summLbl}>Burst groups</Text>
              <Text style={s.summSave}>rapid shots</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.summCard, filter === 'similar' && { borderColor: colors.purple, borderWidth: 2 }]} onPress={() => setFilter('similar')}>
              <Text style={[s.summNum, { color: colors.purple }]}>{similarCount}</Text>
              <Text style={s.summLbl}>Similar groups</Text>
              <Text style={s.summSave}>same scene</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.summCard, filter === 'blurry' && { borderColor: colors.yellow, borderWidth: 2 }]} onPress={() => setFilter('blurry')}>
              <Text style={[s.summNum, { color: colors.yellow }]}>{blurryImages.length}</Text>
              <Text style={s.summLbl}>Blurry</Text>
              <Text style={s.summSave}>low quality</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {filter === 'blurry' ? (
        <View style={{ flex: 1 }}>
          {blurryImages.length > 0 && (
            <TouchableOpacity style={[s.cleanAllBtn, { backgroundColor: colors.yellow + '20', borderColor: colors.yellow }]} onPress={handleDeleteAllBlurry}>
              <Ionicons name="trash-outline" size={16} color={colors.yellow} />
              <Text style={[s.cleanAllText, { color: colors.yellow }]}>Delete all {blurryImages.length} blurry photos</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={blurryImages}
            keyExtractor={i => i.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={s.blurCell}>
                <Image source={{ uri: item.uri }} style={s.blurThumb} blurRadius={2} />
                <View style={s.blurOverlay}>
                  <Ionicons name="eye-off-outline" size={20} color="#fff" />
                </View>
                <Text style={s.blurDims}>{item.width}×{item.height}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="checkmark-circle-outline" size={56} color={colors.green} />
                <Text style={s.emptyTitle}>No blurry photos!</Text>
              </View>
            }
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {filteredGroups.length > 0 && filter === 'all' && (
            <TouchableOpacity style={[s.cleanAllBtn, { backgroundColor: colors.orange + '15', borderColor: colors.orange }]} onPress={handleDeleteAllDuplicates}>
              <Ionicons name="sparkles" size={16} color={colors.orange} />
              <Text style={[s.cleanAllText, { color: colors.orange }]}>Clean all · Free {formatSize(g.stats.dupSaving)}</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={filteredGroups}
            keyExtractor={gr => gr.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="checkmark-circle-outline" size={72} color={colors.green} />
                <Text style={s.emptyTitle}>No duplicates!</Text>
                <Text style={s.emptySub}>Your gallery is clean in this category</Text>
              </View>
            }
            renderItem={({ item: group }) => {
              const isExp = expanded.has(group.id);
              const keep = group.images[0];
              const dupes = group.images.slice(1);
              return (
                <View style={s.groupCard}>
                  <TouchableOpacity style={s.groupHeader} onPress={() => toggle(group.id)} activeOpacity={0.7}>
                    <Image source={{ uri: keep.uri }} style={s.groupThumb} />
                    <View style={s.groupInfo}>
                      <View style={s.groupTitleRow}>
                        <View style={[s.typeBadge, { backgroundColor: group.type === 'burst' ? colors.blue + '20' : colors.purple + '20' }]}>
                          <Text style={[s.typeText, { color: group.type === 'burst' ? colors.blue : colors.purple }]}>{group.type}</Text>
                        </View>
                        <Text style={s.groupCount}>{group.images.length} photos</Text>
                      </View>
                      <Text style={s.groupDetail}>{keep.width}×{keep.height}</Text>
                      <Text style={s.groupDate}>{new Date(keep.creationTime).toLocaleDateString()}</Text>
                      <Text style={[s.groupSave, { color: colors.green }]}>Save {formatSize(group.potentialSaving)}</Text>
                    </View>
                    <View style={s.groupRight}>
                      <TouchableOpacity style={s.delGroupBtn} onPress={() => handleDeleteGroup(keep.id, dupes.map(i => i.id))}>
                        <Text style={[s.delGroupText, { color: colors.red }]}>Remove {dupes.length}</Text>
                      </TouchableOpacity>
                      <Ionicons name={isExp ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} style={{ marginTop: 6 }} />
                    </View>
                  </TouchableOpacity>
                  {isExp && (
                    <View style={s.expandRow}>
                      {group.images.map((img, idx) => (
                        <View key={img.id} style={s.expandCell}>
                          <Image source={{ uri: img.uri }} style={s.expandThumb} />
                          <View style={[s.expandBadge, { backgroundColor: idx === 0 ? colors.green : colors.red }]}>
                            <Text style={s.expandBadgeText}>{idx === 0 ? 'Keep' : 'Dup'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  summaryCards: { flexDirection: 'row', gap: 10, paddingRight: 18 },
  summCard: { backgroundColor: c.surface, borderRadius: 14, padding: 14, minWidth: 110, borderWidth: 1, borderColor: c.border },
  summNum: { fontSize: 26, fontWeight: '700' },
  summLbl: { fontSize: 12, color: c.muted, marginTop: 2 },
  summSave: { fontSize: 11, color: c.sub, marginTop: 4 },
  cleanAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 18, marginBottom: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cleanAllText: { fontSize: 14, fontWeight: '600' },
  groupCard: { marginHorizontal: 18, marginBottom: 10, backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  groupThumb: { width: 68, height: 68, borderRadius: 10 },
  groupInfo: { flex: 1 },
  groupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: '700' },
  groupCount: { fontSize: 13, color: c.muted },
  groupDetail: { fontSize: 13, color: c.muted },
  groupDate: { fontSize: 12, color: c.sub, marginTop: 2 },
  groupSave: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  groupRight: { alignItems: 'center' },
  delGroupBtn: { backgroundColor: c.red + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  delGroupText: { fontSize: 12, fontWeight: '700' },
  expandRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 6, borderTopWidth: 1, borderTopColor: c.border },
  expandCell: { position: 'relative' },
  expandThumb: { width: 88, height: 88, borderRadius: 8 },
  expandBadge: { position: 'absolute', bottom: 4, left: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  expandBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  blurCell: { flex: 1/3, margin: 2, aspectRatio: 1, position: 'relative' },
  blurThumb: { width: '100%', height: '100%' },
  blurOverlay: { position: 'absolute', inset: 0, top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  blurDims: { position: 'absolute', bottom: 4, left: 4, fontSize: 9, color: '#fff', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  emptySub: { fontSize: 14, color: c.muted, textAlign: 'center', paddingHorizontal: 40 },
});
