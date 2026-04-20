import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

import { ThemeProvider, useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
	const { session, isLoading, initialize } = useAuthStore();
  const { mode, theme } = useAppTheme();

	useEffect(() => {
		initialize();
	}, [initialize]);

	useEffect(() => {
		function navigateToJoinWithCode(url: string) {
			const { path } = Linking.parse(url);
			if (path?.startsWith('join/')) {
				const code = path.replace('join/', '');
				router.push(`/(app)/(no-trip)/join?code=${code}`);
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
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
