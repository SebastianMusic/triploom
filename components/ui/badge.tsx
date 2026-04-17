import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type BadgeVariant = 'info' | 'success' | 'warning';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, variant = 'info', style }: BadgeProps) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  const palette =
    variant === 'success'
      ? { backgroundColor: colors.successSoft, textColor: colors.success }
      : variant === 'warning'
        ? { backgroundColor: colors.warningSoft, textColor: colors.warning }
        : { backgroundColor: colors.infoSoft, textColor: colors.info };

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          borderRadius: radius.full,
          backgroundColor: palette.backgroundColor,
          paddingHorizontal: spacing.xs + spacing.xs / 2,
          paddingVertical: spacing.xs / 2,
        },
        style,
      ]}>
      <AppText variant="caption" style={[typography.caption, { color: palette.textColor }]}>
        {label}
      </AppText>
    </View>
  );
}
