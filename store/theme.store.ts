import { create } from 'zustand';
import type { ThemeMode } from '@/constants/theme';

type ThemeState = {
  modeOverride: ThemeMode | null;
  setModeOverride: (mode: ThemeMode | null) => void;
  toggleMode: () => void;
};

export const useThemeStore = create<ThemeState>()((set, get) => ({
  modeOverride: null,
  setModeOverride: (modeOverride) => set({ modeOverride }),
  toggleMode: () => {
    const current = get().modeOverride;
    set({ modeOverride: current === 'dark' ? 'light' : 'dark' });
  },
}));
