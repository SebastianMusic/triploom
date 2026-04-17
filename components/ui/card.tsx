import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getShadow, type ShadowLevel } from '@/components/ui/shadow';

type CardTone = 'surface' | 'soft';

export type CardProps = ViewProps & {
  tone?: CardTone;
  shadow?: ShadowLevel;
  outlined?: boolean;
  padding?: keyof ReturnType<typeof useAppTheme>['theme']['spacing'] | number;
  radiusSize?: keyof ReturnType<typeof useAppTheme>['theme']['radius'] | number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  tone = 'surface',
  shadow = 'md',
  outlined = false,
  padding = 'l',
  radiusSize = 'm',
  style,
  ...props
}: CardProps) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();
  const resolvedPadding = typeof padding === 'number' ? padding : spacing[padding];
  const resolvedRadius = typeof radiusSize === 'number' ? radiusSize : radius[radiusSize];

  return (
    <View
      style={[
        {
          backgroundColor: tone === 'surface' ? colors.surface : colors.surfaceMuted,
          borderColor: tone === 'surface' ? colors.borderMuted : colors.border,
          borderWidth: outlined ? 1 : 0,
          borderRadius: resolvedRadius,
          padding: resolvedPadding,
        },
        getShadow(shadow, colors.shadow),
        style,
      ]}
      {...props}
    />
  );
}
