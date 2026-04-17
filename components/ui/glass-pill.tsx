import { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { getShadow } from '@/components/ui/shadow';

type GlassPillPosition = 'top' | 'bottom';

export type GlassPillProps = {
  position?: GlassPillPosition;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function GlassPill({ position = 'bottom', children, style }: GlassPillProps) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  const edgeHeight = spacing.s;
  const edgeAnchor = position === 'top' ? { bottom: 0 } : { top: 0 };

  return (
    <View
      style={[
        {
          overflow: 'hidden',
          borderRadius: radius.full,
          backgroundColor: colors.bgLight,
        },
        getShadow('md', colors.bgDark),
        style,
      ]}>
      <View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
          {
            backgroundColor: colors.glassTint,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: edgeHeight,
            backgroundColor: colors.glassEdge,
          },
          edgeAnchor,
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: edgeHeight / 2,
            backgroundColor: colors.glassEdgeSoft,
          },
          position === 'top' ? { bottom: edgeHeight } : { top: edgeHeight },
        ]}
      />
      {children}
    </View>
  );
}
