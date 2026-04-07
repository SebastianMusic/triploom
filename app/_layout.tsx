import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const IS_AUTHENTICATED = true;

export default function RootLayout() {
	return (
		<>
			<Stack>
				<Stack.Protected guard={IS_AUTHENTICATED}>
					<Stack.Screen name="(app)" options={{ headerShown: false }} />
				</Stack.Protected>
				<Stack.Protected guard={!IS_AUTHENTICATED}>
					<Stack.Screen name="(auth)" options={{ headerShown: false }} />
				</Stack.Protected>
			</Stack>
			<StatusBar style="auto" />
		</>
	);
}
