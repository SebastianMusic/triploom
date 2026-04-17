import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/hooks/use-app-theme';

type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'highlight' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const {
    mode,
    theme: { colors, spacing, radius },
  } = useAppTheme();

  const toneStyles =
    tone === 'primary'
      ? {
          backgroundColor: mode === 'dark' ? colors.surfaceMuted : colors.primarySoft,
          textColor: mode === 'dark' ? colors.text : colors.primary,
        }
      : tone === 'secondary'
        ? { backgroundColor: colors.secondarySoft, textColor: colors.text }
        : tone === 'highlight'
          ? { backgroundColor: colors.highlightSoft, textColor: colors.text }
          : tone === 'success'
            ? { backgroundColor: colors.successSoft, textColor: colors.success }
            : tone === 'warning'
              ? { backgroundColor: colors.warningSoft, textColor: colors.warning }
              : tone === 'danger'
                ? { backgroundColor: colors.dangerSoft, textColor: colors.danger }
                : tone === 'info'
                  ? { backgroundColor: colors.infoSoft, textColor: colors.info }
                  : { backgroundColor: colors.surfaceMuted, textColor: colors.textMuted };

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: toneStyles.backgroundColor,
          paddingHorizontal: spacing.s + 2,
          paddingVertical: spacing.xs / 2,
          borderRadius: radius.full,
        },
        style,
      ]}>
      <AppText variant="caption" style={{ color: toneStyles.textColor }}>
        {label}
      </AppText>
    </View>
  );
}
