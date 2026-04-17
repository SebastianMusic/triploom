import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  bgDark: string;
  bg: string;
  bgLight: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textOnImage: string;
  textOnImageMuted: string;
  highlight: string;
  highlightSoft: string;
  border: string;
  borderMuted: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
  shadow: string;
  imageOverlaySoft: string;
  imageOverlayStrong: string;
  navigationShadow: string;
  navigationPill: string;
  navigationFadeStrong: string;
  navigationFadeSoft: string;
  glassTint: string;
  glassShade: string;
  glassEdge: string;
  glassEdgeSoft: string;
};

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const lightColors: ThemeColors = {
  bgDark: '#F1F5FA',
  bg: '#F6F9FD',
  bgLight: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3F8',
  text: '#1F2A37',
  textMuted: '#5F6C7B',
  textOnImage: '#FFFFFF',
  textOnImageMuted: '#E7EEF6',
  highlight: '#F4C96B',
  highlightSoft: '#FBF2CF',
  border: '#DCE4EE',
  borderMuted: '#E7EDF4',
  primary: '#4F7FAF',
  primarySoft: '#E8F0F7',
  secondary: '#E8DCCB',
  secondarySoft: '#F5EEE4',
  danger: '#D64545',
  dangerSoft: '#F8E6E6',
  warning: '#C98A2E',
  warningSoft: '#F7EEDB',
  success: '#2E8B57',
  successSoft: '#E7F4EC',
  info: '#3E8ECF',
  infoSoft: '#E7F1FA',
  shadow: '#9AA9BC',
  imageOverlaySoft: 'rgba(22,33,47,0.24)',
  imageOverlayStrong: 'rgba(22,33,47,0.42)',
  navigationShadow: 'rgba(52,73,97,0.28)',
  navigationPill: '#E7EDF4',
  navigationFadeStrong: 'rgba(246,249,253,0.96)',
  navigationFadeSoft: 'rgba(246,249,253,0.58)',
  glassTint: 'rgba(255,255,255,0.50)',
  glassShade: 'rgba(79,127,175,0.10)',
  glassEdge: 'rgba(20,32,47,0.11)',
  glassEdgeSoft: 'rgba(20,32,47,0.06)',
};

const darkColors: ThemeColors = {
  bgDark: '#000000',
  bg: '#000000',
  bgLight: '#0B0B0B',
  surface: '#0B0B0B',
  surfaceMuted: '#16181B',
  text: '#ECF2F8',
  textMuted: '#9BA9B9',
  textOnImage: '#ECF2F8',
  textOnImageMuted: '#C9D5E3',
  highlight: '#D6AB52',
  highlightSoft: '#2A2417',
  border: '#253242',
  borderMuted: '#1C2734',
  primary: '#000000',
  primarySoft: '#15181C',
  secondary: '#8E7A67',
  secondarySoft: '#211C17',
  danger: '#E36767',
  dangerSoft: '#2A1414',
  warning: '#D3A257',
  warningSoft: '#2B2113',
  success: '#48A86E',
  successSoft: '#112016',
  info: '#59A2DD',
  infoSoft: '#10202C',
  shadow: '#04070B',
  imageOverlaySoft: 'rgba(4,7,11,0.28)',
  imageOverlayStrong: 'rgba(4,7,11,0.52)',
  navigationShadow: 'rgba(0,0,0,0.72)',
  navigationPill: '#1C2734',
  navigationFadeStrong: 'rgba(0,0,0,0.98)',
  navigationFadeSoft: 'rgba(0,0,0,0.54)',
  glassTint: 'rgba(16,24,34,0.52)',
  glassShade: 'rgba(110,152,194,0.12)',
  glassEdge: 'rgba(0,0,0,0.28)',
  glassEdgeSoft: 'rgba(0,0,0,0.18)',
};

export const spacing = {
  xs: 8,
  s: 12,
  m: 24,
  l: 40,
  xl: 64,
  xxl: 80,
};

export const radius = {
  xs: 8,
  s: 12,
  m: 20,
  l: 30,
  xl: 36,
  full: 999,
};

export const typography = {
  display: {
    fontSize: 44,
    fontWeight: '700' as const,
    fontFamily: 'PlusJakartaSans_700Bold',
    lineHeight: 54,
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    fontFamily: 'PlusJakartaSans_700Bold',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    lineHeight: 32,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 28,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    lineHeight: 22,
  },
};

export const motion = {
  fast: 180,
  normal: 240,
  slow: 320,
};

export const layout = {
  screenHorizontalPadding: spacing.m,
  screenVerticalGap: spacing.m,
  tabBarWidthRatio: 0.9,
};

export const getTheme = (mode: ThemeMode): Theme => ({
  colors: mode === 'dark' ? darkColors : lightColors,
  spacing,
  radius,
  typography,
});

export const Colors = {
  light: {
    ...lightColors,
    background: lightColors.bg,
    surface: lightColors.surface,
    surfaceMuted: lightColors.surfaceMuted,
    textPrimary: lightColors.text,
    textSecondary: lightColors.textMuted,
    textOnImage: lightColors.textOnImage,
    tint: lightColors.primary,
    icon: lightColors.textMuted,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: lightColors.primary,
    text: lightColors.text,
  },
  dark: {
    ...darkColors,
    background: darkColors.bg,
    surface: darkColors.surface,
    surfaceMuted: darkColors.surfaceMuted,
    textPrimary: darkColors.text,
    textSecondary: darkColors.textMuted,
    textOnImage: darkColors.textOnImage,
    tint: darkColors.primary,
    icon: darkColors.textMuted,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.primary,
    text: darkColors.text,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'PlusJakartaSans_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'PlusJakartaSans_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type AppTheme = Theme;
export type AppColors = ThemeColors;
