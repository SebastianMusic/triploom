import { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { AnnouncementList } from '@/components/announcement/AnnouncementList';

export default function HomeScreen() {
	const { session } = useAuthStore();
	const { currentParticipant, fetchCurrentParticipant } = useTripStore();
	const { selectedTrip } = useProfileStore();

	useEffect(() => {
		if (selectedTrip && session?.user.id) {
			fetchCurrentParticipant(selectedTrip, session.user.id);
		}
	}, [selectedTrip, session?.user.id]);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Home</Text>
			<Text style={styles.role}>Your role: {currentParticipant?.role ?? '...'}</Text>
			<View style={styles.section}>
				<AnnouncementList />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16, gap: 8 },
	title: { fontSize: 24, fontWeight: 'bold' },
	role: { fontSize: 14, color: '#444' },
	section: { marginTop: 8 },
});
