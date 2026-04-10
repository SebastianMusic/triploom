import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type EditProfileScreenProps = {
  avatarUrl: string;
  fullName: string;
  mobileNumber: string;
  onAvatarUrlChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onMobileNumberChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
};

export default function EditProfileScreen({
  avatarUrl,
  fullName,
  mobileNumber,
  onAvatarUrlChange,
  onFullNameChange,
  onMobileNumberChange,
  onBack,
  onSave,
  isSaving = false,
  errorMessage,
}: EditProfileScreenProps) {
  const initials =
    fullName
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Edit Profile</ThemedText>
      <ThemedText style={styles.subtitle}>
        Update your profile picture and full name.
      </ThemedText>

      <ThemedView style={styles.card}>
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Profile Image URL</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Paste image URL"
            value={avatarUrl}
            onChangeText={onAvatarUrlChange}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <ThemedText type="defaultSemiBold">Full Name</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={onFullNameChange}
          />
        </View>

        {errorMessage ? <ThemedText style={styles.errorText}>{errorMessage}</ThemedText> : null}
      </ThemedView>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={onBack}
          disabled={isSaving}
        >
          <ThemedText style={styles.secondaryButtonText}>Back</ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Save Changes</ThemedText>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: -4,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  fieldGroup: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
