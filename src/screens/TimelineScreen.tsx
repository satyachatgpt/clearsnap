import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  FlatList, Image, Dimensions, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { useTheme } from '../context/ThemeContext';
import { CAT_CONFIG } from '../utils/theme';
import { AnalyzedImage, formatSize, formatDuration } from '../utils/imageAnalyzer';
import { SortMode } from '../hooks/useGallery';

const COLS = 3;
const W = Dimensions.get('window').width;
const CELL = (W - 4) / COLS;

export function TimelineScreen() {
  const g = useGalleryContext();
  const { colors, theme, toggleTheme } = useTheme();
  const [viewingImage, setViewingImage] = useState<AnalyzedImage | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSwipe, setShowSwipe] = useState(false);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const s = makeStyles(colors);

  const CATS = ['all','whatsapp','screenshot','facebook','promo','personal','received'];
  const CAT_LABELS: Record<string,string> = { all:'All', whatsapp:'WhatsApp', screenshot:'Screenshots', facebook:'Facebook', promo:'Promos', personal:'Personal', received:'Received' };

  type Row = { type: 'header'; bucket: string; count: number } | { type: 'grid'; images: AnalyzedImage[] };
  const rows: Row[] = [];
  for (const bucket of g.buckets) {
    const imgs = g.grouped[bucket] ?? [];
    rows.push({ type: 'header', bucket, count: imgs.length });
    for (let i = 0; i < imgs.length; i += COLS)
      rows.push({ type: 'grid', images: imgs.slice(i, i + COLS) });
  }

  const swipeImages = g.filteredImages;
  const currentSwipe = swipeImages[swipeIndex];

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === 'header') {
      return (
        <View style={s.bucketHeader}>
          <View style={s.bucketLeft}>
            <Text style={s.bucketTitle}>{item.bucket.toUpperCase()}</Text>
            <View style={s.badge}><Text style={s.badgeText}>{item.count}</Text></View>
          </View>
          <TouchableOpacity onPress={() => g.selectBucket(item.bucket)}>
            <Text style={s.selAll}>{g.isBucketFullySelected(item.bucket) ? 'Deselect' : 'Select all'}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={s.row}>
        {item.images.map(img => {
          const sel = g.selected.has(img.id);
          const catColor = CAT_CONFIG[img.category]?.color ?? colors.muted;
          return (
            <TouchableOpacity key={img.id} style={s.cell}
              onPress={() => g.toggleSelect(img.id)}
              onLongPress={() => setViewingImage(img)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: img.uri }} style={s.thumb} />
              {img.mediaType === 'video' && (
                <View style={s.videoOverlay}>
                  <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.9)" />
                  {img.duration ? <Text style={s.duration}>{formatDuration(img.duration)}</Text> : null}
                </View>
              )}
              {img.isBlurry && <View style={s.blurBadge}><Text style={s.blurText}>blur</Text></View>}
              {img.isPrivacyRisk && <View style={[s.blurBadge, { backgroundColor: colors.red }]}><Text style={s.blurText}>!</Text></View>}
              {img.isProtected && (
                <View style={s.protectBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.green} />
                </View>
              )}
              <View style={[s.catBar, { backgroundColor: catColor }]} />
              {sel && <View style={s.selOverlay} />}
              <View style={[s.chk, sel && { backgroundColor: colors.green, borderColor: colors.green }]}>
                {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
        {item.images.length < COLS && Array.from({ length: COLS - item.images.length }).map((_, i) => (
          <View key={i} style={s.cell} />
        ))}
      </View>
    );
  };

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Clear<Text style={{ color: colors.green }}>Snap</Text></Text>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.iconBtn} onPress={toggleTheme}>
              <Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowFilters(true)}>
              <Ionicons name="options-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.scanBtn} onPress={g.scan} disabled={g.scanning}>
              {g.scanning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.scanBtnText}>{g.stats.total === 0 ? 'Scan' : 'Rescan'}</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 6 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by filename..."
            placeholderTextColor={colors.muted}
            value={g.searchQuery}
            onChangeText={g.setSearchQuery}
          />
          {g.searchQuery ? (
            <TouchableOpacity onPress={() => g.setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <View style={s.pills}>
            <View style={s.pill}><Text style={s.pillVal}>{g.stats.photos}</Text><Text style={s.pillLbl}> photos</Text></View>
            {g.includeVideos && <View style={s.pill}><Text style={s.pillVal}>{g.stats.videos}</Text><Text style={s.pillLbl}> videos</Text></View>}
            {g.stats.selectedCount > 0 && <View style={[s.pill, { borderColor: colors.green, borderWidth: 1 }]}><Text style={[s.pillVal,{color:colors.green}]}>{g.stats.selectedCount}</Text><Text style={s.pillLbl}> selected</Text></View>}
            {g.stats.blurry > 0 && <View style={[s.pill, { borderColor: colors.yellow, borderWidth: 1 }]}><Text style={[s.pillVal,{color:colors.yellow}]}>{g.stats.blurry}</Text><Text style={s.pillLbl}> blurry</Text></View>}
            {g.stats.privacy > 0 && <View style={[s.pill, { borderColor: colors.red, borderWidth: 1 }]}><Text style={[s.pillVal,{color:colors.red}]}>{g.stats.privacy}</Text><Text style={s.pillLbl}> private</Text></View>}
          </View>
        </ScrollView>
      </View>

      {/* Scan progress */}
      {g.scanning && (
        <View style={s.progress}>
          <Text style={s.progressText}>Scanning {g.scanProgress.loaded} / {g.scanProgress.total || '?'}...</Text>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: g.scanProgress.total ? `${Math.round(g.scanProgress.loaded / g.scanProgress.total * 100)}%` : '5%' }]} />
          </View>
        </View>
      )}

      {/* Category chips */}
      {g.stats.total > 0 && !g.scanning && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {CATS.map(cat => {
            const on = g.activeCategory === cat;
            const color = cat === 'all' ? colors.green : (CAT_CONFIG[cat]?.color ?? colors.green);
            return (
              <TouchableOpacity key={cat} style={[s.chip, on && { backgroundColor: color, borderColor: color }]} onPress={() => g.setActiveCategory(cat as any)}>
                <Text style={[s.chipText, on && { color: '#fff' }]}>{CAT_LABELS[cat]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Swipe mode button */}
      {g.stats.total > 0 && !g.scanning && (
        <TouchableOpacity style={s.swipeModeBtn} onPress={() => { setSwipeIndex(0); setShowSwipe(true); }}>
          <Ionicons name="layers-outline" size={16} color={colors.blue} />
          <Text style={[s.swipeModeTxt, { color: colors.blue }]}>  Swipe Mode</Text>
        </TouchableOpacity>
      )}

      {/* Grid */}
      {g.stats.total === 0 && !g.scanning ? (
        <View style={s.empty}>
          <Ionicons name="images-outline" size={72} color={colors.muted} />
          <Text style={s.emptyTitle}>Tap Scan to start</Text>
          <Text style={s.emptySub}>Photos will be grouped by age and category</Text>
        </View>
      ) : (
        <FlatList data={rows} keyExtractor={(_,i) => String(i)} renderItem={renderRow} initialNumToRender={30} removeClippedSubviews showsVerticalScrollIndicator={false} />
      )}

      {/* Bottom bar */}
      <View style={s.bbar}>
        <Text style={s.bbarSel}>{g.stats.selectedCount > 0 ? `${g.stats.selectedCount} · ${formatSize(g.stats.selectedBytes)}` : 'Tap to select'}</Text>
        <View style={s.bbarBtns}>
          {g.stats.selectedCount > 0 && (
            <>
              <TouchableOpacity style={s.iconBarBtn} onPress={g.shareSelected}>
                <Ionicons name="share-outline" size={20} color={colors.blue} />
              </TouchableOpacity>
              <TouchableOpacity style={s.clrBtn} onPress={g.clearSelection}>
                <Text style={s.clrText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={[s.delBtn, !g.stats.selectedCount && s.delBtnOff]} onPress={g.stats.selectedCount ? g.deleteSelected : undefined}>
            {g.deleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[s.delText, !g.stats.selectedCount && { color: colors.muted }]}>Delete</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Photo viewer modal */}
      <Modal visible={!!viewingImage} transparent animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <View style={s.modalBg}>
          <TouchableOpacity style={s.modalClose} onPress={() => setViewingImage(null)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {viewingImage && (
            <>
              <Image source={{ uri: viewingImage.uri }} style={s.modalImage} resizeMode="contain" />
              <View style={s.modalInfo}>
                <Text style={s.modalFilename}>{viewingImage.filename}</Text>
                <Text style={s.modalMeta}>{viewingImage.width}×{viewingImage.height} · {new Date(viewingImage.creationTime).toLocaleDateString()}</Text>
                <Text style={s.modalMeta}>{CAT_CONFIG[viewingImage.category]?.label} · {formatSize(viewingImage.fileSize)}</Text>
                {viewingImage.isPrivacyRisk && <Text style={[s.modalMeta, { color: colors.red }]}>⚠ Privacy risk: {viewingImage.privacyTags?.join(', ')}</Text>}
                <View style={s.modalActions}>
                  <TouchableOpacity style={[s.modalBtn, { backgroundColor: viewingImage.isProtected ? colors.green : colors.card }]}
                    onPress={() => { g.toggleProtect(viewingImage.id); setViewingImage({ ...viewingImage, isProtected: !viewingImage.isProtected }); }}>
                    <Ionicons name={viewingImage.isProtected ? 'shield-checkmark' : 'shield-outline'} size={16} color={viewingImage.isProtected ? '#fff' : colors.text} />
                    <Text style={[s.modalBtnText, viewingImage.isProtected && { color: '#fff' }]}>{viewingImage.isProtected ? 'Protected' : 'Protect'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.modalBtn, { backgroundColor: g.selected.has(viewingImage.id) ? colors.green : colors.card }]}
                    onPress={() => { g.toggleSelect(viewingImage.id); }}>
                    <Ionicons name={g.selected.has(viewingImage.id) ? 'checkmark-circle' : 'radio-button-off'} size={16} color={g.selected.has(viewingImage.id) ? '#fff' : colors.text} />
                    <Text style={[s.modalBtnText, g.selected.has(viewingImage.id) && { color: '#fff' }]}>Select</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Swipe mode */}
      <Modal visible={showSwipe} transparent animationType="slide" onRequestClose={() => setShowSwipe(false)}>
        <View style={s.swipeBg}>
          <View style={s.swipeHeader}>
            <Text style={s.swipeTitle}>{swipeIndex + 1} / {swipeImages.length}</Text>
            <TouchableOpacity onPress={() => setShowSwipe(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {currentSwipe && (
            <>
              <Image source={{ uri: currentSwipe.uri }} style={s.swipeImage} resizeMode="contain" />
              <View style={s.swipeInfo}>
                <Text style={s.swipeFilename}>{currentSwipe.filename}</Text>
                <Text style={s.swipeMeta}>{currentSwipe.width}×{currentSwipe.height} · {formatSize(currentSwipe.fileSize)}</Text>
              </View>
              <View style={s.swipeBtns}>
                <TouchableOpacity style={[s.swipeBtn, { backgroundColor: colors.red }]}
                  onPress={() => { g.deleteIds([currentSwipe.id]); if (swipeIndex >= swipeImages.length - 1) setSwipeIndex(Math.max(0, swipeIndex - 1)); }}>
                  <Ionicons name="trash-outline" size={28} color="#fff" />
                  <Text style={s.swipeBtnText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.swipeBtn, { backgroundColor: colors.card }]}
                  onPress={() => setSwipeIndex(Math.min(swipeImages.length - 1, swipeIndex + 1))}>
                  <Ionicons name="checkmark" size={28} color={colors.green} />
                  <Text style={[s.swipeBtnText, { color: colors.green }]}>Keep</Text>
                </TouchableOpacity>
              </View>
              <View style={s.swipeNav}>
                <TouchableOpacity onPress={() => setSwipeIndex(Math.max(0, swipeIndex - 1))} disabled={swipeIndex === 0}>
                  <Ionicons name="chevron-back-circle" size={40} color={swipeIndex === 0 ? colors.muted : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSwipeIndex(Math.min(swipeImages.length - 1, swipeIndex + 1))} disabled={swipeIndex === swipeImages.length - 1}>
                  <Ionicons name="chevron-forward-circle" size={40} color={swipeIndex === swipeImages.length - 1 ? colors.muted : '#fff'} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Filters modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={s.filtersBg}>
          <View style={[s.filtersSheet, { backgroundColor: colors.surface }]}>
            <View style={s.filtersHeader}>
              <Text style={[s.filtersTitle, { color: colors.text }]}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={[s.filterSection, { color: colors.muted }]}>SORT BY</Text>
              <View style={s.filterRow}>
                {(['newest','oldest','largest','smallest'] as SortMode[]).map(m => (
                  <TouchableOpacity key={m} style={[s.filterChip, g.sortMode === m && { backgroundColor: colors.green }]}
                    onPress={() => g.setSortMode(m)}>
                    <Text style={[s.filterChipText, { color: g.sortMode === m ? '#fff' : colors.text }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.filterSection, { color: colors.muted }]}>MEDIA TYPE</Text>
              <View style={s.filterRow}>
                {(['all','photo','video'] as const).map(m => (
                  <TouchableOpacity key={m} style={[s.filterChip, g.mediaTypeFilter === m && { backgroundColor: colors.blue }]}
                    onPress={() => g.setMediaTypeFilter(m)}>
                    <Text style={[s.filterChipText, { color: g.mediaTypeFilter === m ? '#fff' : colors.text }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.filterSection, { color: colors.muted }]}>QUICK SELECT</Text>
              <View style={s.filterRow}>
                {[30, 90, 180, 365].map(days => (
                  <TouchableOpacity key={days} style={[s.filterChip, { borderColor: colors.orange }]}
                    onPress={() => { g.selectOlderThan(days); setShowFilters(false); }}>
                    <Text style={[s.filterChipText, { color: colors.orange }]}>Older {days}d</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.filterToggleRow}>
                <Text style={[s.filterToggleLabel, { color: colors.text }]}>Include videos in scan</Text>
                <TouchableOpacity style={[s.toggle, g.includeVideos && { backgroundColor: colors.green }]}
                  onPress={() => g.setIncludeVideos(!g.includeVideos)}>
                  <View style={[s.toggleThumb, g.includeVideos && { transform: [{ translateX: 20 }] }]} />
                </TouchableOpacity>
              </View>

              <View style={s.filterToggleRow}>
                <Text style={[s.filterToggleLabel, { color: colors.text }]}>Show blurry photos only</Text>
                <TouchableOpacity style={[s.toggle, g.blurryOnly && { backgroundColor: colors.yellow }]}
                  onPress={() => g.setBlurryOnly(!g.blurryOnly)}>
                  <View style={[s.toggleThumb, g.blurryOnly && { transform: [{ translateX: 20 }] }]} />
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  scanBtn: { backgroundColor: c.green, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  scanBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2 },
  searchInput: { flex: 1, fontSize: 15, color: c.text, padding: 0 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillVal: { fontSize: 14, fontWeight: '700', color: c.text },
  pillLbl: { fontSize: 13, color: c.muted },
  progress: { paddingHorizontal: 18, marginBottom: 6 },
  progressText: { fontSize: 13, color: c.muted, marginBottom: 4 },
  progressTrack: { height: 4, backgroundColor: c.card, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.green },
  chips: { paddingHorizontal: 14, paddingVertical: 6, gap: 6, flexDirection: 'row' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  chipText: { fontSize: 13, fontWeight: '600', color: c.muted },
  swipeModeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  swipeModeTxt: { fontSize: 13, fontWeight: '600' },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  bucketLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketTitle: { fontSize: 12, fontWeight: '700', color: c.muted, letterSpacing: 0.8 },
  badge: { backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, color: c.sub },
  selAll: { fontSize: 13, color: c.green, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 2, marginHorizontal: 2 },
  cell: { width: CELL, height: CELL, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  catBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  selOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,163,136,0.3)' },
  chk: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  duration: { fontSize: 10, color: '#fff', marginTop: 2 },
  blurBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: c.yellow, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  blurText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  protectBadge: { position: 'absolute', bottom: 6, left: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: c.text, textAlign: 'center' },
  emptySub: { fontSize: 14, color: c.muted, textAlign: 'center' },
  bbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, paddingBottom: 28, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
  bbarSel: { fontSize: 14, fontWeight: '600', color: c.text },
  bbarBtns: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBarBtn: { padding: 6 },
  clrBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  clrText: { fontSize: 14, color: c.sub, fontWeight: '600' },
  delBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: c.red, minWidth: 80, alignItems: 'center' },
  delBtnOff: { backgroundColor: c.card },
  delText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 54, right: 18, zIndex: 10 },
  modalImage: { width: W, height: W * 1.1 },
  modalInfo: { position: 'absolute', bottom: 50, left: 18, right: 18 },
  modalFilename: { fontSize: 15, color: '#fff', fontWeight: '600' },
  modalMeta: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  modalBtnText: { fontSize: 13, fontWeight: '600', color: c.text },
  swipeBg: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between' },
  swipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 10 },
  swipeTitle: { fontSize: 16, color: '#fff', fontWeight: '600' },
  swipeImage: { width: W, height: W * 1.0, alignSelf: 'center' },
  swipeInfo: { paddingHorizontal: 18, paddingVertical: 8 },
  swipeFilename: { fontSize: 14, color: '#fff', fontWeight: '600' },
  swipeMeta: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  swipeBtns: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 10 },
  swipeBtn: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30, gap: 4 },
  swipeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  swipeNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 30 },
  filtersBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  filtersSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  filtersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  filtersTitle: { fontSize: 18, fontWeight: '700' },
  filterSection: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: c.border, backgroundColor: c.card },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.border, marginTop: 8 },
  filterToggleLabel: { fontSize: 15 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: c.border, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
});
