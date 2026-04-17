import { View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { AppText } from '@/components/ui/text';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  eyebrow?: string;
};

export function Header({ title, subtitle, badge, eyebrow }: HeaderProps) {
  const {
    theme: { colors, spacing, radius },
  } = useAppTheme();

  return (
    <View style={{ gap: spacing.m }}>
      {eyebrow ? <AppText variant="caption" tone="secondary">{eyebrow}</AppText> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.m }}>
        <AppText variant="title">{title}</AppText>
        {badge ? (
          <View
            style={{
              backgroundColor: colors.highlight,
              paddingHorizontal: spacing.m,
              paddingVertical: spacing.s,
              borderRadius: radius.full,
            }}>
            <AppText variant="caption">{badge}</AppText>
          </View>
        ) : null}
      </View>
      {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
    </View>
  );
}
