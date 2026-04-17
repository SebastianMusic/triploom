import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

type CardVariant = 'default' | 'elevated' | 'interactive';

export type CardProps = PressableProps & {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
};

export function Card({ variant = 'default', disabled, style, children, ...props }: CardProps) {
  const {
    theme: { colors, opacity, radius, shadows, spacing, stroke },
  } = useAppTheme();

  const baseStyle: ViewStyle = {
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: stroke.thin,
    borderColor: colors.border,
  };

  const shadowStyle = variant === 'elevated' || variant === 'interactive' ? shadows.sm : shadows.none;

  const interactiveStyle = variant === 'interactive';

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed, hovered }) => [
        baseStyle,
        shadowStyle,
        interactiveStyle
          ? {
              opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : hovered ? opacity.hover : 1,
              transform: [{ scale: pressed ? 0.995 : 1 }],
            }
          : undefined,
        style,
      ]}
      {...props}>
      {children}
    </Pressable>
  );
}
