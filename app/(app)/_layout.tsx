import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GlobalProfileButton } from '@/components/layout';
import { useProfileStore } from '@/store/profile.store';
import { useAuthStore } from '@/store/auth.store';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useNotificationNavigation } from '@/hooks/use-notification-navigation';
import { useAppTheme } from '@/components/ui/theme-provider';

export default function AppLayout() {
	const { selectedTrip, fetchProfile } = useProfileStore();
	const { session } = useAuthStore();
	const { theme } = useAppTheme();

	useEffect(() => {
		fetchProfile().catch(() => {});
	}, []);

	usePushNotifications(session?.user.id);
	useNotificationNavigation();

	return (
		<>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: theme.colors.background },
					gestureEnabled: true,
				}}>
				<Stack.Protected guard={!!selectedTrip}>
					<Stack.Screen name="(trip)" />
				</Stack.Protected>
				<Stack.Protected guard={!selectedTrip}>
					<Stack.Screen name="(no-trip)" />
				</Stack.Protected>
				<Stack.Screen name="profile/index" />
				<Stack.Screen name="invite/index" />
			</Stack>
			<GlobalProfileButton />
		</>
	);
}
