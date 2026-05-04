import { View } from 'react-native';

import { Row } from '@/components/ui/row';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  count?: number;
};

export function SectionHeader({ title, subtitle, count }: SectionHeaderProps) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  return (
    <View style={{ gap: spacing.xs / 2 }}>
      <Row justify="space-between" align="center" gap="sm">
        <AppText variant="subtitle">{title}</AppText>
        {typeof count === 'number' ? (
          <View
            style={{
              minWidth: 28,
              paddingHorizontal: spacing.xs,
              paddingVertical: 2,
              borderRadius: radius.full,
              backgroundColor: colors.secondarySoft,
              alignItems: 'center',
            }}>
            <AppText variant="caption" tone="muted">
              {count}
            </AppText>
          </View>
        ) : null}
      </Row>
      {subtitle ? (
        <AppText variant="caption" tone="muted">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
