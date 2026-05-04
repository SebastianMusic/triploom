import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const {
    theme: { spacing },
  } = useAppTheme();

  return (
    <Card style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
      <Stack space="xs" style={{ alignItems: 'center' }}>
        <AppText variant="subtitle" style={{ textAlign: 'center' }}>
          {title}
        </AppText>
        {description ? (
          <AppText tone="muted" style={{ textAlign: 'center' }}>
            {description}
          </AppText>
        ) : null}
        {action ? <View style={{ marginTop: spacing.xs }}>{action}</View> : null}
      </Stack>
    </Card>
  );
}
