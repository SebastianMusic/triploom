import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { Button } from '@/components/ui/button';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { Container } from '@/components/ui/container';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { TripEditForm } from '@/components/trip/trip-edit-form';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';

export default function AdminScreen() {
	const [copied, setCopied] = useState(false);
	const router = useRouter();
	const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
	const { theme: { colors, opacity, radius, shadows, spacing, typography } } = useAppTheme();

	const selectedTrip = useProfileStore((state) => state.selectedTrip);
	const {
		inviteUrl,
		isGeneratingInvite,
		inviteError,
		generateInvite,
		deleteTrip,
		currentParticipant,
		currentTrip,
	} = useTripStore();

	const canManage =
		currentParticipant?.role === TripRole.Organizer ||
		currentParticipant?.role === TripRole.CoOrganizer;

	async function handleGenerateInvite() {
		if (!selectedTrip) return;
		try {
			await generateInvite(selectedTrip);
		} catch { }
	}

	async function handleCopyInviteLink() {
		if (!inviteUrl) return;
		await Clipboard.setStringAsync(inviteUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

  function handleDeleteTrip() {
    if (!currentTrip) return;
    confirmDestructiveAction({
      title: 'Delete trip',
      message: `Delete "${currentTrip.name ?? 'this trip'}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteTrip(currentTrip.id);
        await useProfileStore.getState().setSelectedTrip(null);
        router.replace('/(app)/(no-trip)');
      },
    });
  }

	return (
		<KeyboardScreenView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: bottomOverlayOffset,
      }}>
				<Container>
					<Stack space="sm">
						{canManage ? (
							<TripEditForm
                middleContent={(
                  <View
                    style={[
                      {
                        gap: spacing.sm,
                        borderRadius: radius.xl,
                        backgroundColor: colors.surface,
                        padding: spacing.sm,
                      },
                      shadows.sm,
                    ]}>
                    <AppText style={typography.label}>
                      Invite more people to this trip
                    </AppText>

                    {inviteError ? (
                      <AppText variant="caption" tone="error">{inviteError}</AppText>
                    ) : null}

                    {isGeneratingInvite ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <AppText variant="caption" tone="muted">Generating invite link…</AppText>
                      </View>
                    ) : inviteUrl ? (
                      <Stack space="sm">
                        <View style={{
                          backgroundColor: colors.surfaceMuted,
                          borderRadius: radius.md,
                          padding: spacing.sm,
                        }}>
                          <AppText variant="caption" tone="muted" numberOfLines={1}>
                            {inviteUrl}
                          </AppText>
                        </View>
                        <Pressable
                          onPress={handleCopyInviteLink}
                          style={({ pressed }) => ({
                            backgroundColor: colors.primary,
                            borderRadius: radius.full,
                            minHeight: 52,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: pressed ? opacity.pressed : 1,
                          })}>
                          <AppText style={[typography.label, { color: colors.textOnPrimary }]}>
                            {copied ? 'Copied!' : 'Copy link'}
                          </AppText>
                        </Pressable>
                      </Stack>
                    ) : (
                      <Pressable
                        onPress={handleGenerateInvite}
                        disabled={!selectedTrip}
                        style={({ pressed }) => ({
                          backgroundColor: colors.primary,
                          borderRadius: radius.full,
                          minHeight: 52,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: !selectedTrip ? opacity.disabled : pressed ? opacity.pressed : 1,
                        })}>
                        <AppText style={[typography.label, { color: colors.textOnPrimary }]}>Generate invite link</AppText>
                      </Pressable>
                    )}
                  </View>
                )}
              />
						) : null}
            {canManage ? (
              <View
                style={{
                  marginTop: spacing.lg,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                <Button
                  label="Delete trip"
                  variant="destructive"
                  fullWidth
                  onPress={handleDeleteTrip}
                />
              </View>
            ) : null}
					</Stack>
				</Container>
		</KeyboardScreenView>
	);
}
