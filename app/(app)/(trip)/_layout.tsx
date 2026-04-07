import { Tabs } from 'expo-router';

export default function TripLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="events/index" options={{ title: 'Events' }} />
      <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
