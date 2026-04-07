import { Stack } from 'expo-router';

const HAS_SELECTED_TRIP = true;

export default function AppLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={HAS_SELECTED_TRIP}>
				<Stack.Screen name="(trip)" />
			</Stack.Protected>
			<Stack.Protected guard={!HAS_SELECTED_TRIP}>
				<Stack.Screen name="(no-trip)" />
			</Stack.Protected>
		</Stack>
	);
}
