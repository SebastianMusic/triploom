import { create } from 'zustand';

type TripChromeState = {
  isNavigationHidden: boolean;
  setNavigationHidden: (isNavigationHidden: boolean) => void;
};

export const useTripChromeStore = create<TripChromeState>()((set) => ({
  isNavigationHidden: false,
  setNavigationHidden: (isNavigationHidden) => set({ isNavigationHidden }),
}));
