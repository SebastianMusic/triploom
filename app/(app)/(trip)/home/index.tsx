import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { AnnouncementList } from '@/components/announcement/AnnouncementList';

export default function HomeScreen() {
	const router = useRouter();
	const { session } = useAuthStore();
	const { currentParticipant, fetchCurrentParticipant } = useTripStore();
	const { selectedTrip, setSelectedTrip } = useProfileStore();
	const [isSwitching, setIsSwitching] = useState(false);

	useEffect(() => {
		if (selectedTrip && session?.user.id) {
			fetchCurrentParticipant(selectedTrip, session.user.id);
		}
	}, [selectedTrip, session?.user.id]);

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
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Home</Text>
			<Text style={styles.role}>Your role: {currentParticipant?.role ?? '...'}</Text>

			<Pressable
				style={({ pressed }) => [styles.switchButton, pressed && styles.switchButtonPressed]}
				onPress={handleSwitchTrip}
				disabled={isSwitching}
			>
				{isSwitching
					? <ActivityIndicator size="small" color="#6b7280" />
					: <Text style={styles.switchButtonText}>Switch trip</Text>
				}
			</Pressable>

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
	switchButton: {
		alignSelf: 'flex-start',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: '#f3f4f6',
	},
	switchButtonPressed: {
		backgroundColor: '#e5e7eb',
	},
	switchButtonText: {
		fontSize: 13,
		color: '#6b7280',
		fontWeight: '500',
	},
	section: { marginTop: 8 },
});
