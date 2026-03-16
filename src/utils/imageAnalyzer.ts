// src/utils/imageAnalyzer.ts
// 100% on-device — no API calls, no internet required.

import * as MediaLibrary from 'expo-media-library';
import { BUCKET_ORDER } from './theme';

export type Category =
  | 'whatsapp'
  | 'screenshot'
  | 'facebook'
  | 'promo'
  | 'personal'
  | 'received';

export interface AnalyzedImage {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  modificationTime: number;
  fileSize: number;
  width: number;
  height: number;
  category: Category;
  timeBucket: string;
}

// ─── Categorisation rules ─────────────────────────────────────────────────────

const RULES: Array<{ cat: Category; patterns: RegExp[] }> = [
  {
    cat: 'whatsapp',
    patterns: [
      /IMG-\d{8}-WA\d{4}/i,
      /WhatsApp\s?(Image|Video|Audio)/i,
      /^WA\d{4}/i,
    ],
  },
  {
    cat: 'facebook',
    patterns: [
      /FB_IMG_/i,
      /facebook/i,
      /^[0-9]{15,}$/,
    ],
  },
  {
    cat: 'screenshot',
    patterns: [
      /Screenshot/i,
      /Screen_?[Ss]hot/i,
      /screen[-_]?grab/i,
    ],
  },
  {
    cat: 'promo',
    patterns: [
      /promo|offer|deal|sale|coupon|discount|cashback/i,
      /amazon|flipkart|swiggy|zomato|myntra|meesho/i,
      /invoice|receipt|order[-_]?confirm/i,
    ],
  },
  {
    cat: 'received',
    patterns: [
      /^received_/i,
      /forward/i,
      /shared/i,
      /downloaded/i,
    ],
  },
];

export function categorize(filename: string): Category {
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(filename))) return rule.cat;
  }
  return 'personal';
}

// ─── Time bucket ──────────────────────────────────────────────────────────────

export function timeBucket(creationTime: number): string {
  const diffDays = (Date.now() - creationTime) / 86_400_000;
  if (diffDays < 7)   return '1 week';
  if (diffDays < 14)  return '2 weeks';
  if (diffDays < 21)  return '3 weeks';
  if (diffDays < 28)  return '4 weeks';
  if (diffDays < 60)  return '2 months';
  if (diffDays < 183) return '6 months';
  if (diffDays < 365) return '1 year';
  return '1+ years';
}

// ─── Gallery scanner ──────────────────────────────────────────────────────────

const PAGE_SIZE = 100;

export async function scanGallery(
  onProgress?: (loaded: number, total: number) => void
): Promise<AnalyzedImage[]> {
  const results: AnalyzedImage[] = [];
  let after: string | undefined;

  // Get total count first so we can show a progress bar
  const probe = await MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.photo,
    first: 1,
  });
  const total = probe.totalCount;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: PAGE_SIZE,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]], // newest first
    });

    for (const asset of page.assets) {
      results.push({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        fileSize: (asset as any).fileSize ?? 0,
        width: asset.width,
        height: asset.height,
        category: categorize(asset.filename),
        timeBucket: timeBucket(asset.creationTime),
      });
    }

    onProgress?.(results.length, total);
    after = page.endCursor;
    if (!page.hasNextPage) break;
  } while (true);

  return results;
}

// ─── Delete images ────────────────────────────────────────────────────────────

export async function deleteImages(ids: string[]): Promise<void> {
  await MediaLibrary.deleteAssetsAsync(ids);
}

// ─── Group helpers ────────────────────────────────────────────────────────────

export function groupByBucket(
  images: AnalyzedImage[]
): Record<string, AnalyzedImage[]> {
  const map: Record<string, AnalyzedImage[]> = {};
  for (const img of images) {
    const b = img.timeBucket;
    if (!map[b]) map[b] = [];
    map[b].push(img);
  }
  return map;
}

export function sortedBuckets(
  grouped: Record<string, AnalyzedImage[]>
): string[] {
  return BUCKET_ORDER.filter(b => !!grouped[b]);
}

// ─── Size formatter ───────────────────────────────────────────────────────────

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
