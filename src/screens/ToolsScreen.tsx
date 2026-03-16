import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGalleryContext } from '../context/GalleryContext';
import { useTheme } from '../context/ThemeContext';
import { formatSize, getAssetInfo } from '../utils/imageAnalyzer';
import { scheduleWeeklyCleanReminder, cancelCleanReminder, hasCleanReminder } from '../utils/notifications';
import { clearDeleteHistory } from '../utils/storage';

type ToolView = 'main' | 'privacy' | 'exif' | 'history' | 'locations';

export function ToolsScreen() {
  const g = useGalleryContext();
  const { colors, theme, toggleTheme } = useTheme();
  const [view, setView] = useState<ToolView>('main');
  const [reminderOn, setReminderOn] = useState(false);
  const [selectedForExif, setSelectedForExif] = useState<any>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [loadingExif, setLoadingExif] = useState(false);
  const s = makeStyles(colors);

  useEffect(() => { hasCleanReminder().then(setReminderOn); }, []);

  const toggleReminder = async () => {
    if (reminderOn) {
      await cancelCleanReminder();
      setReminderOn(false);
      Alert.alert('Reminder off', 'Weekly clean reminder has been cancelled.');
    } else {
      const id = await scheduleWeeklyCleanReminder();
      if (id) {
        setReminderOn(true);
        Alert.alert('Reminder set!', 'You\'ll get a weekly reminder every Monday at 10am.');
      } else {
        Alert.alert('Permission required', 'Please allow notifications in your device settings.');
      }
    }
  };

  const loadExif = async (img: any) => {
    setSelectedForExif(img);
    setLoadingExif(true);
    try {
      const info = await getAssetInfo(img.id);
      setExifData(info);
    } finally {
      setLoadingExif(false);
    }
    setView('exif');
  };

  const privacyRisks = g.images.filter(i => i.isPrivacyRisk);
  const locationImages = g.images.filter(i => i.latitude && i.longitude);

  if (view === 'privacy') {
    return (
      <View style={s.screen}>
        <View style={s.subHeader}>
          <TouchableOpacity onPress={() => setView('main')}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={s.subTitle}>Privacy Risks</Text>
          <View style={{ width: 26 }} />
        </View>
        {privacyRisks.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="shield-checkmark-outline" size={72} color={colors.green} />
            <Text style={s.emptyTitle}>No privacy risks found!</Text>
            <Text style={s.emptySub}>No sensitive filenames detected in your gallery</Text>
          </View>
        ) : (
          <>
            <View style={[s.warningBanner, { borderColor: colors.red + '40', backgroundColor: colors.red + '10' }]}>
              <Ionicons name="warning" size={18} color={colors.red} />
              <Text style={[s.warningText, { color: colors.red }]}>{privacyRisks.length} photos with sensitive filenames detected</Text>
            </View>
            <FlatList
              data={privacyRisks}
              keyExtractor={i => i.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.privacyRow} onPress={() => loadExif(item)}>
                  <Image source={{ uri: item.uri }} style={s.privThumb} />
                  <View style={s.privInfo}>
                    <Text style={s.privFilename} numberOfLines={1}>{item.filename}</Text>
                    <View style={s.privTags}>
                      {item.privacyTags?.map(tag => (
                        <View key={tag} style={[s.privTag, { backgroundColor: colors.red + '20' }]}>
                          <Text style={[s.privTagText, { color: colors.red }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Delete?', `Delete "${item.filename}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => g.deleteIds([item.id]) },
                  ])}>
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>
    );
  }

  if (view === 'exif') {
    return (
      <View style={s.screen}>
        <View style={s.subHeader}>
          <TouchableOpacity onPress={() => { setView('main'); setExifData(null); }}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={s.subTitle}>Photo Details</Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {selectedForExif && <Image source={{ uri: selectedForExif.uri }} style={s.exifImage} resizeMode="cover" />}
          {loadingExif ? (
            <View style={s.empty}><Text style={[s.emptySub, { color: colors.muted }]}>Loading details...</Text></View>
          ) : exifData ? (
            <View style={s.exifRows}>
              {[
                { label: 'Filename', val: exifData.filename },
                { label: 'Width', val: `${exifData.width}px` },
                { label: 'Height', val: `${exifData.height}px` },
                { label: 'Created', val: new Date(exifData.creationTime).toLocaleString() },
                { label: 'Modified', val: new Date(exifData.modificationTime).toLocaleString() },
                { label: 'Media type', val: exifData.mediaType },
                { label: 'Album', val: exifData.albumId ?? 'Unknown' },
                { label: 'Location', val: exifData.location ? `${exifData.location.latitude?.toFixed(4)}, ${exifData.location.longitude?.toFixed(4)}` : 'Not available' },
              ].filter(r => r.val).map(row => (
                <View key={row.label} style={s.exifRow}>
                  <Text style={s.exifLabel}>{row.label}</Text>
                  <Text style={s.exifVal}>{row.val}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (view === 'history') {
    return (
      <View style={s.screen}>
        <View style={s.subHeader}>
          <TouchableOpacity onPress={() => setView('main')}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={s.subTitle}>Delete History</Text>
          {g.deleteHistory.length > 0 && (
            <TouchableOpacity onPress={() => Alert.alert('Clear history?', 'This cannot be undone', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => { clearDeleteHistory(); } },
            ])}>
              <Text style={[s.clearHistText, { color: colors.red }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {g.deleteHistory.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="time-outline" size={72} color={colors.muted} />
            <Text style={s.emptyTitle}>No history yet</Text>
            <Text style={s.emptySub}>Deleted photos will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={g.deleteHistory}
            keyExtractor={(_, i) => String(i)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={s.histRow}>
                <View style={[s.histIcon, { backgroundColor: colors.red + '15' }]}>
                  <Ionicons name="trash" size={18} color={colors.red} />
                </View>
                <View style={s.histInfo}>
                  <Text style={s.histFilename} numberOfLines={1}>{item.filename}</Text>
                  <Text style={s.histMeta}>{item.category} · {formatSize(item.fileSize)}</Text>
                  <Text style={s.histDate}>{new Date(item.deletedAt).toLocaleString()}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  if (view === 'locations') {
    return (
      <View style={s.screen}>
        <View style={s.subHeader}>
          <TouchableOpacity onPress={() => setView('main')}><Ionicons name="chevron-back" size={26} color={colors.text} /></TouchableOpacity>
          <Text style={s.subTitle}>Photos with Location</Text>
          <View style={{ width: 26 }} />
        </View>
        {locationImages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="location-outline" size={72} color={colors.muted} />
            <Text style={s.emptyTitle}>No location data</Text>
            <Text style={s.emptySub}>None of your scanned photos have GPS coordinates in their metadata</Text>
          </View>
        ) : (
          <FlatList
            data={locationImages}
            keyExtractor={i => i.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.locRow} onPress={() => {
                const url = `https://maps.google.com/?q=${item.latitude},${item.longitude}`;
                Linking.openURL(url);
              }}>
                <Image source={{ uri: item.uri }} style={s.locThumb} />
                <View style={s.locInfo}>
                  <Text style={s.locFilename} numberOfLines={1}>{item.filename}</Text>
                  <Text style={s.locCoords}>{item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</Text>
                  <Text style={s.locDate}>{new Date(item.creationTime).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="map-outline" size={20} color={colors.blue} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // Main tools view
  const tools = [
    {
      id: 'privacy', icon: 'shield-outline', label: 'Privacy Scanner',
      desc: `${privacyRisks.length} sensitive files detected`,
      color: colors.red, badge: privacyRisks.length > 0 ? String(privacyRisks.length) : null,
      action: () => setView('privacy'),
    },
    {
      id: 'exif', icon: 'information-circle-outline', label: 'EXIF Viewer',
      desc: 'View photo metadata, camera info and location',
      color: colors.blue, badge: null,
      action: () => {
        if (g.images.length === 0) { Alert.alert('Scan first', 'Scan your gallery to use the EXIF viewer'); return; }
        loadExif(g.images[0]);
      },
    },
    {
      id: 'locations', icon: 'location-outline', label: 'Photo Locations',
      desc: `${locationImages.length} photos have GPS coordinates`,
      color: colors.green, badge: null,
      action: () => setView('locations'),
    },
    {
      id: 'history', icon: 'time-outline', label: 'Delete History',
      desc: `${g.deleteHistory.length} files deleted`,
      color: colors.purple, badge: null,
      action: () => setView('history'),
    },
    {
      id: 'reminder', icon: reminderOn ? 'notifications' : 'notifications-outline', label: 'Weekly Clean Reminder',
      desc: reminderOn ? 'Every Monday at 10am' : 'Get reminded to clean your gallery',
      color: colors.orange, badge: reminderOn ? 'ON' : null,
      action: toggleReminder,
    },
    {
      id: 'protected', icon: 'shield-checkmark-outline', label: 'Protected Photos',
      desc: `${g.stats.protected} photos protected from deletion`,
      color: colors.green, badge: g.stats.protected > 0 ? String(g.stats.protected) : null,
      action: () => Alert.alert('Protected photos', `You have ${g.stats.protected} protected photos. Long press any photo and tap Protect to add protection.`),
    },
  ];

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <Text style={s.title}>Tools</Text>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={s.sub}>Advanced features for your gallery</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {tools.map(tool => (
          <TouchableOpacity key={tool.id} style={s.toolRow} onPress={tool.action} activeOpacity={0.7}>
            <View style={[s.toolIcon, { backgroundColor: tool.color + '20' }]}>
              <Ionicons name={tool.icon as any} size={24} color={tool.color} />
            </View>
            <View style={s.toolInfo}>
              <Text style={s.toolLabel}>{tool.label}</Text>
              <Text style={s.toolDesc}>{tool.desc}</Text>
            </View>
            {tool.badge && (
              <View style={[s.toolBadge, { backgroundColor: tool.color + '20' }]}>
                <Text style={[s.toolBadgeText, { color: tool.color }]}>{tool.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        ))}
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
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14 },
  subTitle: { fontSize: 18, fontWeight: '700', color: c.text },
  clearHistText: { fontSize: 14, fontWeight: '600' },
  toolRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  toolIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  toolInfo: { flex: 1 },
  toolLabel: { fontSize: 16, fontWeight: '600', color: c.text },
  toolDesc: { fontSize: 13, color: c.muted, marginTop: 2 },
  toolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
  toolBadgeText: { fontSize: 12, fontWeight: '700' },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 18, marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  warningText: { fontSize: 13, fontWeight: '600', flex: 1 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 },
  privThumb: { width: 56, height: 56, borderRadius: 8 },
  privInfo: { flex: 1 },
  privFilename: { fontSize: 14, fontWeight: '600', color: c.text },
  privTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  privTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  privTagText: { fontSize: 11, fontWeight: '700' },
  exifImage: { width: '100%', height: 220 },
  exifRows: { padding: 18 },
  exifRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  exifLabel: { fontSize: 14, color: c.muted },
  exifVal: { fontSize: 14, fontWeight: '600', color: c.text, flex: 1, textAlign: 'right' },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 },
  histIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  histInfo: { flex: 1 },
  histFilename: { fontSize: 14, fontWeight: '600', color: c.text },
  histMeta: { fontSize: 12, color: c.muted, marginTop: 2 },
  histDate: { fontSize: 11, color: c.sub, marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border, gap: 12 },
  locThumb: { width: 56, height: 56, borderRadius: 8 },
  locInfo: { flex: 1 },
  locFilename: { fontSize: 14, fontWeight: '600', color: c.text },
  locCoords: { fontSize: 12, color: c.blue, marginTop: 2 },
  locDate: { fontSize: 11, color: c.sub, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  emptySub: { fontSize: 14, color: c.muted, textAlign: 'center', paddingHorizontal: 40 },
});
