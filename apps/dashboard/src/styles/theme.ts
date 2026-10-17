/**
 * Calcutta Sweets - Brand Color Palette
 * Warm ink (Bistre), Ivory (Linen), Burgundy (Ochre), Champagne gold, Espresso chrome
 */
export const colors = {
  /* Bistre - Dark brown scale (text, dark backgrounds) */
  bistre950: '#1c1612',
  bistre900: '#2a221c',
  bistre800: '#3a2f27',
  bistre700: '#4a3d33',
  bistre600: '#5e5148',
  bistre500: '#6b5d52',
  bistre400: '#7f7064',
  bistre300: '#a89a8e',
  bistre200: '#d6ccc1',
  bistre100: '#ece6dd',

  /* Linen - Cream backgrounds */
  linen: '#f5f1ea',
  linen95: '#f5f1ea',
  linen90: '#f0ebe4',
  linen80: '#e9e2d8',

  /* Ochre - CTA, accents */
  ochre600: '#66212a',
  ochre500: '#7e2a33',
  ochre400: '#973843',
  ochre300: '#c27a82',
  ochre200: '#e8c9cc',
  ochre100: '#f7ebec',

  gold300: '#e6c08a',
  gold500: '#c9a35c',
  gold700: '#8a6a2f',
  espresso950: '#16110e',

  parchment: '#fbf9f6',
  pearlBush: '#ece6dd',
} as const;

/** Semantic tokens for consistent usage */
export const semantic = {
  text: {
    primary: colors.bistre950,
    secondary: colors.bistre600,
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
