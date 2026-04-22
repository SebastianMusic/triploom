import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AnnouncementList } from '@/components/announcement/AnnouncementList';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { PersonsSheet } from '@/components/trip/persons-sheet';
import { TripInfoCard } from '@/components/trip/trip-info-card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

export default function HomeScreen() {
	const router = useRouter();
	const { session } = useAuthStore();
	const { currentParticipant, fetchCurrentParticipant, participantsWithProfiles, fetchParticipants, currentTrip } = useTripStore();
	const { selectedTrip, setSelectedTrip } = useProfileStore();
	const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
	const { theme: { colors, layout, spacing, radius, stroke } } = useAppTheme();
	const [isSwitching, setIsSwitching] = useState(false);
	const [personsVisible, setPersonsVisible] = useState(false);

	const isOrganizer = currentParticipant?.role === TripRole.Organizer;

	useEffect(() => {
		if (selectedTrip && session?.user.id) {
			fetchCurrentParticipant(selectedTrip, session.user.id);
		}
	}, [selectedTrip, session?.user.id]);

	useEffect(() => {
		if (currentTrip?.id) {
			fetchParticipants(currentTrip.id).catch(() => undefined);
		}
	}, [currentTrip?.id]);

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

				<Pressable
					onPress={() => setPersonsVisible(true)}
					style={({ pressed }) => ({
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingVertical: spacing.sm,
						paddingHorizontal: spacing.md,
						borderRadius: radius.md,
						borderWidth: stroke.thin,
						borderColor: colors.border,
						backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
					})}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
						<Ionicons name="people-outline" size={20} color={colors.text} />
						<AppText style={{ fontWeight: '500' }}>Persons</AppText>
					</View>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
						<AppText variant="caption" tone="muted">{participantsWithProfiles.length}</AppText>
						<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
					</View>
				</Pressable>

			</ScrollView>

			<PersonsSheet
				visible={personsVisible}
				onClose={() => setPersonsVisible(false)}
				participants={participantsWithProfiles}
				isOrganizer={isOrganizer}
			/>
		</View>
	);
}
