import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';

export default function JoinDeepLinkScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { redeemInvite, fetchTrips } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMessage('Invalid invite link.');
      return;
    }

    async function join() {
      try {
        const result = await redeemInvite(code);
        await fetchTrips();
        await setSelectedTrip(result.trip_id);
        setStatus('success');
      } catch (e: unknown) {
        setStatus('error');
        setErrorMessage(e instanceof Error ? e.message : 'Failed to join trip.');
      }
    }

    void join();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <Container style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {status === 'joining' && (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText tone="muted">Joining trip…</AppText>
          </View>
        )}

        {status === 'success' && (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primarySoft,
              }}>
              <Ionicons name="checkmark" size={34} color={colors.primary} />
            </View>
            <AppText variant="subtitle">Trip joined!</AppText>
          </View>
        )}

        {status === 'error' && (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}>
              <Ionicons name="close" size={34} color={colors.error} />
            </View>
            <AppText variant="subtitle" style={{ textAlign: 'center' }}>
              Could not join trip
            </AppText>
            {errorMessage ? (
              <AppText tone="muted" style={{ textAlign: 'center' }}>
                {errorMessage}
              </AppText>
            ) : null}
            <Button label="Go back" variant="secondary" onPress={() => router.back()} />
          </View>
        )}
      </Container>
    </View>
  );
}
