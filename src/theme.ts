/**
 * Theme tokens derived from DESIGN.md (Raycast Design System)
 */
export const theme = {
  colors: {
    primary: '#ffffff',
    primaryPressed: '#e8e8e8',
    onPrimary: '#000000',
    ink: '#f4f4f6',
    body: '#cdcdcd',
    charcoal: '#d3d3d4',
    mute: '#9c9c9d',
    ash: '#6a6b6c',
    stone: '#434345',
    onDark: '#ffffff',
    canvas: '#07080a',
    surface: '#0d0d0d',
    surfaceElevated: '#101111',
    surfaceCard: '#121212',
    hairline: '#242728',
    hairlineSoft: 'rgba(255,255,255,0.08)',
    hairlineStrong: 'rgba(255,255,255,0.16)',
    accentRed: '#ff6161',
    accentRedSoft: 'rgba(255,97,97,0.15)',
    accentGreen: '#59d499',
    accentGreenSoft: 'rgba(89,212,153,0.15)',
    accentYellow: '#ffc533',
    accentYellowSoft: 'rgba(255,197,51,0.15)',
    accentBlue: '#57c1ff',
    accentBlueSoft: 'rgba(87,193,255,0.15)',
  },
  typography: {
    hero: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38,
      color: '#f4f4f6',
    },
    title: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
      color: '#f4f4f6',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      color: '#cdcdcd',
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      color: '#9c9c9d',
    },
    code: {
      fontFamily: 'monospace',
      fontSize: 13,
      color: '#57c1ff',
    },
  },
  rounded: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
} as const;

export type Theme = typeof theme;
