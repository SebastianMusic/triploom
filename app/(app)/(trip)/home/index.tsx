import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AnnouncementList } from '@/components/announcement/AnnouncementList';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { TripInfoCard } from '@/components/trip/trip-info-card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';

export default function HomeScreen() {
	const router = useRouter();
	const { session } = useAuthStore();
	const { currentParticipant, fetchCurrentParticipant } = useTripStore();
	const { selectedTrip, setSelectedTrip } = useProfileStore();
	const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
	const { theme: { colors, layout, spacing } } = useAppTheme();
	const [isSwitching, setIsSwitching] = useState(false);

	useEffect(() => {
		if (selectedTrip && session?.user.id) {
			fetchCurrentParticipant(selectedTrip, session.user.id);
		}
	}, [fetchCurrentParticipant, selectedTrip, session?.user.id]);

	async function handleSwitchTrip() {
		setIsSwitching(true);
		try {
			await setSelectedTrip(null);
			router.replace('/(app)/(no-trip)');
		} finally {
			setIsSwitching(false);
		}
	}

	return (
		<View style={{ flex: 1 }}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					paddingTop: headerContentOffset,
					paddingBottom: bottomOverlayOffset,
					paddingHorizontal: layout.screenPadding,
					gap: spacing.md,
				}}>

				<TripInfoCard />

				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
					<AppText variant="caption" tone="muted">
						Your role: {currentParticipant?.role ?? '…'}
					</AppText>
					<Pressable
						onPress={handleSwitchTrip}
						disabled={isSwitching}
						style={({ pressed }) => ({
							paddingVertical: 6,
							paddingHorizontal: 12,
							borderRadius: 8,
							backgroundColor: colors.surfaceMuted,
							opacity: pressed ? 0.7 : 1,
						})}>
						{isSwitching
							? <ActivityIndicator size="small" color={colors.textMuted} />
							: <AppText variant="caption" tone="muted">Switch trip</AppText>}
					</Pressable>
				</View>

				<View style={{ gap: spacing.xs }}>
					<AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
						Announcements
					</AppText>
					<AnnouncementList />
				</View>
			</ScrollView>
		</View>
	);
}
