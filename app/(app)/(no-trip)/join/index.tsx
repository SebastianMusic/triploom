import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import type { RedeemInviteResponse } from '@/types';

export default function JoinTripScreen() {
  const insets = useSafeAreaInsets();
  const [inviteCode, setInviteCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<RedeemInviteResponse | null>(null);

  const { redeemInvite, fetchTrips, isRedeemingInvite, inviteError } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const { code } = useLocalSearchParams();
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  useEffect(() => {
    if (typeof code !== 'string') return;
    let extracted = code;
    try {
      const parsed = new URL(code);
      extracted = parsed.searchParams.get('code') ?? parsed.pathname.split('/').pop() ?? code;
    } catch {
      // not a URL — use as-is
    }
    setInviteCode(extracted);
  }, [code]);

  async function handleJoin() {
    setValidationError(null);
    setSuccessResult(null);

    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      setValidationError('Invite code is required');
      return;
    }

    try {
      const result = await redeemInvite(trimmedCode);
      setSuccessResult(result);
    } catch {
      // The store exposes inviteError for user feedback.
    }
  }

  async function handleGoToTrip() {
    if (!successResult?.trip_id) return;
    await fetchTrips();
    await setSelectedTrip(successResult.trip_id);
  }

  const errorMessage = validationError ?? inviteError;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <Container style={{ flex: 1 }}>
        <BackButton />

        {successResult ? (
          <Stack style={{ flex: 1, justifyContent: 'center' }} space="sm">
            <View
              style={{
                borderRadius: radius.xl,
                backgroundColor: colors.surface,
                padding: spacing.sm,
                alignItems: 'center',
                gap: spacing.sm,
              }}>
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

              <View style={{ alignItems: 'center', gap: spacing.xs }}>
                <AppText variant="subtitle" style={{ textAlign: 'center' }}>
                  Trip joined
                </AppText>
                <AppText tone="muted" style={{ textAlign: 'center' }}>
                  {successResult.message || 'You have been added to the trip.'}
                </AppText>
              </View>

              <Button label="Go to trip" fullWidth onPress={() => { void handleGoToTrip(); }} />
              <Button label="Back to trips" variant="secondary" fullWidth onPress={() => router.back()} />
            </View>
          </Stack>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingTop: spacing.xl,
              paddingBottom: spacing.xl,
            }}>
            <View
              style={{
                borderRadius: radius.xl,
                backgroundColor: colors.surface,
                padding: spacing.sm,
                gap: spacing.sm,
              }}>
              <View style={{ gap: spacing.md }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                  }}>
                  <Ionicons name="key-outline" size={24} color={colors.text} />
                </View>
                <AppText style={typography.title}>Join trip</AppText>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Input
                  label="Invite code"
                  placeholder="e.g. BERLIN-2026"
                  value={inviteCode}
                  onChangeText={(value) => {
                    setInviteCode(value);
                    setValidationError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isRedeemingInvite}
                  error={errorMessage ?? undefined}
                />

                <Button
                  label="Join trip"
                  fullWidth
                  loading={isRedeemingInvite}
                  disabled={!inviteCode.trim()}
                  onPress={() => { void handleJoin(); }}
                />
              </View>

              <View
                style={{
                  borderRadius: radius.lg,
                  backgroundColor: colors.secondarySoft,
                  padding: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}>
                <Ionicons name="information-circle-outline" size={20} color={colors.secondary} />
                <AppText variant="caption" tone="muted" style={{ flex: 1 }}>
                  Use the invite code from your organizer.
                </AppText>
              </View>
            </View>
          </View>
        )}
        </Container>

        {isRedeemingInvite ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + spacing.md, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
