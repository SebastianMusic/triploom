import type { ReactNode } from 'react';

import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import {
  getProfileBadgeRingPalette,
  type ProfileBadgeLevel,
} from '@/constants/profile-badges';
import { useAppTheme } from '@/components/ui/theme-provider';

type ProfileBadgeFrameProps = {
  level: ProfileBadgeLevel;
  size: number;
  children: ReactNode;
};

function getRingMetrics(size: number) {
  if (size >= 100) {
    return { outer: 5, inner: 2, core: 1 };
  }

  if (size >= 64) {
    return { outer: 4, inner: 2, core: 1 };
  }

  if (size >= 48) {
    return { outer: 3, inner: 2, core: 1 };
  }

  return { outer: 2, inner: 1, core: 1 };
}

export function ProfileBadgeFrame({ level, size, children }: ProfileBadgeFrameProps) {
  const {
    theme: { radius },
  } = useAppTheme();
  const palette = getProfileBadgeRingPalette(level);
  const metrics = getRingMetrics(size);
  const frameSize = size + (metrics.outer + metrics.inner + metrics.core) * 2;

  return (
    <View
      style={{
        width: frameSize,
        height: frameSize,
        borderRadius: radius.full,
        shadowColor: palette.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}>
      <LinearGradient
        colors={palette.outer}
        start={{ x: 0.18, y: 0.06 }}
        end={{ x: 0.84, y: 0.96 }}
        style={{
          flex: 1,
          borderRadius: radius.full,
          padding: metrics.outer,
        }}>
        <LinearGradient
          colors={palette.inner}
          start={{ x: 0.18, y: 0.04 }}
          end={{ x: 0.84, y: 0.92 }}
          style={{
            flex: 1,
            borderRadius: radius.full,
            padding: metrics.inner,
          }}>
          <View
            style={{
              flex: 1,
              borderRadius: radius.full,
              padding: metrics.core,
              backgroundColor: palette.core,
            }}>
            <View
              style={{
                flex: 1,
                borderRadius: radius.full,
                overflow: 'hidden',
              }}>
              {children}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 1,
                  left: '20%',
                  right: '20%',
                  height: Math.max(4, Math.round(size * 0.1)),
                  borderRadius: radius.full,
                  backgroundColor: palette.highlight,
                }}
              />
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );
}
