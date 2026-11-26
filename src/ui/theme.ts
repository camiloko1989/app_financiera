// Tokens del sistema visual (docs/pantallas.md §1).
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#F6F7F9', // fondo de pantalla
  surface: '#FFFFFF', // tarjetas
  border: '#E5E7EB',
  divider: '#F1F2F4',
  inputBorder: '#D1D5DB',
  text: '#111827', // texto principal
  textBody: '#374151', // párrafos
  textMuted: '#4B5563', // etiquetas y secundarios (pasa 4.5:1 sobre blanco y sobre bg)
  accent: '#1D4ED8', // acción primaria, links, selección
  accentPressed: '#1E40AF',
  secondarySplit: '#93A4C8', // segunda parte de la barra de reparto
  onAccent: '#FFFFFF',

  // semánticos (texto / fondo / borde)
  danger: { fg: '#B42318', bg: '#FEF3F2', border: '#FECDCA' },
  warning: { fg: '#B54708', bg: '#FFFAEB', border: '#FEDF89' },
  success: { fg: '#067647', bg: '#ECFDF3', border: '#ABEFC6' },
  neutral: { fg: '#4B5563', bg: '#F1F2F4' },
} as const;

export type Tone = 'danger' | 'warning' | 'success' | 'neutral';

export const radius = { sm: 8, md: 10, lg: 12, card: 14, hero: 16, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const touch = { min: 44, primaryButton: 52, navItem: 48 } as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

// Tipografía (docs/pantallas.md §1.2). Los estilos de montos usan cifras tabulares.
export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 34, letterSpacing: -0.5, fontVariant: tabular },
  title: { fontFamily: fonts.bold, fontSize: 22 },
  screenTitle: { fontFamily: fonts.bold, fontSize: 18 },
  metric: { fontFamily: fonts.bold, fontSize: 18, fontVariant: tabular },
  section: { fontFamily: fonts.bold, fontSize: 17 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  caption: { fontFamily: fonts.regular, fontSize: 12 },
  overline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  badge: { fontFamily: fonts.bold, fontSize: 11, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;
