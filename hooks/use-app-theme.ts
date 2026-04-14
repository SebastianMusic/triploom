import { getTheme, type ThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/store/theme.store';

export function useAppTheme() {
  const scheme = useColorScheme();
  const modeOverride = useThemeStore((state) => state.modeOverride);
  const mode: ThemeMode = modeOverride ?? (scheme === 'dark' ? 'dark' : 'light');

  return {
    mode,
    theme: getTheme(mode),
  };
}
