import { create } from 'zustand';

type HeaderAction = {
  key: string;
  accessibilityLabel: string;
  iconName?: string;
  onPress: () => void;
};

type TripHeaderActionsState = {
  action: HeaderAction | null;
  actions: HeaderAction[];
  setAction: (action: HeaderAction | null) => void;
  setActions: (actions: HeaderAction[]) => void;
};

export const useTripHeaderActionsStore = create<TripHeaderActionsState>()((set) => ({
  action: null,
  actions: [],
  setAction: (action) => set({ action, actions: action ? [action] : [] }),
  setActions: (actions) => set({ actions, action: actions[0] ?? null }),
}));
