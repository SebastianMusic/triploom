import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';
import { spacing } from '@/constants/theme';

type GapToken = keyof typeof spacing | number;

function resolveGap(gapValue: GapToken, themeSpacing: typeof spacing) {
  return typeof gapValue === 'number' ? gapValue : themeSpacing[gapValue];
}

export type RowProps = ViewProps & {
  gap?: GapToken;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
};

export function Row({
  gap = 'sm',
  align = 'center',
  justify = 'flex-start',
  style,
  ...props
}: RowProps) {
  const {
    theme: { spacing: themeSpacing },
  } = useAppTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap: resolveGap(gap, themeSpacing),
        },
        style,
      ]}
      {...props}
    />
  );
}
