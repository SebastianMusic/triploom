import { ActivityIndicator, Pressable, View, type PressableProps, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const {
    theme: { colors, opacity, radius, shadows, sizes, spacing, typography },
  } = useAppTheme();

  const isDisabled = disabled || loading;

  const sizeStyle =
    size === 'sm'
      ? {
          minHeight: sizes.button.sm,
          paddingHorizontal: spacing.md - spacing.xs,
        }
      : size === 'lg'
        ? {
            minHeight: sizes.button.lg,
            paddingHorizontal: spacing.lg,
          }
        : {
            minHeight: sizes.button.md,
            paddingHorizontal: spacing.md,
          };

  const variantStyle =
    variant === 'destructive'
      ? {
          backgroundColor: colors.error,
          textColor: colors.textOnPrimary,
          shadow: shadows.sm,
        }
      : variant === 'secondary'
      ? {
          backgroundColor: colors.secondarySoft,
          textColor: colors.secondary,
          shadow: shadows.none,
        }
      : variant === 'ghost'
        ? {
          backgroundColor: colors.transparent,
          textColor: colors.primary,
          shadow: shadows.none,
        }
        : {
            backgroundColor: colors.primary,
            textColor: colors.textOnPrimary,
            shadow: shadows.sm,
          };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed, hovered }) =>
        [
          {
            minWidth: fullWidth ? undefined : sizes.button.md * 2,
            width: fullWidth ? '100%' : undefined,
            borderRadius: radius.full,
            backgroundColor: variantStyle.backgroundColor,
            paddingVertical: spacing.sm - spacing.xs / 2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isDisabled ? opacity.disabled : pressed ? opacity.pressed : hovered ? opacity.hover : 1,
          } satisfies ViewStyle,
          sizeStyle,
          variantStyle.shadow,
        ].filter(Boolean)
      }
      {...props}>
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AppText
            style={[
              typography.label,
              {
                color: variantStyle.textColor,
              },
            ]}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
