import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type SectionProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Section({ title, subtitle, action, children, style, contentStyle }: SectionProps) {
  const {
    theme: { spacing },
  } = useAppTheme();

  return (
    <View style={[{ gap: spacing.s }, style]}>
      {title || subtitle || action ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.m }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            {title ? <AppText variant="subtitle">{title}</AppText> : null}
            {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
          </View>
          {action}
        </View>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
