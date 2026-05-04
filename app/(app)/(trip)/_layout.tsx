import { useEffect } from 'react';
import { Tabs, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { useChatStore } from '@/store/chat.store';
import { getTripById } from '@/services/trip.service';

import { TripFadeOverlays, TripHeader, TripTabBar } from '@/components/layout';
import { isPrimaryTripTab } from '@/components/layout/trip-navigation';
import { useAppTheme } from '@/components/ui/theme-provider';

function getActiveTripRouteName(segments: readonly string[]) {
  if (segments[0] !== '(app)' || segments[1] !== '(trip)') {
    return 'home/index';
  }

  const section = segments[2] ?? 'home';
  const leaf = segments[3];

  if (leaf && leaf !== 'index') {
    return `${section}/${leaf}`;
  }

  return `${section}/index`;
}

export default function TripLayout() {
  const segments = useSegments();
  const {
    theme: { colors },
  } = useAppTheme();
  const selectedTrip = useProfileStore((s) => s.selectedTrip);
  const setCurrentTrip = useTripStore((s) => s.setCurrentTrip);
  const routeName = getActiveTripRouteName(segments);
  const showBottomFade = isPrimaryTripTab(routeName);
  const { getAllChatRooms, resetChatState } = useChatStore();

  useEffect(() => {
    if (!selectedTrip) {
      setCurrentTrip(null);
      resetChatState();
      return;
    }
    getTripById(selectedTrip).then(setCurrentTrip).catch(() => setCurrentTrip(null));
    getAllChatRooms(selectedTrip).catch(() => {});
    return () => { resetChatState(); };
  }, [getAllChatRooms, resetChatState, selectedTrip, setCurrentTrip]);

  return (
    <>
      <Tabs
        tabBar={(props) => <TripTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: colors.background,
          },
        }}>
        <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
        <Tabs.Screen name="events/index" options={{ title: 'Events' }} />
        <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
        <Tabs.Screen name="chat/index" options={{ title: 'Chats' }} />
        <Tabs.Screen name="account/index" options={{ title: 'Profile', href: null }} />
        <Tabs.Screen name="admin/index" options={{ title: 'Admin', href: null }} />
        <Tabs.Screen name="admin/people" options={{ title: 'People & groups', href: null }} />
        <Tabs.Screen name="chat/[roomId]" options={{ href: null, headerShown: false }} />
      </Tabs>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}>
        <TripFadeOverlays top bottom={showBottomFade} />
        <TripHeader routeName={routeName} />
      </View>
    </>
  );
}
