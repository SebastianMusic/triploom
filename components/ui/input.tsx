import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type InputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, helperText, errorText, containerStyle, multiline, style, ...props }: InputProps) {
  const {
    theme: { colors, spacing, radius, typography },
  } = useAppTheme();

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        style={[
          {
            minHeight: multiline ? spacing.xl * 1.8 : spacing.l + spacing.s,
            paddingHorizontal: spacing.m - spacing.s / 2,
            paddingVertical: spacing.s + 2,
            borderRadius: radius.m,
            borderWidth: 1,
            borderColor: errorText ? colors.danger : colors.borderMuted,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight,
            fontFamily: typography.body.fontFamily,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
        {...props}
      />
      {errorText ? (
        <AppText variant="caption" tone="danger">
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" tone="muted">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}
