import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  full: 999,
} as const;

export const stroke = {
  none: 0,
  thin: 1,
  focus: 2,
} as const;

export const opacity = {
  pressed: 0.9,
  hover: 0.96,
  disabled: 0.45,
} as const;

export const motion = {
  fast: 180,
  normal: 240,
  slow: 320,
} as const;

export const sizes = {
  icon: {
    sm: 18,
    md: 22,
    lg: 26,
  },
  button: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  input: {
    md: 52,
    lg: 128,
  },
  avatar: {
    sm: 36,
    md: 48,
    lg: 64,
  },
  iconButton: {
    md: 44,
    lg: 52,
  },
  listItem: {
    minHeight: 76,
  },
  navigation: {
    barHeight: 72,
    headerAction: 44,
    indicatorInset: 8,
  },
} as const;

export const layout = {
  screenPadding: 20,
  contentGap: spacing.md,
  sectionGap: spacing.lg,
  rowGap: spacing.sm,
  headerPaddingHorizontal: 20,
  headerPaddingBottom: spacing.sm,
  floatingBarWidth: '92%' as const,
  floatingBarMaxWidth: 460,
} as const;

const fontFamilies = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  },
}) ?? {
  sans: 'sans-serif',
  serif: 'serif',
  rounded: 'sans-serif',
  mono: 'monospace',
};

export const typography = {
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
} as const satisfies Record<string, TextStyle>;

type ThemeColors = {
  transparent: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  border: string;
  borderStrong: string;
  focusRing: string;
  icon: string;
  shadow: string;
  overlay: string;
  overlayStrong: string;
  success: string;
  warning: string;
  error: string;
};

type ThemeShadows = {
  none: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
  lg: ViewStyle;
};

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  stroke: typeof stroke;
  opacity: typeof opacity;
  motion: typeof motion;
  sizes: typeof sizes;
  layout: typeof layout;
  typography: typeof typography;
  shadows: ThemeShadows;
};

const lightColors: ThemeColors = {
  transparent: 'transparent',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF5F7',
  text: '#14202B',
  textMuted: '#647487',
  textOnPrimary: '#FFFFFF',
  primary: '#4C90B3',
  primarySoft: '#E5F4F8',
  secondary: '#7591A4',
  secondarySoft: '#EAF3F5',
  accent: '#D8BE68',
  border: '#E1E9F2',
  borderStrong: '#CCD8E5',
  focusRing: '#73B0CD',
  icon: '#6B7C90',
  shadow: 'rgba(20, 32, 43, 0.14)',
  overlay: 'rgba(20, 32, 43, 0.08)',
  overlayStrong: 'rgba(20, 32, 43, 0.58)',
  success: '#2F8B5E',
  warning: '#BB9450',
  error: '#C85A54',
};

const darkColors: ThemeColors = {
  transparent: 'transparent',
  background: '#000000',
  surface: '#0B1017',
  surfaceMuted: '#13212C',
  text: '#F5F7FB',
  textMuted: '#9AA9BC',
  textOnPrimary: '#F5F7FB',
  primary: '#82BCD8',
  primarySoft: '#173242',
  secondary: '#9CB6C7',
  secondarySoft: '#12232E',
  accent: '#D9C16F',
  border: '#1A2430',
  borderStrong: '#253345',
  focusRing: '#95CCE4',
  icon: '#A0AEC0',
  shadow: 'rgba(0, 0, 0, 0.56)',
  overlay: 'rgba(0, 0, 0, 0.42)',
  overlayStrong: 'rgba(0, 0, 0, 0.72)',
  success: '#61B07F',
  warning: '#D3A965',
  error: '#E07A73',
};

const lightShadows: ThemeShadows = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  md: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  lg: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
};

const darkShadows: ThemeShadows = {
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  sm: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.65,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  md: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4,
  },
  lg: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 0.75,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 13 },
    elevation: 7,
  },
};

export function getTheme(mode: ThemeMode): AppTheme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    stroke,
    opacity,
    motion,
    sizes,
    layout,
    typography,
    shadows: mode === 'dark' ? darkShadows : lightShadows,
  };
}

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

export const Fonts = fontFamilies;
