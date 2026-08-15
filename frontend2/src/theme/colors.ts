// FastSend UI v2.0 — "Midnight Studio" dark theme
// All backgrounds are dark (OLED-friendly); lime accent #C4F135

export const colors = {
  // ── Background Stack (3-layer) ──────────────────────────────────────────
  bg:            '#080B0F', // root screen background
  bgCard:        '#111318', // card / panel surfaces
  bgElevated:    '#1A1E25', // input fields, inline sections
  bgOverlay:     '#23282F', // bottom sheets, modals, tooltips
  bgStripe:      '#0E1116', // alternating row backgrounds

  // ── Brand Accent ────────────────────────────────────────────────────────
  lime:              '#C4F135',
  limeLight:         '#D9F76A',
  limeDark:          '#96C018',
  limeGlow:          'rgba(196,241,53,0.15)',
  limeGlowStrong:    'rgba(196,241,53,0.25)',

  // Legacy aliases kept for backward-compat (map to new values)
  amber:         '#C4F135',
  amberLight:    '#D9F76A',
  amberDark:     '#96C018',
  amberGlow:     'rgba(196,241,53,0.15)',

  // ── Text ────────────────────────────────────────────────────────────────
  textPrimary:   '#F0F2F5',
  textSecondary: '#8B919A',
  textMuted:     '#525860',
  textDisabled:  '#363B42',
  textOnLime:    '#0A0D10', // text on lime-colored bg
  // Legacy aliases
  textBase:      '#F0F2F5',

  // ── Borders & Dividers ──────────────────────────────────────────────────
  border:        '#1F2429',
  borderFocus:   '#C4F135',
  borderStrong:  '#2D3338',
  // Legacy
  inputBorder:   '#1F2429',
  divider:       '#1F2429',

  // ── Semantic ────────────────────────────────────────────────────────────
  success:       '#22C55E',
  successLight:  'rgba(34,197,94,0.14)',
  error:         '#F43F5E',
  errorLight:    'rgba(244,63,94,0.14)',
  danger:        '#F43F5E',
  warning:       '#F59E0B',
  warningLight:  'rgba(245,158,11,0.14)',
  info:          '#3B82F6',
  infoLight:     'rgba(59,130,246,0.14)',

  // Legacy
  white:         '#FFFFFF',
  offWhite:      '#F0F2F5',
  yellow:        '#C4F135',
  yellowLight:   '#D9F76A',
  yellowDark:    '#96C018',

  // Backwards-compat names used by notification screen
  bgBase:        '#080B0F',
  bgCardElevated:'#1A1E25',
};
