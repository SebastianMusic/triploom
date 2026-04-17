import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppTheme } from '@/components/ui/theme-provider';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const {
    theme: { colors, typography },
  } = useAppTheme();

  return (
    <Text
      style={[
        { color },
        type === 'default'
          ? typography.body
          : type === 'title'
            ? typography.title
            : type === 'subtitle'
              ? typography.subtitle
              : type === 'defaultSemiBold'
                ? { ...typography.body, fontWeight: '600' as const }
                : { ...typography.body, color: colors.primary },
        type === 'link'
          ? {
              textDecorationLine: 'underline',
            }
          : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
