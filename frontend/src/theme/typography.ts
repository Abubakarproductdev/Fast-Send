export const typography = {
  fontBold:    'System',
  fontMedium:  'System',
  fontRegular: 'System',
  fontLight:   'System',

  size: {
    xs:   12,
    sm:   14,
    base: 16,
    md:   18,
    lg:   22,
    xl:   28,
    xxl:  34,
    hero: 42,
  },

  lineHeight: {
    tight:  1.1,
    normal: 1.4,
    loose:  1.6,
  },

  h1: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#A0A0A0',
  },
};
