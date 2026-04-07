import { View, Text, StyleSheet } from 'react-native';

export default function TripPickerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>
      <Text style={styles.subtitle}>Select a trip or create a new one</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666' },
});
