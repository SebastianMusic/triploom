import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

export default function RootLayout() {
	const { session, isLoading } = useAuthStore();

	if (isLoading) {
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
