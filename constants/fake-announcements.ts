import { AppImages } from '@/assets/images';
import type { ImageSourcePropType } from 'react-native';

export type FakeAnnouncement = {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'warning' | 'success';
  dateLabel: string;
  image: ImageSourcePropType;
};

export const fakeAnnouncements: FakeAnnouncement[] = [
  {
    id: 'a1',
    title: 'Flight Window Updated',
    message: 'Check-in opens at 07:10. Meet in the lobby 06:30 sharp.',
    category: 'info',
    dateLabel: 'Today 06:30',
    image: AppImages.announcementPlaceholder,
  },
  {
    id: 'a2',
    title: 'Museum Tickets Confirmed',
    message: 'All participants are confirmed. QR passes are shared in chat.',
    category: 'success',
    dateLabel: 'Tomorrow 10:15',
    image: AppImages.announcementPlaceholder,
  },
  {
    id: 'a3',
    title: 'Weather Alert',
    message: 'Heavy rain expected in the evening. Bring a jacket.',
    category: 'warning',
    dateLabel: 'Friday 18:00',
    image: AppImages.announcementPlaceholder,
  },
];
