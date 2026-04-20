import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import type { RedeemInviteResponse } from '@/types';

export default function JoinTripScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<RedeemInviteResponse | null>(null);

  const { redeemInvite, isRedeemingInvite, inviteError } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const { code } = useLocalSearchParams();

  useEffect(() => {
    if (code && typeof code === 'string') {
      setInviteCode(code);
    }
  }, [code]);

  function handleBack() {
    router.back();
  }

  async function handleJoin() {
    setValidationError(null);
    setSuccessResult(null);

    if (!inviteCode.trim()) {
      setValidationError('Please enter an invite code');
      return;
    }

    try {
      const result = await redeemInvite(inviteCode.trim());
      setSuccessResult(result);
    } catch {
      // Error is already set in the store (inviteError) and persists for user feedback
    }
  }

  async function handleGoToTrip() {
    if (successResult?.trip_id) {
      try {
        await setSelectedTrip(successResult.trip_id);
        // Navigation happens automatically via layout when trip is selected
      } catch {
        // Error will be handled by the store
      }
    }
  }

  if (successResult) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Successfully Joined!</Text>
          <Text style={styles.successMessage}>
            {successResult.message || 'You have been added to the trip.'}
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleGoToTrip}
          >
            <Text style={styles.buttonText}>Go to Trip</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={handleBack}
          >
            <Text style={styles.secondaryButtonText}>Back to Trip Picker</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        onPress={handleBack}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Join a Trip</Text>
      <Text style={styles.subtitle}>
        Enter an invite code to join an existing trip. Ask the trip organizer for their invite code.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isRedeemingInvite}
      />

      {validationError && <Text style={styles.error}>{validationError}</Text>}
      {inviteError && <Text style={styles.error}>{inviteError}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (!inviteCode.trim() || isRedeemingInvite) && styles.buttonDisabled,
        ]}
        onPress={handleJoin}
        disabled={!inviteCode.trim() || isRedeemingInvite}
      >
        {isRedeemingInvite ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Join Trip</Text>
        )}
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What is an invite code?</Text>
        <Text style={styles.infoText}>
          Trip organizers can generate invite codes to share with friends and family. 
          Each code is unique and allows one person to join the trip.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  backButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    fontSize: 64,
    color: '#22c55e',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
