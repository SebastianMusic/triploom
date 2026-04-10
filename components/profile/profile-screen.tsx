import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import EditProfileScreen from '@/components/profile/edit-profile-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { signOut } from '@/services/auth.service';
import { updateProfile } from '@/services/profile.service';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="defaultSemiBold" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

export default function ProfileScreen() {
  const { session } = useAuthStore();
  const { profile, isLoading, fetchProfile, setProfile } = useProfileStore();
  const [showEditScreen, setShowEditScreen] = useState(false);
  const [editableAvatarUrl, setEditableAvatarUrl] = useState('');
  const [editableFullName, setEditableFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile && session?.user) {
      fetchProfile().catch(() => undefined);
    }
  }, [fetchProfile, profile, session]);

  const resolvedFullName =
    profile?.user_name ??
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.username ??
    'Not added yet';

  const email = session?.user.email ?? 'Not available';

  const resolvedMobileNumber =
    session?.user.phone ?? session?.user.user_metadata?.phone ?? 'Not added yet';

  useEffect(() => {
    setEditableAvatarUrl(profile?.profile_picture_url ?? '');
    setEditableFullName(resolvedFullName === 'Not added yet' ? '' : resolvedFullName);
  }, [profile?.profile_picture_url, resolvedFullName]);

  const fullName = editableFullName.trim() || 'Not added yet';
  const mobileNumber = resolvedMobileNumber;

  const initials = useMemo(() => {
    const source = fullName !== 'Not added yet' ? fullName : email;

    return (
      source
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase())
        .join('') || 'U'
    );
  }, [email, fullName]);

  async function handleSaveChanges() {
    if (!session?.user) {
      setSaveError('You need to be signed in to update your profile.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updatedProfile = await updateProfile(session.user.id, {
        user_name: editableFullName.trim() || null,
        profile_picture_url: editableAvatarUrl.trim() || null,
      });

      setProfile(updatedProfile);
      setSaveSuccess('Profile updated successfully.');
      setShowEditScreen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Unable to save your profile changes.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await signOut();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  if (showEditScreen) {
    return (
      <EditProfileScreen
        avatarUrl={editableAvatarUrl}
        fullName={editableFullName}
        mobileNumber={mobileNumber === 'Not added yet' ? '' : mobileNumber}
        onAvatarUrlChange={setEditableAvatarUrl}
        onFullNameChange={setEditableFullName}
        onMobileNumberChange={() => undefined}
        onBack={() => {
          setSaveError(null);
          setShowEditScreen(false);
        }}
        onSave={handleSaveChanges}
        isSaving={isSaving}
        errorMessage={saveError}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title" style={styles.heading}>
        My Profile
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        View your personal information here.
      </ThemedText>

      <ThemedView style={styles.card}>
        <View style={styles.avatarWrapper}>
          {editableAvatarUrl ? (
            <Image source={{ uri: editableAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>
          )}
        </View>

        <ThemedText type="subtitle" style={styles.profileName}>
          {fullName}
        </ThemedText>
        <ThemedText style={styles.profileMeta}>Profile Picture</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <InfoRow label="Full Name" value={fullName} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Mobile Number" value={mobileNumber} />
      </ThemedView>

      {saveSuccess ? <ThemedText style={styles.successText}>{saveSuccess}</ThemedText> : null}
      {saveError ? <ThemedText style={styles.errorText}>{saveError}</ThemedText> : null}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => {
          setSaveError(null);
          setSaveSuccess(null);
          setShowEditScreen(true);
        }}
      >
        <ThemedText style={styles.buttonText}>Update Information</ThemedText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonPressed]}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
        )}
      </Pressable>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  heading: {
    marginTop: 8,
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
    gap: 14,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  profileName: {
    textAlign: 'center',
  },
  profileMeta: {
    textAlign: 'center',
    color: '#6b7280',
  },
  infoRow: {
    gap: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    color: '#6b7280',
  },
  successText: {
    color: '#15803d',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  signOutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  loadingText: {
    color: '#6b7280',
  },
});
