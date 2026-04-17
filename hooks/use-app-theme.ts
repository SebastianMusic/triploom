import { useMemo } from 'react';

import { getTheme, type AppTheme, type ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useResolvedTheme(modeOverride?: ThemeMode): AppTheme {
  const scheme = useColorScheme();
  const mode: ThemeMode = modeOverride ?? (scheme === 'dark' ? 'dark' : 'light');

  return useMemo(() => getTheme(mode), [mode]);
}
