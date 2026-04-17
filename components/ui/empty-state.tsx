import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type EmptyStateProps = {
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  const {
    theme: { spacing },
  } = useAppTheme();

  return (
    <Card tone="soft" shadow="sm">
      <View style={{ gap: spacing.s }}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText tone="muted">{subtitle}</AppText>
        {action ? <View style={{ paddingTop: spacing.xs }}>{action}</View> : null}
      </View>
    </Card>
  );
}
