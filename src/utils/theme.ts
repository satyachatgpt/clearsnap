export const colors = {
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

export const CAT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  whatsapp:   { label: 'WhatsApp',        icon: 'logo-whatsapp',  color: colors.green  },
  screenshot: { label: 'Screenshots',     icon: 'phone-portrait', color: colors.blue   },
  facebook:   { label: 'Facebook',        icon: 'logo-facebook',  color: '#60a5fa'     },
  promo:      { label: 'Promotions',      icon: 'pricetag',       color: colors.yellow },
  personal:   { label: 'Personal Photos', icon: 'image',          color: colors.purple },
  received:   { label: 'Received Files',  icon: 'download',       color: colors.orange },
};

export const CAT_KEYS = Object.keys(CAT_CONFIG);

export const BUCKET_ORDER = [
  '1 week', '2 weeks', '3 weeks', '4 weeks',
  '2 months', '6 months', '1 year', '1+ years',
];
