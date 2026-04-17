import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export type ListItemProps = Omit<PressableProps, 'style'> & {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ListItem({ title, subtitle, leading, trailing, disabled, ...props }: ListItemProps) {
  const {
    theme: { colors, opacity, radius, sizes, spacing },
  } = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed, hovered }) => ({
        minHeight: sizes.listItem.minHeight,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm - spacing.xs / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        opacity: disabled ? opacity.disabled : pressed ? opacity.pressed : hovered ? opacity.hover : 1,
      })}
      {...props}>
      {leading}
      <View style={{ flex: 1, gap: spacing.xs / 2 }}>
        <AppText>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}
