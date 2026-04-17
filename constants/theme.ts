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
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  full: 999,
} as const;

export const stroke = {
  none: 0,
  thin: 1,
  focus: 2,
} as const;

export const opacity = {
  pressed: 0.88,
  hover: 0.94,
  disabled: 0.45,
} as const;

export const motion = {
  fast: 160,
  normal: 220,
  slow: 320,
} as const;

export const sizes = {
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  button: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  input: {
    md: 52,
    lg: 120,
  },
  avatar: {
    sm: 32,
    md: 44,
    lg: 56,
  },
  listItem: {
    minHeight: 72,
  },
} as const;

export const layout = {
  screenPadding: spacing.md,
  contentGap: spacing.md,
  sectionGap: spacing.lg,
  rowGap: spacing.sm,
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
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
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
  accentSoft: string;
  border: string;
  borderStrong: string;
  focusRing: string;
  icon: string;
  shadow: string;
  overlay: string;
  info: string;
  infoSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  tabIconDefault: string;
  tabIconSelected: string;
  navigationPill: string;
};

type ThemeShadows = {
  none: ViewStyle;
  sm: ViewStyle;
  md: ViewStyle;
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
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F5F8',
  text: '#101214',
  textMuted: '#5F6B77',
  textOnPrimary: '#FFFFFF',
  primary: '#5877A6',
  primarySoft: '#E8EEF7',
  secondary: '#E7DDD0',
  secondarySoft: '#F4EEE5',
  accent: '#E7C86B',
  accentSoft: '#FBF2D2',
  border: '#E3E8EE',
  borderStrong: '#CBD4DE',
  focusRing: '#6D88B2',
  icon: '#6D7782',
  shadow: 'rgba(16,18,20,0.10)',
  overlay: 'rgba(16,18,20,0.08)',
  info: '#5877A6',
  infoSoft: '#E8EEF7',
  success: '#2F855A',
  successSoft: '#E7F3EC',
  warning: '#B6802F',
  warningSoft: '#F8EEDB',
  error: '#C65555',
  errorSoft: '#FAE8E8',
  tabIconDefault: '#6D7782',
  tabIconSelected: '#5877A6',
  navigationPill: '#EEF2F6',
};

const darkColors: ThemeColors = {
  transparent: 'transparent',
  background: '#000000',
  surface: '#0B0D0F',
  surfaceMuted: '#15181B',
  text: '#F5F7F9',
  textMuted: '#A6B0BA',
  textOnPrimary: '#F5F7F9',
  primary: '#7F9CC7',
  primarySoft: '#172130',
  secondary: '#8E7C63',
  secondarySoft: '#1C1814',
  accent: '#D3B362',
  accentSoft: '#282111',
  border: '#1C2127',
  borderStrong: '#2B333B',
  focusRing: '#8EACD6',
  icon: '#A6B0BA',
  shadow: 'rgba(0,0,0,0.46)',
  overlay: 'rgba(0,0,0,0.34)',
  info: '#7F9CC7',
  infoSoft: '#172130',
  success: '#59A37E',
  successSoft: '#122018',
  warning: '#CAA162',
  warningSoft: '#241C10',
  error: '#D97373',
  errorSoft: '#2A1616',
  tabIconDefault: '#A6B0BA',
  tabIconSelected: '#F5F7F9',
  navigationPill: '#171C21',
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
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  md: {
    shadowColor: lightColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  md: {
    shadowColor: darkColors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
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
