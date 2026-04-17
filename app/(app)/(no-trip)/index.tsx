import { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ActivityIndicator,
	Alert,
	StyleSheet,
	ScrollView,
	RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { createTripSchema, TripRole } from '@/types/trip.types';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { useAuthStore } from '@/store/auth.store';

export default function TripPickerScreen() {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [selectionError, setSelectionError] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const [selectingTripId, setSelectingTripId] = useState<string | null>(null);
	const [leavingTripId, setLeavingTripId] = useState<string | null>(null);

	const { createTrip, fetchTrips, trips, isLoading, leaveTrip, deleteTrip } = useTripStore();
	const { setSelectedTrip } = useProfileStore();
	const { session } = useAuthStore();

	useEffect(() => {
		fetchTrips();
	}, []);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await fetchTrips();
		} finally {
			setRefreshing(false);
		}
	}, [fetchTrips]);

	async function handleCreate() {
		setError(null);

		const result = createTripSchema.safeParse({
			name,
			description: description || null,
		});

		if (!result.success) {
			setError(result.error.issues[0].message);
			return;
		}

		try {
			await createTrip(result.data);
			setName('');
			setDescription('');
		} catch {
			setError('Failed to create trip. Please try again.');
		}
	}

	async function handleSelectTrip(tripId: string) {
		setSelectionError(null);
		setSelectingTripId(tripId);
		try {
			await setSelectedTrip(tripId);
		} catch (error: any) {
			setSelectionError(error?.message ?? 'Failed to select trip');
		} finally {
			setSelectingTripId(null);
		}
	}

	function handleLeaveTrip(tripId: string, tripName: string) {
		Alert.alert(
			'Leave Trip',
			`Are you sure you want to leave "${tripName}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Leave',
					style: 'destructive',
					onPress: async () => {
						setLeavingTripId(tripId);
						try {
							await leaveTrip(tripId);
						} catch {
							setSelectionError('Failed to leave trip. Please try again.');
						} finally {
							setLeavingTripId(null);
						}
					},
				},
			],
		);
	}

	function handleDeleteTrip(tripId: string, tripName: string) {
		Alert.alert(
			'Delete Trip',
			`Are you sure you want to delete "${tripName}"? This cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteTrip(tripId);
						} catch (error: any) {
							Alert.alert('Error', error?.message ?? 'Failed to delete trip.');
						}
					},
				},
			],
		);
	}

	function handleJoinWithCode() {
		router.push('/join');
	}

	return (
		<ScrollView
			contentContainerStyle={styles.container}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
		>
			<Text style={styles.debug}>DEBUG user id: {session?.user.id ?? 'no session'}</Text>
			<Text style={styles.title}>My Trips</Text>
			<Text style={styles.subtitle}>Create a new trip to get started</Text>

			<TextInput
				style={styles.input}
				placeholder="Trip name"
				value={name}
				onChangeText={setName}
				autoCapitalize="words"
			/>
			<TextInput
				style={[styles.input, styles.inputMultiline]}
				placeholder="Description (optional)"
				value={description}
				onChangeText={setDescription}
				multiline
				numberOfLines={3}
			/>

			{error && <Text style={styles.error}>{error}</Text>}

			<Pressable
				style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
				onPress={handleCreate}
				disabled={isLoading}
			>
				{isLoading
					? <ActivityIndicator color="#fff" />
					: <Text style={styles.buttonText}>Create Trip</Text>
				}
			</Pressable>

			<Pressable
				style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
				onPress={handleJoinWithCode}
			>
				<Text style={styles.secondaryButtonText}>Have an invite code?</Text>
			</Pressable>

			{selectionError && <Text style={styles.error}>{selectionError}</Text>}

			{trips.length > 0 && (
				<View style={styles.tripList}>
					<Text style={styles.listTitle}>Select a trip</Text>
					<Text style={styles.listSubtitle}>Tap a trip to start planning</Text>
					{trips.map((trip) => (
						<View key={trip.id} style={styles.tripRow}>
							<Pressable
								style={({ pressed }) => [styles.tripItem, pressed && styles.tripItemPressed]}
								onPress={() => handleSelectTrip(trip.id)}
								disabled={selectingTripId !== null || leavingTripId !== null}
							>
								<Text style={styles.tripName}>{trip.name}</Text>
								{trip.description && (
									<Text style={styles.tripDescription}>{trip.description}</Text>
								)}
								{selectingTripId === trip.id && <ActivityIndicator size="small" color="#3b82f6" />}
							</Pressable>
							<Pressable
								style={({ pressed }) => [styles.leaveButton, pressed && styles.leaveButtonPressed]}
								onPress={() => handleLeaveTrip(trip.id, trip.name)}
								disabled={selectingTripId !== null || leavingTripId !== null}
							>
								{leavingTripId === trip.id
									? <ActivityIndicator size="small" color="#e53e3e" />
									: <Text style={styles.leaveButtonText}>Leave</Text>
								}
							</Pressable>
							{trip.userRole === TripRole.Organizer && (
								<Pressable
									style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
									onPress={() => handleDeleteTrip(trip.id, trip.name)}
									disabled={selectingTripId !== null || leavingTripId !== null}
								>
									<Text style={styles.deleteButtonText}>Delete</Text>
								</Pressable>
							)}
						</View>
					))}
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	debug: {
		fontSize: 11,
		color: '#999',
		fontFamily: 'monospace',
		marginBottom: 8,
	},
	container: {
		flexGrow: 1,
		padding: 24,
		paddingTop: 64,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 32,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
		backgroundColor: '#fff',
	},
	inputMultiline: {
		height: 80,
		textAlignVertical: 'top',
	},
	error: {
		color: '#e53e3e',
		fontSize: 14,
		marginBottom: 12,
	},
	button: {
		backgroundColor: '#3b82f6',
		borderRadius: 8,
		padding: 14,
		alignItems: 'center',
		marginTop: 4,
	},
	buttonPressed: {
		opacity: 0.8,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#3b82f6',
		borderRadius: 8,
		padding: 14,
		alignItems: 'center',
		marginTop: 12,
	},
	secondaryButtonPressed: {
		opacity: 0.7,
		backgroundColor: '#f0f7ff',
	},
	secondaryButtonText: {
		color: '#3b82f6',
		fontSize: 16,
		fontWeight: '600',
	},
	tripList: {
		marginTop: 40,
	},
	listTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
		color: '#333',
	},
	listSubtitle: {
		fontSize: 13,
		color: '#666',
		marginBottom: 16,
	},
	tripRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	tripItem: {
		flex: 1,
		padding: 14,
		backgroundColor: '#f9f9f9',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#eee',
	},
	tripItemPressed: {
		opacity: 0.7,
		backgroundColor: '#e8f0fe',
	},
	leaveButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e53e3e',
		backgroundColor: '#fff5f5',
		minWidth: 60,
		alignItems: 'center',
	},
	leaveButtonPressed: {
		opacity: 0.7,
		backgroundColor: '#fed7d7',
	},
	leaveButtonText: {
		color: '#e53e3e',
		fontSize: 13,
		fontWeight: '600',
	},
	tripName: {
		fontSize: 16,
		fontWeight: '500',
	},
	tripDescription: {
		fontSize: 13,
		color: '#666',
		marginTop: 2,
	},
	deleteButton: {
		backgroundColor: '#fee2e2',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderWidth: 1,
		borderColor: '#fca5a5',
	},
	deleteButtonPressed: {
		opacity: 0.7,
	},
	deleteButtonText: {
		color: '#dc2626',
		fontSize: 14,
		fontWeight: '600',
	},
});
