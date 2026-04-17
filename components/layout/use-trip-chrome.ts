import { useMemo } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/components/ui/theme-provider';

export function useTripChromeInsets() {
  const safeAreaInsets = useSafeAreaInsets();
  const {
    theme: { layout, sizes, spacing },
  } = useAppTheme();

  return useMemo(() => {
    const headerContentOffset =
      safeAreaInsets.top + spacing.xs + sizes.iconButton.md + layout.headerPaddingBottom + spacing.sm;
    const bottomOverlayOffset = sizes.navigation.barHeight + Math.max(safeAreaInsets.bottom, spacing.sm) + spacing.lg;

    return {
      safeAreaInsets,
      headerContentOffset,
      bottomOverlayOffset,
    };
  }, [layout.headerPaddingBottom, safeAreaInsets, sizes.iconButton.md, sizes.navigation.barHeight, spacing.lg, spacing.sm, spacing.xs]);
}
