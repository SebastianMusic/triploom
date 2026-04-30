import { LinearGradient } from 'expo-linear-gradient';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { useAppTheme } from '@/components/ui/theme-provider';

export function TripFadeOverlays() {
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const { safeAreaInsets } = useTripChromeInsets();

  const fadeHeight = spacing.xxxl + spacing.lg;
  const topFadeHeight = safeAreaInsets.top + spacing.xxl;
  const bottomFadeHeight = safeAreaInsets.bottom + fadeHeight;

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, colors.background, colors.transparent]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topFadeHeight,
          zIndex: 14,
        }}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[colors.transparent, colors.background, colors.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          height: bottomFadeHeight,
          zIndex: 14,
        }}
      />
    </>
  );
}
