import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

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
          backgroundColor: colors.surface,
        },
        style,
      ]}
    />
  );
}
