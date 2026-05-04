import { Stack, router, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';

import { ThemeProvider, useAppTheme } from '@/components/ui/theme-provider';
import { TripFadeOverlays } from '@/components/layout';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useChatStore } from '@/store/chat.store';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const incomingRoomId = notification.request.content.data?.group_chat_id as string | undefined;
    const activeRoomId = useChatStore.getState().activeChatRoomId;
    const suppress = !!incomingRoomId && incomingRoomId === activeRoomId;
    return {
      shouldShowBanner: !suppress,
      shouldShowList: !suppress,
      shouldPlaySound: !suppress,
      shouldSetBadge: false,
    };
  },
});

function RootNavigator() {
	const { session, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const { mode, theme } = useAppTheme();
  const isTripRoute = segments[0] === '(app)' && segments[1] === '(trip)';
  const [pendingCode, setPendingCode] = useState<string | null>(null);

	useEffect(() => {
		initialize();
	}, [initialize]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

	useEffect(() => {
		if (!isLoading && session && pendingCode) {
			router.push(`/(app)/invite?code=${encodeURIComponent(pendingCode)}`);
			setPendingCode(null);
		}
	}, [isLoading, session, pendingCode]);

	useEffect(() => {
		// Only needed for cold-start: Expo Router handles live deep links automatically
		// once the route exists. getInitialURL fires before auth is ready, so we
		// store the code and navigate once the session loads.
		Linking.getInitialURL().then((url) => {
			if (!url) return;
			const { hostname, queryParams } = Linking.parse(url);
			if (hostname === 'invite') {
				const code = queryParams?.code;
				if (typeof code === 'string') setPendingCode(code);
			}
		});
	}, []);

	if (isLoading) {
		return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>Loading...</Text>
      </View>
    );
	}

	return (
		<>
			<Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          gestureEnabled: true,
        }}>
				<Stack.Protected guard={!!session}>
					<Stack.Screen name="(app)" options={{ headerShown: false }} />
				</Stack.Protected>
				<Stack.Protected guard={!session}>
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				</Stack.Protected>
			</Stack>
      {!isTripRoute ? <TripFadeOverlays top bottom={false} /> : null}
			<StatusBar
        style={mode === 'dark' ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent
      />
		</>
	);
}

export default function RootLayout() {
  const themePreference = useThemeStore((state) => state.preference);
  const modeOverride = themePreference === 'native' ? undefined : themePreference;
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider modeOverride={modeOverride}>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
