/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/components/ui/theme-provider';

type ThemeColorKey = keyof AppTheme['colors'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorKey
) {
  const { mode, theme } = useAppTheme();
  const colorFromProps = props[mode];

  if (colorFromProps) {
    return colorFromProps;
  }

  return theme.colors[colorName] ?? Colors[mode][colorName as keyof typeof Colors.light];
}
