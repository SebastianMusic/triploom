import { Pressable, type PressableProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AppText } from '@/components/ui/text';
import { getShadow } from '@/components/ui/shadow';

type ButtonTone = 'primary' | 'secondary';

export type ButtonProps = PressableProps & {
  label: string;
  tone?: ButtonTone;
};

export function Button({ label, tone = 'primary', ...props }: ButtonProps) {
  const {
    theme: { colors, spacing, radius },
  } = useAppTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: tone === 'primary' ? colors.primary : colors.secondary,
          paddingVertical: spacing.s + 2,
          paddingHorizontal: spacing.m,
          borderRadius: radius.full,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        getShadow('sm', colors.shadow),
      ]}
      {...props}>
      <AppText variant="caption" style={{ color: colors.bgDark, fontWeight: '700' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
