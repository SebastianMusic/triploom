import { create } from 'zustand';

interface HomeState {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

export const useHomeStore = create<HomeState>()(() => ({
  isLoading: false,
  setLoading: () => {},
}));
