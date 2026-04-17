import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
type TextTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'info';

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
    variant === 'display'
      ? {
          fontSize: typography.display.fontSize,
          fontWeight: typography.display.fontWeight,
          fontFamily: typography.display.fontFamily,
          lineHeight: typography.display.lineHeight,
        }
      : variant === 'title'
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
            : variant === 'label'
              ? {
                  fontSize: typography.label.fontSize,
                  fontWeight: typography.label.fontWeight,
                  fontFamily: typography.label.fontFamily,
                  lineHeight: typography.label.lineHeight,
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
              : tone === 'warning'
                ? colors.warning
                : tone === 'info'
                  ? colors.info
              : colors.text;

  return <Text style={[variantStyle, { color }, style]} {...props} />;
}
