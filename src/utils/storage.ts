import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROTECTED: 'clearsnap_protected_ids',
  DELETE_HISTORY: 'clearsnap_delete_history',
  SCAN_HISTORY: 'clearsnap_scan_history',
};

export interface DeleteRecord {
  id: string;
  filename: string;
  category: string;
  deletedAt: number;
  fileSize: number;
}

export interface ScanRecord {
  scannedAt: number;
  totalPhotos: number;
  totalVideos: number;
  totalBytes: number;
}

// Protected IDs
export async function getProtectedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROTECTED);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}

export async function saveProtectedIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PROTECTED, JSON.stringify(Array.from(ids)));
  } catch {}
}

// Delete history
export async function getDeleteHistory(): Promise<DeleteRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DELETE_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export async function addToDeleteHistory(records: DeleteRecord[]): Promise<void> {
  try {
    const existing = await getDeleteHistory();
    const combined = [...records, ...existing].slice(0, 200);
    await AsyncStorage.setItem(KEYS.DELETE_HISTORY, JSON.stringify(combined));
  } catch {}
}

export async function clearDeleteHistory(): Promise<void> {
  try { await AsyncStorage.removeItem(KEYS.DELETE_HISTORY); } catch {}
}

// Scan history for trends
export async function getScanHistory(): Promise<ScanRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export async function addScanRecord(record: ScanRecord): Promise<void> {
  try {
    const existing = await getScanHistory();
    const combined = [record, ...existing].slice(0, 30);
    await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(combined));
  } catch {}
}
