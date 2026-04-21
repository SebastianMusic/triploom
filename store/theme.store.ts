import { create } from 'zustand';

export type ThemePreference = 'native' | 'light' | 'dark';

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>()((set) => ({
  preference: 'native',
  setPreference: (preference) => set({ preference }),
}));
