import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';
import { spacing } from '@/constants/theme';

type SpaceToken = keyof typeof spacing | number;

function resolveSpace(spaceValue: SpaceToken, themeSpacing: typeof spacing) {
  return typeof spaceValue === 'number' ? spaceValue : themeSpacing[spaceValue];
}

export type StackProps = ViewProps & {
  space?: SpaceToken;
  style?: StyleProp<ViewStyle>;
};

export function Stack({ space = 'md', style, ...props }: StackProps) {
  const {
    theme: { spacing: themeSpacing },
  } = useAppTheme();

  return <View style={[{ gap: resolveSpace(space, themeSpacing) }, style]} {...props} />;
}
