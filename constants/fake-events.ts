export type FakeEvent = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  host: string;
  attendees: number;
  imageUrl: string;
};

export const fakeEvents: FakeEvent[] = [
  {
    id: 'ev-1',
    title: 'Sunrise Hike to Preikestolen',
    location: 'Stavanger, Norway',
    startsAt: 'Sat 07:00',
    host: 'Maja',
    attendees: 14,
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ev-2',
    title: 'Old Town Food Walk',
    location: 'Lisbon, Portugal',
    startsAt: 'Sun 12:30',
    host: 'Jonas',
    attendees: 9,
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ev-3',
    title: 'Kayak + Coastal Picnic',
    location: 'Split, Croatia',
    startsAt: 'Mon 10:00',
    host: 'Aisha',
    attendees: 11,
    imageUrl: 'https://images.unsplash.com/photo-1527333656061-ca7adf608ae1?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ev-4',
    title: 'Evening Rooftop Social',
    location: 'Barcelona, Spain',
    startsAt: 'Tue 19:00',
    host: 'Nora',
    attendees: 23,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80',
  },
];
