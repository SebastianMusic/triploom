import { useEffect, useMemo, useState } from 'react';
import { Image, View, type ImageSourcePropType, type ImageURISource } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = {
  name?: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
  borderRadius?: number;
};

function getInitials(name?: string) {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export function Avatar({ name, source, size = 'md', borderRadius: borderRadiusProp }: AvatarProps) {
  const {
    theme: { colors, radius, sizes, typography },
  } = useAppTheme();

  const dimension = sizes.avatar[size];
  const sourceKey = useMemo(() => {
    if (!source) return '';
    if (typeof source === 'number') return String(source);
    if (Array.isArray(source)) {
      return source.map((item) => (typeof item === 'number' ? item : item.uri ?? '')).join('|');
    }
    return (source as ImageURISource).uri ?? '';
  }, [source]);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [sourceKey]);

  if (source && !hasImageError) {
    return (
      <Image
        source={source}
        onError={() => setHasImageError(true)}
        style={{
          width: dimension,
          height: dimension,
          borderRadius: borderRadiusProp ?? radius.full,
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
        borderRadius: borderRadiusProp ?? radius.full,
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
