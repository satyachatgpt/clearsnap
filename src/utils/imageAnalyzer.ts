import * as MediaLibrary from 'expo-media-library';
import { BUCKET_ORDER } from './theme';

export type Category = 'whatsapp' | 'screenshot' | 'facebook' | 'promo' | 'personal' | 'received';

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

const RULES: Array<{ cat: Category; patterns: RegExp[] }> = [
  { cat: 'whatsapp',   patterns: [/IMG-\d{8}-WA\d{4}/i, /WhatsApp\s?(Image|Video|Audio)/i] },
  { cat: 'facebook',   patterns: [/FB_IMG_/i, /facebook/i] },
  { cat: 'screenshot', patterns: [/Screenshot/i, /Screen_?[Ss]hot/i] },
  { cat: 'promo',      patterns: [/promo|offer|deal|sale|coupon|discount|cashback/i, /amazon|flipkart|swiggy|zomato/i] },
  { cat: 'received',   patterns: [/^received_/i, /forward/i, /shared/i] },
];

export function categorize(filename: string): Category {
  for (const rule of RULES) {
    if (rule.patterns.some(p => p.test(filename))) return rule.cat;
  }
  return 'personal';
}

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

export async function scanGallery(
  onProgress?: (loaded: number, total: number) => void
): Promise<AnalyzedImage[]> {
  const results: AnalyzedImage[] = [];
  let after: string | undefined;

  const probe = await MediaLibrary.getAssetsAsync({ mediaType: MediaLibrary.MediaType.photo, first: 1 });
  const total = probe.totalCount;

  do {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: 100,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });

    for (const asset of page.assets) {
      results.push({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        fileSize: 0,
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

export async function deleteImages(ids: string[]): Promise<void> {
  await MediaLibrary.deleteAssetsAsync(ids);
}

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

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
