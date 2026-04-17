import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getShadow, type ShadowLevel } from '@/components/ui/shadow';

type CardTone = 'surface' | 'soft';

export type CardProps = ViewProps & {
  tone?: CardTone;
  shadow?: ShadowLevel;
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ tone = 'surface', shadow = 'md', outlined = false, style, ...props }: CardProps) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: tone === 'surface' ? colors.bgLight : colors.bgLight,
          borderColor: tone === 'surface' ? colors.borderMuted : colors.border,
          borderWidth: outlined ? 1 : 0,
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
