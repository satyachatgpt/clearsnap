export type Theme = 'light' | 'dark';

export const lightColors = {
  bg:      '#f5f5f7',
  surface: '#ffffff',
  card:    '#ebebf0',
  border:  'rgba(0,0,0,0.1)',
  text:    '#1a1a1a',
  muted:   '#888888',
  sub:     '#aaaaaa',
  green:   '#00a388',
  red:     '#e53935',
  yellow:  '#f59f00',
  blue:    '#1c7ed6',
  purple:  '#7950f2',
  orange:  '#e8590c',
};

export const darkColors = {
  bg:      '#0d0d10',
  surface: '#17171c',
  card:    '#1f1f27',
  border:  'rgba(255,255,255,0.07)',
  text:    '#f2f2f2',
  muted:   '#666666',
  sub:     '#999999',
  green:   '#00c9a7',
  red:     '#ff5a5a',
  yellow:  '#ffc947',
  blue:    '#5b9ef6',
  purple:  '#a78bfa',
  orange:  '#fb923c',
};

export type Colors = typeof lightColors;

export const CAT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  whatsapp:   { label: 'WhatsApp',        icon: 'logo-whatsapp',  color: '#00a388' },
  screenshot: { label: 'Screenshots',     icon: 'phone-portrait', color: '#1c7ed6' },
  facebook:   { label: 'Facebook',        icon: 'logo-facebook',  color: '#1877f2' },
  promo:      { label: 'Promotions',      icon: 'pricetag',       color: '#f59f00' },
  personal:   { label: 'Personal Photos', icon: 'image',          color: '#7950f2' },
  received:   { label: 'Received Files',  icon: 'download',       color: '#e8590c' },
};

export const CAT_KEYS = Object.keys(CAT_CONFIG);

export const BUCKET_ORDER = [
  '1 week', '2 weeks', '3 weeks', '4 weeks',
  '2 months', '6 months', '1 year', '1+ years',
];
