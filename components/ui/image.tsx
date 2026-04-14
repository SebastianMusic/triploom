import { Image, type ImageSourcePropType } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export type ThemedImageProps = {
  source: ImageSourcePropType;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function ThemedImage({ source, height = 160, style }: ThemedImageProps) {
  const {
    theme: { radius, colors },
  } = useAppTheme();

  return (
    <Image
      source={source}
      resizeMode="cover"
      style={[
        {
          width: '100%',
          height,
          borderRadius: radius.m,
          backgroundColor: colors.bgLight,
        },
        style,
      ]}
    />
  );
}
