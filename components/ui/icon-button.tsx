import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { getShadow } from '@/components/ui/shadow';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconButtonTone = 'surface' | 'soft' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg';

export type IconButtonProps = PressableProps & {
  icon: ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
};

export function IconButton({ icon, tone = 'surface', size = 'md', ...props }: IconButtonProps) {
  const {
    theme: { colors, spacing, radius },
  } = useAppTheme();

  const buttonSize =
    size === 'sm' ? spacing.l - spacing.xs : size === 'lg' ? spacing.l + spacing.s / 2 : spacing.l;

  const toneStyles =
    tone === 'soft'
      ? {
          backgroundColor: colors.surfaceMuted,
          borderWidth: 0,
        }
      : tone === 'ghost'
        ? {
            backgroundColor: 'transparent',
            borderWidth: 0,
          }
        : {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderMuted,
          };

  return (
    <Pressable
      style={({ pressed }) => [
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: toneStyles.backgroundColor,
          borderWidth: toneStyles.borderWidth,
          borderColor: toneStyles.borderColor,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        tone === 'ghost' ? undefined : getShadow('sm', colors.shadow),
      ]}
      {...props}>
      {icon}
    </Pressable>
  );
}
