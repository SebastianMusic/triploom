import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ThemeColorPreset } from '@/constants/theme';

export type ThemePreference = 'native' | 'light' | 'dark';

type ThemeState = {
  preference: ThemePreference;
  colorPreset: ThemeColorPreset;
  setPreference: (preference: ThemePreference) => void;
  setColorPreset: (colorPreset: ThemeColorPreset) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'native',
      colorPreset: 'ocean',
      setPreference: (preference) => set({ preference }),
      setColorPreset: (colorPreset) => set({ colorPreset }),
    }),
    {
      name: 'triploom-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preference: state.preference,
        colorPreset: state.colorPreset,
      }),
    },
  ),
);
