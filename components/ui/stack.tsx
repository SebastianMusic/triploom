import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

type SpaceToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | number;

function resolveSpace(spaceValue: SpaceToken, themeSpacing: Record<Exclude<SpaceToken, number>, number>) {
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
