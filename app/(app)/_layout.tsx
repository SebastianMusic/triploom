import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useProfileStore } from '@/store/profile.store';
import { useAuthStore } from '@/store/auth.store';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function AppLayout() {
	const { selectedTrip, fetchProfile } = useProfileStore();
	const { session } = useAuthStore();

	useEffect(() => {
		fetchProfile();
	}, []);

	usePushNotifications(session?.user.id);

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
