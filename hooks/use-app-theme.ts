import { useMemo } from 'react';

import { getTheme, type AppTheme, type ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/theme.store';

export function useResolvedTheme(modeOverride?: ThemeMode): AppTheme {
  const scheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const colorPreset = useThemeStore((state) => state.colorPreset);
  const mode: ThemeMode =
    modeOverride ?? (preference === 'native' ? (scheme === 'dark' ? 'dark' : 'light') : preference);

  return useMemo(() => getTheme(mode, colorPreset), [colorPreset, mode]);
}
