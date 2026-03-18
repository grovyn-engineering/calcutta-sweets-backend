/**
 * Calcutta Sweets - Brand Color Palette
 * Dark browns (Bistre), Cream (Linen), Terracotta (Ochre)
 */
export const colors = {
  /* Bistre - Dark brown scale (text, dark backgrounds) */
  bistre950: '#1a110c',
  bistre900: '#231810',
  bistre800: '#2c1810',
  bistre700: '#3d2818',
  bistre600: '#4e3420',
  bistre500: '#6b4a30',
  bistre400: '#8a6b4a',
  bistre300: '#a88b6a',
  bistre200: '#c5ad94',
  bistre100: '#e2d5c8',

  /* Linen - Cream backgrounds */
  linen: '#faf0e6',
  linen95: '#f5ebe0',
  linen90: '#f0e6db',
  linen80: '#ebe0d5',

  /* Ochre - CTA, accents */
  ochre600: '#a67c23',
  ochre500: '#c9932d',
  ochre400: '#d4a84b',
  ochre300: '#e0bc6d',
  ochre200: '#ecd18f',
  ochre100: '#f5e6c4',

  parchment: '#f1e9d9',
  pearlBush: '#e8e2d9',
} as const;

/** Semantic tokens for consistent usage */
export const semantic = {
  text: {
    primary: colors.bistre950,
    secondary: colors.bistre500,
    muted: colors.bistre400,
    disabled: colors.bistre300,
  },
  cta: {
    primary: colors.ochre500,
    hover: colors.ochre400,
    active: colors.ochre600,
    muted: colors.ochre200,
  },
} as const;
