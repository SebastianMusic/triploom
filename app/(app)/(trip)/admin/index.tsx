import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';

export default function AdminScreen() {
  const [copied, setCopied] = useState(false);

  async function handleCopyInviteLink() {
    await Clipboard.setStringAsync('https://triploom.app/invite/placeholder');
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleCopyInviteLink}
        >
          <Text style={styles.buttonText}>{copied ? 'Copied!' : 'Copy Invite Link'}</Text>
        </Pressable>
      </View>
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
});
