import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { useAppTheme } from '@/components/ui/theme-provider';

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) return hexColor;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type TripFadeOverlaysProps = {
  top?: boolean;
  bottom?: boolean;
};

export function TripFadeOverlays({ top = true, bottom = true }: TripFadeOverlaysProps) {
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const { safeAreaInsets } = useTripChromeInsets();

  const fadeHeight = spacing.xxxl + spacing.lg;
  const topFadeHeight = safeAreaInsets.top + spacing.xxxl;
  const bottomFadeHeight = safeAreaInsets.bottom + fadeHeight;
  const transparentBackground = withAlpha(colors.background, 0);

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 14,
      }}>
      {top ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            colors.background,
            withAlpha(colors.background, 0.99),
            withAlpha(colors.background, 0.96),
            withAlpha(colors.background, 0.86),
            withAlpha(colors.background, 0.62),
            withAlpha(colors.background, 0.28),
            transparentBackground,
          ]}
          locations={[0, 0.18, 0.34, 0.5, 0.66, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: topFadeHeight,
          }}
        />
      ) : null}

      {bottom ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            transparentBackground,
            withAlpha(colors.background, 0.28),
            withAlpha(colors.background, 0.62),
            withAlpha(colors.background, 0.86),
            withAlpha(colors.background, 0.96),
            withAlpha(colors.background, 0.99),
            colors.background,
          ]}
          locations={[0, 0.18, 0.34, 0.5, 0.66, 0.82, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            left: 0,
            height: bottomFadeHeight,
          }}
        />
      ) : null}
    </View>
  );
}
