import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

type ThemeColors = {
  bgDark: string;
  bg: string;
  bgLight: string;
  text: string;
  textMuted: string;
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
};

type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

const lightColors: ThemeColors = {
  bgDark: 'hsl(28 65% 92%)',
  bg: 'hsl(34 72% 96%)',
  bgLight: 'hsl(0 0% 100%)',
  text: 'hsl(18 22% 18%)',
  textMuted: 'hsl(18 12% 42%)',
  highlight: 'hsl(16 76% 90%)',
  border: 'hsl(26 40% 78%)',
  borderMuted: 'hsl(30 34% 86%)',
  primary: 'hsl(0 0% 100%)',
  secondary: 'hsl(28 95% 66%)',
  danger: 'hsl(8 78% 62%)',
  warning: 'hsl(38 95% 56%)',
  success: 'hsl(152 50% 44%)',
  info: 'hsl(202 70% 56%)',
  shadow: 'hsl(20 30% 32%)',
};

const darkColors: ThemeColors = {
  bgDark: 'hsl(0 0% 0%)',
  bg: 'hsl(0 0% 0%)',
  bgLight: 'hsl(0 0% 7%)',
  text: 'hsl(40 22% 96%)',
  textMuted: 'hsl(40 8% 72%)',
  highlight: 'hsl(18 22% 16%)',
  border: 'hsl(0 0% 16%)',
  borderMuted: 'hsl(0 0% 12%)',
  primary: 'hsl(0 0% 100%)',
  secondary: 'hsl(30 85% 62%)',
  danger: 'hsl(8 68% 58%)',
  warning: 'hsl(38 84% 58%)',
  success: 'hsl(152 44% 48%)',
  info: 'hsl(204 64% 60%)',
  shadow: 'hsl(0 0% 0%)',
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
    fontFamily: 'Nunito_700Bold',
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 32,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 28,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Nunito_500Medium',
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
    tint: darkColors.primary,
    icon: darkColors.textMuted,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.primary,
    text: darkColors.text,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Nunito_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Nunito_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export type AppTheme = Theme;
export type AppColors = typeof Colors;
