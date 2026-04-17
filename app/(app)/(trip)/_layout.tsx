import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { getTripById } from '@/services/trip.service';

import { TripFadeOverlays, TripHeader, TripTabBar } from '@/components/layout';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function TripLayout() {
  const {
    theme: { colors },
  } = useAppTheme();
  const selectedTrip = useProfileStore((s) => s.selectedTrip);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);

  useEffect(() => {
    if (!selectedTrip) {
      setCurrentTrip(null);
      return;
    }
    getTripById(selectedTrip).then(setCurrentTrip).catch(() => setCurrentTrip(null));
  }, [selectedTrip]);

  return (
    <>
      <Tabs
        tabBar={(props) => <TripTabBar {...props} />}
        screenOptions={({ route }) => ({
          header: () => <TripHeader routeName={route.name} />,
          headerTransparent: true,
          sceneStyle: {
            backgroundColor: colors.background,
          },
        })}>
        <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
        <Tabs.Screen name="events/index" options={{ title: 'Events' }} />
        <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
        <Tabs.Screen name="profile/index" options={{ title: 'Profile', href: null }} />
        <Tabs.Screen name="admin/index" options={{ title: 'Admin', href: null }} />
        <Tabs.Screen name="chat/[roomId]" options={{ href: null }} />
      </Tabs>
      <TripFadeOverlays />
    </>
  );
}
