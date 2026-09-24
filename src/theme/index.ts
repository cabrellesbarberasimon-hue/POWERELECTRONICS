/**
 * Centralised design tokens. Colours were sampled from the mockups in
 * assets/reference (DIARIO_DE_INNOVACIÓN annexes).
 */
export const colors = {
  primary: '#1E88C4', // SENSE blue (splash, headers, icons)
  primaryDark: '#1672A6',
  primarySoft: '#E3F1FA',
  navy: '#06205B', // Power Electronics navy (login button, accents)
  orange: '#FE6320', // CTAs ("TRAINING EXPERIENCE", "Step by Step")
  orangeDark: '#E0521A',
  green: '#2DBE4E', // completed checks
  red: '#E5333B', // urgent alerts / remove
  yellow: '#F5B400', // preventive alerts / stars
  bg: '#FFFFFF',
  surface: '#EDEDED', // module cards
  surfaceAlt: '#F5F6F8',
  darkTab: '#3A3A3A', // inactive dark tab (Corporate / Training)
  text: '#1D1D1F',
  textMuted: '#6B7280',
  border: '#D6D9DE',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(6, 32, 91, 0.55)',
} as const;

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 } as const;

export const fontSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, hero: 40 } as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

export const theme = { colors, fonts, spacing, radius, fontSize, shadow };
export type Theme = typeof theme;
