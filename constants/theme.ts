import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  navigationShadow: ColorValue | undefined;
  bgDark: string;
  bg: string;
  bgLight: string;
  text: string;
  textMuted: string;
  textOnImage: string;
  textOnImageMuted: string;
  highlight: string;
  border: string;
  borderMuted: string;
  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  shadow: string;
  imageOverlaySoft: string;
  imageOverlayStrong: string;
  navigationShadow: string;
  navigationFadeStrong: string;
  navigationFadeSoft: string;
  glassTint: string;
  glassShade: string;
  glassEdge: string;
  glassEdgeSoft: string;
};

type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const lightColors: ThemeColors = {
  bgDark: '#F1F5FA',
  bg: '#F6F9FD',
  bgLight: '#FFFFFF',
  text: '#1F2A37',
  textMuted: '#5F6C7B',
  textOnImage: '#FFFFFF',
  textOnImageMuted: '#E7EEF6',
  highlight: '#F4C96B',
  border: '#DCE4EE',
  borderMuted: '#E7EDF4',
  primary: '#4F7FAF',
  secondary: '#E8DCCB',
  danger: '#D64545',
  warning: '#C98A2E',
  success: '#2E8B57',
  info: '#3E8ECF',
  shadow: '#9AA9BC',
  imageOverlaySoft: 'rgba(22,33,47,0.24)',
  imageOverlayStrong: 'rgba(22,33,47,0.42)',
  navigationShadow: 'rgba(52,73,97,0.28)',
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
  text: '#ECF2F8',
  textMuted: '#9BA9B9',
  textOnImage: '#ECF2F8',
  textOnImageMuted: '#C9D5E3',
  highlight: '#D6AB52',
  border: '#253242',
  borderMuted: '#1C2734',
  primary: '#000000',
  secondary: '#8E7A67',
  danger: '#E36767',
  warning: '#D3A257',
  success: '#48A86E',
  info: '#59A2DD',
  shadow: '#04070B',
  imageOverlaySoft: 'rgba(4,7,11,0.28)',
  imageOverlayStrong: 'rgba(4,7,11,0.52)',
  navigationShadow: 'rgba(0,0,0,0.72)',
  navigationFadeStrong: 'rgba(0,0,0,0.98)',
  navigationFadeSoft: 'rgba(0,0,0,0.54)',
  glassTint: 'rgba(16,24,34,0.52)',
  glassShade: 'rgba(110,152,194,0.12)',
  glassEdge: 'rgba(0,0,0,0.28)',
  glassEdgeSoft: 'rgba(0,0,0,0.18)',
};

export const spacing = {
  s: 12,
  m: 24,
  l: 40,
  xl: 64,
};

export const radius = {
  s: 12,
  m: 20,
  l: 30,
  full: 999,
};

export const typography = {
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
    surface: lightColors.bgLight,
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
    surface: darkColors.bgLight,
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
export type AppColors = typeof Colors;
