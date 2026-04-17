import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/components/ui/theme-provider';

export type ContainerProps = ViewProps & {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Container({ padded = true, style, ...props }: ContainerProps) {
  const {
    theme: { layout },
  } = useAppTheme();

  return (
    <View
      style={[
        {
          paddingHorizontal: padded ? layout.screenPadding : 0,
        },
        style,
      ]}
      {...props}
    />
  );
}
