import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdminScreen() {
	const [copied, setCopied] = useState(false);

	const selectedTrip = useProfileStore((state) => state.selectedTrip);
	const {
		inviteUrl,
		isGeneratingInvite,
		inviteError,
		generateInvite,
		currentParticipant,
	} = useTripStore();

	const canGenerateInvites =
		currentParticipant?.role === TripRole.Organizer ||
		currentParticipant?.role === TripRole.CoOrganizer;

	async function handleGenerateInvite() {
		if (!selectedTrip) return;
		try {
			await generateInvite(selectedTrip);
		} catch { }
	}

	async function handleCopyInviteLink() {
		if (!inviteUrl) return;
		await Clipboard.setStringAsync(inviteUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<ScrollView style={styles.container}>
			<Text style={styles.title}>Admin</Text>
			<Text style={styles.subtitle}>Manage your trip</Text>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Create Announcement</Text>
				<AnnouncementForm />
			</View>

			{canGenerateInvites && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Invite</Text>

					{inviteError && (
						<Text style={styles.errorText}>{inviteError}</Text>
					)}

					{isGeneratingInvite ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="small" color="#3b82f6" />
							<Text style={styles.loadingText}>Generating invite link...</Text>
						</View>
					) : inviteUrl ? (
						<View style={styles.inviteContainer}>
							<Text style={styles.inviteUrl} numberOfLines={1} ellipsizeMode="middle">
								{inviteUrl}
							</Text>
							<Pressable
								style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
								onPress={handleCopyInviteLink}
							>
								<Text style={styles.buttonText}>{copied ? 'Copied!' : 'Copy'}</Text>
							</Pressable>
						</View>
					) : (
						<Pressable
							style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
							onPress={handleGenerateInvite}
							disabled={!selectedTrip}
						>
							<Text style={styles.buttonText}>Generate Invite Link</Text>
						</Pressable>
					)}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		paddingTop: 80,
		backgroundColor: '#fff',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 40,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333',
		marginBottom: 12,
	},
	button: {
		backgroundColor: '#3b82f6',
		borderRadius: 10,
		padding: 14,
		alignItems: 'center',
	},
	buttonPressed: {
		opacity: 0.8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	errorText: {
		color: '#ef4444',
		fontSize: 14,
		marginBottom: 12,
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	loadingText: {
		fontSize: 14,
		color: '#666',
	},
	inviteContainer: {
		gap: 12,
	},
	inviteUrl: {
		fontSize: 14,
		color: '#333',
		backgroundColor: '#f3f4f6',
		padding: 12,
		borderRadius: 8,
	},
});