import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';
import type { ThemeMode } from '@/constants/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileBadgeLevel = 'iron' | 'bronze' | 'silver' | 'gold' | 'diamond';

export type ProfileBadge = {
  level: ProfileBadgeLevel;
  title: string;
  icon: IoniconName;
  startAt: number;
  nextAt: number | null;
  range: string;
};

export type ProfileBadgePalette = {
  background: string;
  text: string;
  soft: string;
};

const badgePalettes: Record<ThemeMode, Record<ProfileBadgeLevel, ProfileBadgePalette>> = {
  light: {
    iron: {
      background: '#6F7784',
      text: '#FFFFFF',
      soft: '#E7EBEF',
    },
    bronze: {
      background: '#B87945',
      text: '#FFFFFF',
      soft: '#F4E5D8',
    },
    silver: {
      background: '#8C99A8',
      text: '#FFFFFF',
      soft: '#E8EDF2',
    },
    gold: {
      background: '#C9A227',
      text: '#14202B',
      soft: '#F7EDC6',
    },
    diamond: {
      background: '#57BFD0',
      text: '#082B34',
      soft: '#DDF5F8',
    },
  },
  dark: {
    iron: {
      background: '#7E8794',
      text: '#F5F7FB',
      soft: '#1B2530',
    },
    bronze: {
      background: '#C1844D',
      text: '#101926',
      soft: '#2A1D15',
    },
    silver: {
      background: '#B8C2CF',
      text: '#101926',
      soft: '#1D2630',
    },
    gold: {
      background: '#E1BE45',
      text: '#171208',
      soft: '#2C2411',
    },
    diamond: {
      background: '#79D7E7',
      text: '#061E25',
      soft: '#102B34',
    },
  },
};

export function getProfileBadge(tripCount: number): ProfileBadge {
  if (tripCount >= 25) {
    return { level: 'diamond', title: 'Diamond', icon: 'diamond', startAt: 25, nextAt: null, range: '25+ trips' };
  }

  if (tripCount >= 15) {
    return { level: 'gold', title: 'Gold', icon: 'trophy', startAt: 15, nextAt: 25, range: '15-24 trips' };
  }

  if (tripCount >= 10) {
    return { level: 'silver', title: 'Silver', icon: 'medal', startAt: 10, nextAt: 15, range: '10-14 trips' };
  }

  if (tripCount >= 5) {
    return { level: 'bronze', title: 'Bronze', icon: 'ribbon', startAt: 5, nextAt: 10, range: '5-9 trips' };
  }

  return { level: 'iron', title: 'Iron', icon: 'shield', startAt: 0, nextAt: 5, range: '0-4 trips' };
}

export function getProfileBadgePalette(mode: ThemeMode, level: ProfileBadgeLevel) {
  return badgePalettes[mode][level];
}
