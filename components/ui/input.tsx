import { useState } from 'react';
import { TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export type InputProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, hint, error, multiline = false, containerStyle, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const {
    theme: { colors, radius, sizes, spacing, stroke, typography },
  } = useAppTheme();

  const borderColor = error ? colors.error : isFocused ? colors.focusRing : colors.border;
  const borderWidth = isFocused ? stroke.focus : stroke.thin;

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      <TextInput
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          props.onBlur?.(event);
        }}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          {
            minHeight: multiline ? sizes.input.lg : sizes.input.md,
            borderRadius: radius.md,
            borderWidth,
            borderColor,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm - spacing.xs / 2,
            color: colors.text,
            ...typography.body,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" tone="error">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
