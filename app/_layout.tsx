import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import {
	Nunito_400Regular,
	Nunito_500Medium,
	Nunito_600SemiBold,
	Nunito_700Bold,
} from '@expo-google-fonts/nunito';

export default function RootLayout() {
	const { session, isLoading, initialize } = useAuthStore();
	const [fontsLoaded] = useFonts({
		Nunito_400Regular,
		Nunito_500Medium,
		Nunito_600SemiBold,
		Nunito_700Bold,
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
			<StatusBar style="auto" />
		</>
	);
}
