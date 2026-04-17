import { Image, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = {
  name?: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
};

function getInitials(name?: string) {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, source, size = 'md' }: AvatarProps) {
  const {
    theme: { colors, radius, sizes, typography },
  } = useAppTheme();

  const dimension = sizes.avatar[size];

  if (source) {
    return (
      <Image
        source={source}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceMuted,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft,
      }}>
      <AppText
        variant="caption"
        style={[
          typography.label,
          {
            color: colors.primary,
          },
        ]}>
        {getInitials(name)}
      </AppText>
    </View>
  );
}
