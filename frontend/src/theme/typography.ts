export const typography = {
  // Font families
  fontBold:    'System',   // Platform default bold
  fontRegular: 'System',   // Platform default regular

  // Font sizes
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  30,
    hero: 38,
  },

  // Line heights
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },

  // Common text styles
  h2: {
    fontSize: 24, // Matches size.xl
    fontWeight: 'bold' as const,
  },
  bodyBold: {
    fontSize: 15, // Matches size.base
    fontWeight: 'bold' as const,
  },
  caption: {
    fontSize: 13, // Matches size.sm
  }
};
