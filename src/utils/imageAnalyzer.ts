import * as MediaLibrary from 'expo-media-library';
import { BUCKET_ORDER } from './theme';

export type Category = 'whatsapp' | 'screenshot' | 'facebook' | 'promo' | 'personal' | 'received';
export type MediaType = 'photo' | 'video';

export interface AnalyzedImage {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  modificationTime: number;
  fileSize: number;
  width: number;
  height: number;
  duration?: number;
  category: Category;
  timeBucket: string;
  mediaType: MediaType;
  albumId?: string;
  albumName?: string;
  latitude?: number;
  longitude?: number;
  isBlurry?: boolean;
  isBurst?: boolean;
  isPrivacyRisk?: boolean;
  privacyTags?: string[];
  isProtected?: boolean;
}

export interface DuplicateGroup {
  id: string;
  images: AnalyzedImage[];
  potentialSaving: number;
  type: 'exact' | 'burst' | 'similar';
}

export interface Album {
  id: string;
  title: string;
  count: number;
  coverUri?: string;
}

// ─── Categorisation ────────────────────────────────────────────────────────────

const RULES: Array<{ cat: Category; patterns: RegExp[] }> = [
  { cat: 'whatsapp',   patterns: [/IMG-\d{8}-WA\d{4}/i, /WhatsApp\s?(Image|Video|Audio)/i, /^WA\d+/i] },
  { cat: 'facebook',   patterns: [/FB_IMG_/i, /facebook/i] },
  { cat: 'screenshot', patterns: [/Screenshot/i, /Screen_?[Ss]hot/i, /screen[-_]?grab/i] },
  { cat: 'promo',      patterns: [/promo|offer|deal|sale|coupon|discount|cashback/i, /amazon|flipkart|swiggy|zomato|myntra/i, /invoice|receipt|order[-_]?confirm/i] },
  { cat: 'received',   patterns: [/^received_/i, /forward/i, /shared/i, /downloaded/i] },
];

export function categorize(filename: string): Category {
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(filename))) return rule.cat;
  }
  return 'personal';
}

// ─── Privacy risk detection ────────────────────────────────────────────────────

const PRIVACY_PATTERNS: Array<{ tag: string; pattern: RegExp }> = [
  { tag: 'Aadhaar / ID', pattern: /aadhaar|aadhar|uid|voter.?id|pan.?card/i },
  { tag: 'Banking',      pattern: /bank|statement|passbook|ifsc|account.?no/i },
  { tag: 'OTP / PIN',    pattern: /otp|pin|password|passcode|credential/i },
  { tag: 'Medical',      pattern: /prescription|medical|hospital|report|covid/i },
  { tag: 'Ticket',       pattern: /ticket|boarding|passport|visa/i },
];

export function detectPrivacyRisk(filename: string): { isRisk: boolean; tags: string[] } {
  const tags: string[] = [];
  for (const p of PRIVACY_PATTERNS) {
    if (p.pattern.test(filename)) tags.push(p.tag);
  }
  return { isRisk: tags.length > 0, tags };
}

// ─── Blurry heuristic ──────────────────────────────────────────────────────────
// Proxy: very low pixel density relative to resolution bucket = likely blurry/compressed

export function isLikelyBlurry(width: number, height: number, fileSize: number): boolean {
  if (width === 0 || height === 0) return false;
  const pixels = width * height;
  const bytesPerPixel = fileSize / pixels;
  return bytesPerPixel < 0.05 && pixels > 500_000;
}

// ─── Time bucket ───────────────────────────────────────────────────────────────

export function timeBucket(creationTime: number): string {
  const d = (Date.now() - creationTime) / 86_400_000;
  if (d < 7)   return '1 week';
  if (d < 14)  return '2 weeks';
  if (d < 21)  return '3 weeks';
  if (d < 28)  return '4 weeks';
  if (d < 60)  return '2 months';
  if (d < 183) return '6 months';
  if (d < 365) return '1 year';
  return '1+ years';
}

// ─── Size estimation ───────────────────────────────────────────────────────────

export function estimateFileSize(width: number, height: number, isVideo = false): number {
  if (isVideo) return width * height * 0.5;
  return Math.round(width * height * 0.25);
}

// ─── Gallery scan ──────────────────────────────────────────────────────────────

export async function scanGallery(
  includeVideos: boolean,
  onProgress?: (loaded: number, total: number) => void
): Promise<AnalyzedImage[]> {
  const results: AnalyzedImage[] = [];
  let after: string | undefined;

  const mediaType = includeVideos
    ? [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video]
    : MediaLibrary.MediaType.photo;

  const probe = await MediaLibrary.getAssetsAsync({ mediaType, first: 1 });
  const total = probe.totalCount;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType,
      first: 100,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    for (const asset of page.assets) {
      const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
      const fSize = estimateFileSize(asset.width, asset.height, isVideo);
      const privacy = detectPrivacyRisk(asset.filename);

      results.push({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        fileSize: fSize,
        width: asset.width,
        height: asset.height,
        duration: (asset as any).duration,
        category: categorize(asset.filename),
        timeBucket: timeBucket(asset.creationTime),
        mediaType: isVideo ? 'video' : 'photo',
        isBlurry: isLikelyBlurry(asset.width, asset.height, fSize),
        isPrivacyRisk: privacy.isRisk,
        privacyTags: privacy.tags,
      });
    }

    onProgress?.(results.length, total);
    after = page.endCursor;
    if (!page.hasNextPage) break;
  } while (true);

  return results;
}

// ─── Get albums ────────────────────────────────────────────────────────────────

export async function getAlbums(): Promise<Album[]> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  const result: Album[] = [];
  for (const album of albums) {
    if (album.assetCount === 0) continue;
    const assets = await MediaLibrary.getAssetsAsync({
      album: album.id,
      first: 1,
      mediaType: MediaLibrary.MediaType.photo,
    });
    result.push({
      id: album.id,
      title: album.title,
      count: album.assetCount,
      coverUri: assets.assets[0]?.uri,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

// ─── Get asset EXIF info ───────────────────────────────────────────────────────

export async function getAssetInfo(id: string) {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, { shouldDownloadFromNetwork: false });
    return info;
  } catch { return null; }
}

// ─── Duplicate detection ───────────────────────────────────────────────────────

export function detectDuplicates(images: AnalyzedImage[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  let groupCounter = 0;

  // Group by resolution
  const byRes = new Map<string, AnalyzedImage[]>();
  for (const img of images) {
    if (img.width === 0 || img.height === 0) continue;
    const key = `${img.width}x${img.height}`;
    if (!byRes.has(key)) byRes.set(key, []);
    byRes.get(key)!.push(img);
  }

  for (const [, group] of byRes) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.creationTime - b.creationTime);

    // Burst: within 3 seconds
    let burst: AnalyzedImage[] = [group[0]];
    for (let i = 1; i < group.length; i++) {
      const diff = group[i].creationTime - group[i-1].creationTime;
      if (diff < 3000) {
        burst.push(group[i]);
      } else {
        if (burst.length >= 2) {
          const saving = burst.slice(1).reduce((s, img) => s + img.fileSize, 0);
          groups.push({ id: `dup-${groupCounter++}`, images: burst, potentialSaving: saving, type: 'burst' });
        }
        burst = [group[i]];
      }
    }
    if (burst.length >= 2) {
      const saving = burst.slice(1).reduce((s, img) => s + img.fileSize, 0);
      groups.push({ id: `dup-${groupCounter++}`, images: burst, potentialSaving: saving, type: 'burst' });
    }

    // Similar: within 60 seconds (not already in burst)
    const usedIds = new Set(groups.flatMap(g => g.images.map(i => i.id)));
    const remaining = group.filter(img => !usedIds.has(img.id));
    let similar: AnalyzedImage[] = remaining.length ? [remaining[0]] : [];
    for (let i = 1; i < remaining.length; i++) {
      const diff = remaining[i].creationTime - remaining[i-1].creationTime;
      if (diff < 60_000) {
        similar.push(remaining[i]);
      } else {
        if (similar.length >= 2) {
          const saving = similar.slice(1).reduce((s, img) => s + img.fileSize, 0);
          groups.push({ id: `dup-${groupCounter++}`, images: similar, potentialSaving: saving, type: 'similar' });
        }
        similar = [remaining[i]];
      }
    }
    if (similar.length >= 2) {
      const saving = similar.slice(1).reduce((s, img) => s + img.fileSize, 0);
      groups.push({ id: `dup-${groupCounter++}`, images: similar, potentialSaving: saving, type: 'similar' });
    }
  }

  return groups.sort((a, b) => b.potentialSaving - a.potentialSaving);
}

// ─── Grouping helpers ──────────────────────────────────────────────────────────

export function groupByBucket(images: AnalyzedImage[]): Record<string, AnalyzedImage[]> {
  const map: Record<string, AnalyzedImage[]> = {};
  for (const img of images) {
    if (!map[img.timeBucket]) map[img.timeBucket] = [];
    map[img.timeBucket].push(img);
  }
  return map;
}

export function sortedBuckets(grouped: Record<string, AnalyzedImage[]>): string[] {
  return BUCKET_ORDER.filter(b => !!grouped[b]);
}

// ─── Delete ────────────────────────────────────────────────────────────────────

export async function deleteImages(ids: string[]): Promise<void> {
  await MediaLibrary.deleteAssetsAsync(ids);
}

// ─── Monthly breakdown ─────────────────────────────────────────────────────────

export interface MonthlyCount {
  label: string;
  year: number;
  month: number;
  photos: number;
  videos: number;
  bytes: number;
}

export function getMonthlyBreakdown(images: AnalyzedImage[]): MonthlyCount[] {
  const map = new Map<string, MonthlyCount>();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (const img of images) {
    const d = new Date(img.creationTime);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        photos: 0, videos: 0, bytes: 0,
      });
    }
    const rec = map.get(key)!;
    if (img.mediaType === 'video') rec.videos++;
    else rec.photos++;
    rec.bytes += img.fileSize;
  }

  return Array.from(map.values())
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-12);
}

// ─── Privacy scan ──────────────────────────────────────────────────────────────

export function getPrivacyRisks(images: AnalyzedImage[]): AnalyzedImage[] {
  return images.filter(img => img.isPrivacyRisk);
}

// ─── Formatters ────────────────────────────────────────────────────────────────

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
