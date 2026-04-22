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
  rightElement?: React.ReactNode;
};

export function Input({ label, hint, error, multiline = false, containerStyle, style, rightElement, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const {
    theme: { colors, radius, sizes, spacing, stroke, typography },
  } = useAppTheme();

  const borderColor = error ? colors.error : isFocused ? colors.focusRing : colors.transparent;
  const borderWidth = isFocused ? stroke.focus : stroke.thin;

  const textInputEl = (
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
          ...(!rightElement && {
            borderRadius: radius.md,
            borderWidth,
            borderColor,
            backgroundColor: colors.surfaceMuted,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm - spacing.xs / 2,
          }),
          ...(rightElement && {
            flex: 1,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm - spacing.xs / 2,
          }),
          color: colors.text,
          includeFontPadding: false,
          ...typography.body,
          lineHeight: undefined,
        },
        style,
      ]}
      {...props}
    />
  );

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? <AppText variant="caption">{label}</AppText> : null}
      {rightElement ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: sizes.input.md,
            borderRadius: radius.md,
            borderWidth,
            borderColor,
            backgroundColor: colors.surfaceMuted,
            overflow: 'hidden',
          }}>
          {textInputEl}
          {rightElement}
        </View>
      ) : (
        textInputEl
      )}
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
