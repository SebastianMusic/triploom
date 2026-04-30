import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';

import { ThemeProvider, useAppTheme } from '@/components/ui/theme-provider';
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
  const { mode, theme } = useAppTheme();

	useEffect(() => {
		initialize();
	}, [initialize]);

	useEffect(() => {
		function navigateToJoinWithCode(url: string) {
			const { hostname, path } = Linking.parse(url);
			if (hostname === 'join' && path) {
				router.push(`/(app)/(no-trip)/join?code=${encodeURIComponent(path)}`);
			}
		}

		Linking.getInitialURL().then((url) => {
			if (url) navigateToJoinWithCode(url);
		});

		const subscription = Linking.addEventListener('url', ({ url }) => {
			navigateToJoinWithCode(url);
		});

		return () => subscription.remove();
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
			<Stack>
				<Stack.Protected guard={!!session}>
					<Stack.Screen name="(app)" options={{ headerShown: false }} />
				</Stack.Protected>
				<Stack.Protected guard={!session}>
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				</Stack.Protected>
			</Stack>
			<StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
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
      <ThemeProvider modeOverride={modeOverride}>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
