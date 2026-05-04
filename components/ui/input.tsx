import { useState } from 'react';
import { Platform, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

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
  const { lineHeight: bodyLineHeight, ...bodyTextStyle } = typography.body;

  const borderColor = error ? colors.error : isFocused ? colors.focusRing : colors.border;
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
          height: multiline ? undefined : sizes.input.md,
          ...(!rightElement && {
            borderRadius: radius.md,
            borderWidth,
            borderColor,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.sm,
            paddingTop: multiline ? spacing.sm - spacing.xs / 2 : 0,
            paddingBottom: multiline ? spacing.sm - spacing.xs / 2 : 0,
          }),
          ...(rightElement && {
            flex: 1,
            paddingHorizontal: spacing.sm,
            paddingTop: multiline ? spacing.sm - spacing.xs / 2 : 0,
            paddingBottom: multiline ? spacing.sm - spacing.xs / 2 : 0,
          }),
          color: colors.text,
          includeFontPadding: false,
          ...bodyTextStyle,
          ...(multiline
            ? { lineHeight: bodyLineHeight }
            : Platform.OS === 'android'
              ? { lineHeight: 22 }
              : {
                  paddingTop: 0,
                  paddingBottom: 2,
                  transform: [{ translateY: -1 }],
                }),
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
            backgroundColor: colors.surface,
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
