import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';
export type ThemeColorPreset = 'ocean' | 'citrus' | 'forest' | 'rose';

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
  colorPreset: ThemeColorPreset;
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

type ThemeColorOverrides = Pick<
  ThemeColors,
  'primary' | 'primarySoft' | 'secondary' | 'secondarySoft' | 'accent' | 'focusRing'
>;

type ThemeColorPresetConfig = {
  label: string;
  swatch: string;
  light: ThemeColorOverrides;
  dark: ThemeColorOverrides;
};

export const themeColorPresets: Record<ThemeColorPreset, ThemeColorPresetConfig> = {
  ocean: {
    label: 'Ocean',
    swatch: '#4C90B3',
    light: {
      primary: '#4C90B3',
      primarySoft: '#E5F4F8',
      secondary: '#7591A4',
      secondarySoft: '#EAF3F5',
      accent: '#D8BE68',
      focusRing: '#73B0CD',
    },
    dark: {
      primary: '#82BCD8',
      primarySoft: '#173242',
      secondary: '#9CB6C7',
      secondarySoft: '#12232E',
      accent: '#D9C16F',
      focusRing: '#95CCE4',
    },
  },
  citrus: {
    label: 'Citrus',
    swatch: '#C6952E',
    light: {
      primary: '#C6952E',
      primarySoft: '#F9EDCC',
      secondary: '#6E8D7A',
      secondarySoft: '#E7F1EA',
      accent: '#D76B4D',
      focusRing: '#D4A84A',
    },
    dark: {
      primary: '#E0B95B',
      primarySoft: '#392A10',
      secondary: '#97B2A0',
      secondarySoft: '#15231C',
      accent: '#E58A69',
      focusRing: '#E8C66F',
    },
  },
  forest: {
    label: 'Forest',
    swatch: '#3D8771',
    light: {
      primary: '#3D8771',
      primarySoft: '#DFF2EC',
      secondary: '#7A8F9A',
      secondarySoft: '#EAF0F3',
      accent: '#C5A35A',
      focusRing: '#5DA28D',
    },
    dark: {
      primary: '#67B29C',
      primarySoft: '#133229',
      secondary: '#9FB0B8',
      secondarySoft: '#132026',
      accent: '#D7B874',
      focusRing: '#7BC6AF',
    },
  },
  rose: {
    label: 'Rose',
    swatch: '#B76C7A',
    light: {
      primary: '#B76C7A',
      primarySoft: '#F6E6EA',
      secondary: '#7D859C',
      secondarySoft: '#EEF1F7',
      accent: '#D4A35F',
      focusRing: '#CC8E9A',
    },
    dark: {
      primary: '#D2909D',
      primarySoft: '#331921',
      secondary: '#AAB1C4',
      secondarySoft: '#181C29',
      accent: '#E2B975',
      focusRing: '#E0A7B2',
    },
  },
};

function applyThemeColorPreset(
  mode: ThemeMode,
  colors: ThemeColors,
  preset: ThemeColorPreset,
): ThemeColors {
  const overrides = themeColorPresets[preset][mode];
  return {
    ...colors,
    ...overrides,
  };
}

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

export function getTheme(mode: ThemeMode, colorPreset: ThemeColorPreset = 'ocean'): AppTheme {
  const colors = applyThemeColorPreset(
    mode,
    mode === 'dark' ? darkColors : lightColors,
    colorPreset,
  );

  return {
    mode,
    colorPreset,
    colors,
    spacing,
    radius,
    stroke,
    opacity,
    motion,
    sizes,
    layout,
    typography,
    shadows: mode === 'dark'
      ? {
          ...darkShadows,
          sm: { ...darkShadows.sm, shadowColor: colors.shadow },
          md: { ...darkShadows.md, shadowColor: colors.shadow },
          lg: { ...darkShadows.lg, shadowColor: colors.shadow },
        }
      : {
          ...lightShadows,
          sm: { ...lightShadows.sm, shadowColor: colors.shadow },
          md: { ...lightShadows.md, shadowColor: colors.shadow },
          lg: { ...lightShadows.lg, shadowColor: colors.shadow },
        },
  };
}

export const Colors = {
  light: lightColors,
  dark: darkColors,
} as const;

export const Fonts = fontFamilies;
