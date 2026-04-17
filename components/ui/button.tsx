import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AppText } from '@/components/ui/text';
import { getShadow } from '@/components/ui/shadow';

type ButtonTone = 'primary' | 'secondary' | 'surface' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = PressableProps & {
  label: string;
  tone?: ButtonTone;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Button({
  label,
  tone = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leading,
  trailing,
  disabled,
  ...props
}: ButtonProps) {
  const {
    mode,
    theme: { colors, spacing, radius },
  } = useAppTheme();
  const isDisabled = disabled || loading;
  const sizeStyles =
    size === 'sm'
      ? {
          minHeight: spacing.l,
          paddingHorizontal: spacing.m - spacing.xs,
          paddingVertical: spacing.s - 2,
        }
      : size === 'lg'
        ? {
            minHeight: spacing.xl - spacing.xs,
            paddingHorizontal: spacing.l,
            paddingVertical: spacing.s + spacing.xs,
          }
        : {
            minHeight: spacing.l + spacing.s,
            paddingHorizontal: spacing.m,
            paddingVertical: spacing.s + 2,
          };

  const toneStyles =
    tone === 'secondary'
      ? {
          backgroundColor: colors.secondary,
          borderWidth: 0,
          textColor: colors.text,
          shadowColor: colors.shadow,
        }
      : tone === 'surface'
        ? {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderMuted,
            textColor: colors.text,
            shadowColor: colors.shadow,
          }
        : tone === 'ghost'
          ? {
              backgroundColor: 'transparent',
              borderWidth: 0,
              textColor: colors.textMuted,
            }
          : tone === 'danger'
            ? {
                backgroundColor: colors.danger,
                borderWidth: 0,
                textColor: colors.textOnImage,
                shadowColor: colors.shadow,
              }
            : {
                backgroundColor: mode === 'dark' ? colors.surfaceMuted : colors.primary,
                borderWidth: 0,
                textColor: mode === 'dark' ? colors.text : colors.textOnImage,
                shadowColor: colors.shadow,
              };

  const shadowLevel = tone === 'ghost' ? 'none' : tone === 'surface' ? 'sm' : 'md';

  return (
    <Pressable
      style={({ pressed }) => [
        {
          width: fullWidth ? '100%' : undefined,
          minWidth: fullWidth ? undefined : spacing.xl * 1.6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          backgroundColor: toneStyles.backgroundColor,
          borderColor: toneStyles.borderColor,
          borderWidth: toneStyles.borderWidth,
          borderRadius: radius.full,
          opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.985 : 1 }],
        },
        sizeStyles,
        getShadow(shadowLevel, toneStyles.shadowColor ?? colors.shadow),
      ]}
      disabled={isDisabled}
      {...props}>
      {loading ? (
        <ActivityIndicator color={toneStyles.textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
          {leading}
          <AppText variant="label" style={{ color: toneStyles.textColor }}>
            {label}
          </AppText>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}
