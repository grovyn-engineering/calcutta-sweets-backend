/**
 * Calcutta Sweets - operations palette (mirrors the CSS variables in app/globals.css).
 * Neutral ink + stone canvas, one brand accent (deep copper from the logo), status colours.
 */
export const colors = {
  /* Ink - neutral scale (text, icons, borders) */
  bistre950: '#18181b',
  bistre900: '#27272a',
  bistre800: '#3f3f46',
  bistre700: '#52525b',
  bistre600: '#52525b',
  bistre500: '#5f5f69',
  bistre400: '#71717a',
  bistre300: '#a1a1aa',
  bistre200: '#d4d4d8',
  bistre100: '#e4e4e7',

  /* Canvas & subtle fills */
  linen: '#f7f7f6',
  linen95: '#f7f7f6',
  linen90: '#f0f0ee',
  linen80: '#e7e7e4',

  /* Copper - brand accent: CTA, links, selection */
  ochre700: '#74360f',
  ochre600: '#8f4218',
  ochre500: '#a84f1c',
  ochre400: '#c8773a',
  ochre300: '#e0a27a',
  ochre200: '#f3d2bc',
  ochre100: '#fdf1e8',

  parchment: '#fbfbfa',
  pearlBush: '#e6e6e3',
} as const;

/** Semantic tokens for consistent usage */
export const semantic = {
  text: {
    primary: colors.bistre950,
    secondary: colors.bistre700,
    muted: colors.bistre400,
    disabled: colors.bistre300,
  },
  cta: {
    primary: colors.ochre500,
    hover: colors.ochre400,
    active: colors.ochre600,
    muted: colors.ochre200,
  },
  status: {
    success: '#15803d',
    warning: '#a16207',
    danger: '#b91c1c',
    info: '#1d4ed8',
  },
} as const;
