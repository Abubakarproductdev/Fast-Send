/**
 * Fast Send — Atlas editorial palette.
 *
 * Warm paper surfaces and ink typography make the photo workflow feel calm and
 * considered, while coral and sage accents keep live actions easy to spot.
 */
export const lightColors = {
  primary: '#E86F56',
  primaryLight: '#F7B6A6',
  primaryDark: '#B94D3D',
  primaryGlow: 'rgba(232, 111, 86, 0.16)',

  bg: '#F4F1EB',
  bgCard: '#FFFDF8',
  bgElevated: '#ECE8E0',
  bgStripe: '#E8E3DA',

  textPrimary: '#1F2926',
  textSecondary: '#6D756F',
  textMuted: '#99A09A',
  textDisabled: '#C1C5BE',
  textGold: '#C45D49',

  border: '#E5E0D7',
  borderStrong: '#D7D1C6',
  divider: '#EAE5DD',

  success: '#5D927B',
  successLight: 'rgba(93, 146, 123, 0.14)',
  error: '#C6534C',
  errorLight: 'rgba(198, 83, 76, 0.12)',
  warning: '#C58A3A',
  warningLight: 'rgba(197, 138, 58, 0.14)',

  ink: '#1F2926',
  paper: '#FFFDF8',
  sage: '#DCE7DE',
  sageDark: '#315B51',
  coral: '#E86F56',

  // Compatibility aliases used by older screens/components.
  amber: '#E86F56',
  amberLight: '#F7B6A6',
  amberDark: '#B94D3D',
  amberGlow: 'rgba(232, 111, 86, 0.16)',
  danger: '#C6534C',
  bgBase: '#F4F1EB',
  textBase: '#1F2926',
  yellow: '#E86F56',
  offWhite: '#FFFDF8',
} as const;

export const darkColors = {
  ...lightColors,
  primary: '#934B40',
  primaryLight: '#C87967',
  primaryDark: '#FFB19D',
  primaryGlow: 'rgba(242, 139, 115, 0.20)',
  bg: '#121917',
  bgCard: '#1B2421',
  bgElevated: '#26312D',
  bgStripe: '#202A26',
  textPrimary: '#F8F3EB',
  textSecondary: '#B9C3BC',
  textMuted: '#829089',
  textDisabled: '#59655E',
  textGold: '#FFB19D',
  border: '#31403A',
  borderStrong: '#435149',
  divider: '#293630',
  success: '#86C5A5',
  successLight: 'rgba(134, 197, 165, 0.16)',
  error: '#F28A7E',
  errorLight: 'rgba(242, 138, 126, 0.16)',
  warning: '#E6B66A',
  warningLight: 'rgba(230, 182, 106, 0.16)',
  ink: '#F8F3EB',
  paper: '#1B2421',
  sage: '#2E4940',
  sageDark: '#24352E',
  coral: '#934B40',
  amber: '#934B40',
  amberLight: '#6D3D36',
  amberDark: '#FFB19D',
  amberGlow: 'rgba(242, 139, 115, 0.20)',
  danger: '#F28A7E',
  bgBase: '#121917',
  textBase: '#F8F3EB',
  yellow: '#934B40',
  offWhite: '#1B2421',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };
export const colors = lightColors;
