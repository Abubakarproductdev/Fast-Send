export const typography = {
  fontBold: 'System',
  fontMedium: 'System',
  fontRegular: 'System',
  fontLight: 'System',

  size: {
    xs: 11,
    sm: 13,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 34,
    hero: 44,
  },

  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    loose: 1.6,
  },

  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h3: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '700' as const },
  caption: { fontSize: 13, fontWeight: '500' as const, color: '#6D756F' },
} as const;
