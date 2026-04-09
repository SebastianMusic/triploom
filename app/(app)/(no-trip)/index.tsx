import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { createTripSchema } from '@/types/trip.types';
import { useTripStore } from '@/store/trip.store';

export default function TripPickerScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createTrip, trips, isLoading } = useTripStore();

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {trips.length > 0 && (
        <View style={styles.tripList}>
          <Text style={styles.listTitle}>Created trips</Text>
          {trips.map((trip) => (
            <View key={trip.id} style={styles.tripItem}>
              <Text style={styles.tripName}>{trip.name}</Text>
              {trip.description && (
                <Text style={styles.tripDescription}>{trip.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  tripList: {
    marginTop: 40,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  tripItem: {
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
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
});
