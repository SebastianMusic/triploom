import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const { redeemInvite, isRedeemingInvite, inviteError } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const { code } = useLocalSearchParams();
  const {
    theme: { colors, layout, radius, spacing, typography },
  } = useAppTheme();

  useEffect(() => {
    if (typeof code === 'string') setInviteCode(code);
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
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <BackButton />

        {successResult ? (
          <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
            <View
              style={{
                borderRadius: radius.xl,
                backgroundColor: colors.surface,
                padding: spacing.lg,
                alignItems: 'center',
                gap: spacing.md,
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
          </View>
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
                padding: spacing.lg,
                gap: spacing.lg,
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

        {isRedeemingInvite ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + spacing.md, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
