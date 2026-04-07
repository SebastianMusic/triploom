import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// TODO: Add auth guard logic here
const IS_AUTHENTICATED = false;

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}