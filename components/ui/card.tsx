import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getShadow, type ShadowLevel } from '@/components/ui/shadow';

type CardTone = 'surface' | 'soft';

export type CardProps = ViewProps & {
  tone?: CardTone;
  shadow?: ShadowLevel;
  style?: StyleProp<ViewStyle>;
};

export function Card({ tone = 'surface', shadow = 'md', style, ...props }: CardProps) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: tone === 'surface' ? colors.bgLight : colors.bgLight,
          borderColor: tone === 'surface' ? colors.borderMuted : colors.border,
          borderWidth: 1,
          borderRadius: radius.m,
          padding: spacing.l,
        },
        getShadow(shadow, colors.shadow),
        style,
      ]}
      {...props}
    />
  );
}
