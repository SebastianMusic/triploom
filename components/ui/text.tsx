import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

type TextVariant = 'title' | 'subtitle' | 'body' | 'caption';
type TextTone = 'default' | 'muted' | 'primary' | 'secondary' | 'accent' | 'error' | 'success' | 'warning';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  const {
    theme: { colors, typography },
  } = useAppTheme();

  const variantStyle =
    variant === 'title'
      ? typography.title
      : variant === 'subtitle'
        ? typography.subtitle
        : variant === 'caption'
          ? typography.caption
          : typography.body;

  const color =
    tone === 'muted'
      ? colors.textMuted
      : tone === 'primary'
        ? colors.primary
        : tone === 'secondary'
          ? colors.secondary
          : tone === 'accent'
            ? colors.accent
            : tone === 'error'
              ? colors.error
              : tone === 'success'
                ? colors.success
                : tone === 'warning'
                  ? colors.warning
                  : colors.text;

  return <Text style={[variantStyle, { color }, style]} {...props} />;
}
