import { View, Text, StyleSheet } from 'react-native';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';
import { AnnouncementList } from './AnnouncementList';
import { AnnouncementForm } from './AnnouncementForm';
import { ParticipantList } from '../participant-ui/participant-list';

const CAN_POST_ROLES: (string | null)[] = [TripRole.Organizer, TripRole.CoOrganizer];

export function AnnouncementFeed() {
	const { currentParticipant } = useTripStore();
	const canPost = CAN_POST_ROLES.includes(currentParticipant?.role ?? null);

	return (
		<View style={styles.container}>
			<Text style={styles.sectionTitle}>Announcements</Text>
			{canPost && <AnnouncementForm />}
			<AnnouncementList />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
});
