import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useProfileStore } from '@/store/profile.store';

export default function AppLayout() {
	const { selectedTrip, fetchProfile } = useProfileStore();

	useEffect(() => {
		fetchProfile();
	}, []);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!!selectedTrip}>
				<Stack.Screen name="(trip)" />
			</Stack.Protected>
			<Stack.Protected guard={!selectedTrip}>
				<Stack.Screen name="(no-trip)" />
			</Stack.Protected>
		</Stack>
	);
}
