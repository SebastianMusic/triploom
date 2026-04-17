import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { useAppTheme } from '@/hooks/use-app-theme';
import { AppText } from '@/components/ui/text';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function Header({ title, subtitle, badge, eyebrow, action }: HeaderProps) {
  const {
    theme: { spacing },
  } = useAppTheme();

  return (
    <View style={{ gap: spacing.m }}>
      {eyebrow ? (
        <AppText variant="caption" tone="secondary">
          {eyebrow}
        </AppText>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.m }}>
        <View style={{ flex: 1, gap: spacing.s / 2 }}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.s / 2 }}>
          {badge ? <Badge label={badge} tone="highlight" /> : null}
          {action}
        </View>
      </View>
    </View>
  );
}
