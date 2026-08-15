// FastSend UI v2.0 — Inter + SpaceMono type scale
// Load fonts in _layout.tsx via @expo-google-fonts/inter and @expo-google-fonts/space-mono

export const typography = {
  // ── Font family tokens ───────────────────────────────────────────────────
  fontRegular:   'Inter_400Regular',
  fontMedium:    'Inter_500Medium',
  fontSemiBold:  'Inter_600SemiBold',
  fontBold:      'Inter_700Bold',
  fontExtraBold: 'Inter_800ExtraBold',
  fontMono:      'SpaceMono_400Regular',

  // ── Size scale (px) ──────────────────────────────────────────────────────
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  32,
    hero: 40,
  },

  // ── Composite text styles ────────────────────────────────────────────────
  hero: {
    fontSize: 40,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  h1: {
    fontSize: 32,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1.0,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  monoCode: {
    fontSize: 28,
    fontFamily: 'SpaceMono_400Regular',
    letterSpacing: 8,
    lineHeight: 34,
  },
  monoSmall: {
    fontSize: 14,
    fontFamily: 'SpaceMono_400Regular',
    letterSpacing: 2,
    lineHeight: 20,
  },

  // Legacy aliases
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
};
