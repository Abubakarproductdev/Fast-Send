// FastSend UI v2.0 — Spacing & geometry tokens

export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
};

export const radius = {
  xs:   6,    // small tags, badges
  sm:   10,   // inner elements within cards
  md:   14,   // input fields
  lg:   20,   // cards, panels
  xl:   28,   // large cards, QR card
  xxl:  36,   // full-bleed hero cards
  pill: 999,  // buttons, pills, tab bar
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
  limeGlow: {
    shadowColor: '#C4F135',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
};
