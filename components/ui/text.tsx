import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type TextVariant = 'title' | 'subtitle' | 'body' | 'caption';
type TextTone = 'default' | 'muted' | 'primary' | 'secondary' | 'danger' | 'success';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

export function AppText({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  const {
    theme: { colors, typography },
  } = useAppTheme();

  const variantStyle: TextStyle =
    variant === 'title'
      ? {
          fontSize: typography.title.fontSize,
          fontWeight: typography.title.fontWeight,
          fontFamily: typography.title.fontFamily,
          lineHeight: typography.title.lineHeight,
        }
      : variant === 'subtitle'
        ? {
            fontSize: typography.subtitle.fontSize,
            fontWeight: typography.subtitle.fontWeight,
            fontFamily: typography.subtitle.fontFamily,
            lineHeight: typography.subtitle.lineHeight,
          }
        : variant === 'caption'
          ? {
              fontSize: typography.caption.fontSize,
              fontWeight: typography.caption.fontWeight,
              fontFamily: typography.caption.fontFamily,
              lineHeight: typography.caption.lineHeight,
            }
          : {
              fontSize: typography.body.fontSize,
              fontWeight: typography.body.fontWeight,
              fontFamily: typography.body.fontFamily,
              lineHeight: typography.body.lineHeight,
            };

  const color =
    tone === 'muted'
      ? colors.textMuted
      : tone === 'primary'
        ? colors.primary
        : tone === 'secondary'
          ? colors.secondary
          : tone === 'danger'
            ? colors.danger
            : tone === 'success'
              ? colors.success
              : colors.text;

  return <Text style={[variantStyle, { color }, style]} {...props} />;
}
