import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

type IconButtonVariant = 'surface' | 'ghost' | 'accent';
type IconButtonSize = 'md' | 'lg';

export type IconButtonProps = Omit<PressableProps, 'style'> & {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  active?: boolean;
};

export function IconButton({
  icon,
  variant = 'surface',
  size = 'md',
  loading = false,
  disabled = false,
  active = false,
  ...props
}: IconButtonProps) {
  const {
    theme: { colors, opacity, radius, shadows, sizes },
  } = useAppTheme();

  const isDisabled = disabled || loading;
  const dimension = size === 'lg' ? sizes.iconButton.lg : sizes.iconButton.md;

  const variantStyle =
    variant === 'accent'
      ? {
          backgroundColor: colors.primarySoft,
          shadow: shadows.sm,
        }
      : variant === 'ghost'
      ? {
          backgroundColor: colors.transparent,
          shadow: shadows.none,
        }
      : {
          backgroundColor: active ? colors.primarySoft : colors.surface,
          shadow: shadows.sm,
        };

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed, hovered }) =>
        [
          {
            width: dimension,
            height: dimension,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: variantStyle.backgroundColor,
            opacity: isDisabled ? opacity.disabled : pressed ? opacity.pressed : hovered ? opacity.hover : 1,
          } satisfies ViewStyle,
          variantStyle.shadow,
        ].filter(Boolean)
      }
      {...props}>
      {loading ? <ActivityIndicator color={colors.primary} /> : icon}
    </Pressable>
  );
}
