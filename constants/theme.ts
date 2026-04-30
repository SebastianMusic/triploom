import type { TextStyle, ViewStyle } from 'react-native';

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
  screenPadding: spacing.sm,
  contentGap: spacing.sm,
  sectionGap: spacing.md,
  rowGap: spacing.sm,
  headerPaddingHorizontal: spacing.sm,
  headerPaddingBottom: spacing.sm,
  floatingBarWidth: '92%' as const,
  floatingBarMaxWidth: 460,
} as const;

const fontFamilies = {
  sansRegular: 'Roboto_400Regular',
  sansMedium: 'Roboto_500Medium',
  sansBold: 'Roboto_700Bold',
  sansBlack: 'Roboto_900Black',
} as const;

export const typography = {
  title: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 16,
    lineHeight: 26,
  },
  caption: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 22,
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
  successSoft: string;
  warningSoft: string;
  errorSoft: string;
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
  background: '#F7FBFF',
  surface: '#FFFFFF',
  surfaceMuted: '#EBF7FB',
  text: '#10202A',
  textMuted: '#5E7282',
  textOnPrimary: '#FFFFFF',
  primary: '#119FB3',
  primarySoft: '#DDF7FA',
  secondary: '#2F81C6',
  secondarySoft: '#E7F1FF',
  accent: '#F1C84C',
  successSoft: '#DFF4EA',
  warningSoft: '#FBEFCC',
  errorSoft: '#FBE2DF',
  border: '#D6E9F1',
  borderStrong: '#BDD7E5',
  focusRing: '#58C2D2',
  icon: '#5F7486',
  shadow: 'rgba(16, 32, 42, 0.12)',
  overlay: 'rgba(16, 32, 42, 0.08)',
  overlayStrong: 'rgba(16, 32, 42, 0.54)',
  success: '#219165',
  warning: '#C48A2C',
  error: '#CC5B52',
};

const darkColors: ThemeColors = {
  transparent: 'transparent',
  background: '#071219',
  surface: '#0D1B24',
  surfaceMuted: '#112733',
  text: '#F5F9FC',
  textMuted: '#9AB1BF',
  textOnPrimary: '#F5F9FC',
  primary: '#57C7D4',
  primarySoft: '#143541',
  secondary: '#7BAFDD',
  secondarySoft: '#142636',
  accent: '#F0C45A',
  successSoft: '#133629',
  warningSoft: '#3C3118',
  errorSoft: '#3B1F1C',
  border: '#1C3340',
  borderStrong: '#264454',
  focusRing: '#7BDDEA',
  icon: '#A4BCCB',
  shadow: 'rgba(2, 10, 14, 0.46)',
  overlay: 'rgba(3, 9, 14, 0.4)',
  overlayStrong: 'rgba(3, 9, 14, 0.66)',
  success: '#63C08D',
  warning: '#E0AA53',
  error: '#F08A80',
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
    label: 'Lagoon',
    swatch: '#119FB3',
    light: {
      primary: '#119FB3',
      primarySoft: '#DDF7FA',
      secondary: '#2F81C6',
      secondarySoft: '#E7F1FF',
      accent: '#F1C84C',
      focusRing: '#58C2D2',
    },
    dark: {
      primary: '#57C7D4',
      primarySoft: '#143541',
      secondary: '#7BAFDD',
      secondarySoft: '#142636',
      accent: '#F0C45A',
      focusRing: '#7BDDEA',
    },
  },
  citrus: {
    label: 'Sunset',
    swatch: '#F09A21',
    light: {
      primary: '#F09A21',
      primarySoft: '#FFF0D8',
      secondary: '#E65E54',
      secondarySoft: '#FFE6E0',
      accent: '#F4C94E',
      focusRing: '#F3B24A',
    },
    dark: {
      primary: '#F5B24A',
      primarySoft: '#40280B',
      secondary: '#F08B7F',
      secondarySoft: '#351B1B',
      accent: '#F4CF65',
      focusRing: '#F7C46A',
    },
  },
  forest: {
    label: 'Palm',
    swatch: '#1E9D74',
    light: {
      primary: '#1E9D74',
      primarySoft: '#DDF7EE',
      secondary: '#1F8EAE',
      secondarySoft: '#E2F5F8',
      accent: '#F0C15D',
      focusRing: '#47BA91',
    },
    dark: {
      primary: '#55C19E',
      primarySoft: '#12352B',
      secondary: '#67BCD6',
      secondarySoft: '#112A34',
      accent: '#EBC56D',
      focusRing: '#72D4B0',
    },
  },
  rose: {
    label: 'Coral',
    swatch: '#E26D6D',
    light: {
      primary: '#E26D6D',
      primarySoft: '#FFE7E4',
      secondary: '#C75395',
      secondarySoft: '#FBE7F4',
      accent: '#F3B24E',
      focusRing: '#EB8D8D',
    },
    dark: {
      primary: '#F08C87',
      primarySoft: '#3B1A1C',
      secondary: '#DB7DB8',
      secondarySoft: '#2F1730',
      accent: '#F0BF60',
      focusRing: '#F5AAA4',
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
