import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TripTabItem = {
  routeName: 'home/index' | 'events/index' | 'tasks/index' | 'chat/index' | 'admin/index';
  href: Href;
  label: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  adminOnly?: boolean;
};

export const TRIP_TAB_ITEMS: TripTabItem[] = [
  {
    routeName: 'home/index',
    href: '/(app)/(trip)/home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    routeName: 'events/index',
    href: '/(app)/(trip)/events',
    label: 'Events',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    routeName: 'tasks/index',
    href: '/(app)/(trip)/tasks',
    label: 'Tasks',
    icon: 'checkbox-outline',
    activeIcon: 'checkbox',
  },
  {
    routeName: 'chat/index',
    href: '/(app)/(trip)/chat',
    label: 'Chat',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
  },
  {
    routeName: 'admin/index',
    href: '/(app)/(trip)/admin',
    label: 'Admin',
    icon: 'settings-outline',
    activeIcon: 'settings',
    adminOnly: true,
  },
];

const TRIP_SCREEN_TITLES: Record<string, string> = {
  'home/index': 'Home',
  'events/index': 'Events',
  'tasks/index': 'Tasks',
  'chat/index': 'Chat',
  'profile/index': 'Profile',
  'admin/index': 'Admin',
};

export function getTripScreenTitle(routeName: string) {
  return TRIP_SCREEN_TITLES[routeName] ?? 'Trip';
}

export function isPrimaryTripTab(routeName: string) {
  return TRIP_TAB_ITEMS.some((item) => item.routeName === routeName);
}
