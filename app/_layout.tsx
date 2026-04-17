import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';

export default function RootLayout() {
	const { session, isLoading, initialize } = useAuthStore();
	const { mode, theme } = useAppTheme();
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular: require('../assets/fonts/PlusJakartaSans_400Regular.ttf'),
		PlusJakartaSans_500Medium: require('../assets/fonts/PlusJakartaSans_500Medium.ttf'),
		PlusJakartaSans_600SemiBold: require('../assets/fonts/PlusJakartaSans_600SemiBold.ttf'),
		PlusJakartaSans_700Bold: require('../assets/fonts/PlusJakartaSans_700Bold.ttf'),
	});

	useEffect(() => {
		initialize();
	}, []);

	if (isLoading || !fontsLoaded) {
		return <Text>Loading...</Text>;
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
			<StatusBar style={mode === 'dark' ? 'light' : 'dark'} backgroundColor={theme.colors.bg} />
		</>
	);
}
