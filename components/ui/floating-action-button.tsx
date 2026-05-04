import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

export type FloatingActionButtonProps = Omit<PressableProps, 'style'> & {
  icon: ReactNode;
  position?: 'bottomRight' | 'inline';
  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({
  icon,
  position = 'bottomRight',
  disabled = false,
  style,
  ...props
}: FloatingActionButtonProps) {
  const {
    theme: { colors, opacity, radius, shadows, sizes, spacing },
  } = useAppTheme();

  const positionStyle: ViewStyle =
    position === 'bottomRight'
      ? {
          position: 'absolute',
          right: spacing.md,
          bottom: spacing.lg,
        }
      : {};

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed, hovered }) => [
        {
          width: sizes.button.lg,
          height: sizes.button.lg,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : hovered ? opacity.hover : 1,
        },
        shadows.md,
        positionStyle,
        style,
      ]}
      {...props}>
      {icon}
    </Pressable>
  );
}
