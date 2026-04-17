import { LinearGradient } from 'expo-linear-gradient';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { useAppTheme } from '@/components/ui/theme-provider';

export function TripFadeOverlays() {
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const { safeAreaInsets } = useTripChromeInsets();

  const fadeHeight = spacing.xxxl + spacing.lg;

  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, colors.background]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: safeAreaInsets.top,
          zIndex: 14,
        }}
      />

      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, colors.transparent]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          height: fadeHeight,
          zIndex: 14,
        }}
      />
    </>
  );
}
