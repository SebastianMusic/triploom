import { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';

export default function HomeScreen() {
  const { signOut, session } = useAuthStore();
  const { currentParticipant, fetchCurrentParticipant } = useTripStore();
  const { selectedTrip } = useProfileStore();

  useEffect(() => {
    if (selectedTrip && session?.user.id) {
      fetchCurrentParticipant(selectedTrip, session.user.id);
    }
  }, [selectedTrip, session?.user.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Trip overview goes here</Text>
      <Text style={styles.role}>Your role: {currentParticipant?.role ?? '...'}</Text>
      {/* TEMP: logout button for testing issue #52 — remove before push */}
      <Button title="Logout" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666' },
  role: { fontSize: 14, color: '#444' },
});
