import { Tabs } from 'expo-router';

import { TripFadeOverlays, TripHeader, TripTabBar } from '@/components/layout';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function TripLayout() {
  const {
    theme: { colors },
  } = useAppTheme();

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
      </Tabs>
      <TripFadeOverlays />
    </>
  );
}
