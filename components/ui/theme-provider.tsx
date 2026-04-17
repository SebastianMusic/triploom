import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { AppTheme, ThemeMode } from '@/constants/theme';
import { useResolvedTheme } from '@/hooks/use-app-theme';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
  modeOverride?: ThemeMode;
};

export function ThemeProvider({ children, modeOverride }: ThemeProviderProps) {
  const theme = useResolvedTheme(modeOverride);

  const value = useMemo(
    () => ({
      mode: theme.mode,
      theme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider.');
  }

  return context;
}
