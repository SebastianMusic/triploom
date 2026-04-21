import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { TripEditForm } from '@/components/trip/trip-edit-form';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';

export default function AdminScreen() {
	const [copied, setCopied] = useState(false);
	const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
	const { theme: { colors, layout, spacing } } = useAppTheme();

	const selectedTrip = useProfileStore((state) => state.selectedTrip);
	const { inviteUrl, isGeneratingInvite, inviteError, generateInvite, currentParticipant } = useTripStore();

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

	return (
		<View style={{ flex: 1 }}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					paddingTop: headerContentOffset,
					paddingBottom: bottomOverlayOffset,
					paddingHorizontal: layout.screenPadding,
					gap: spacing.lg,
				}}>

				{canManage && (
					<View style={{ gap: spacing.sm }}>
						<AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
							Trip details
						</AppText>
						<TripEditForm />
					</View>
				)}

				<View style={{ gap: spacing.sm }}>
					<AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
						Create Announcement
					</AppText>
					<AnnouncementForm />
				</View>

				{canManage && (
					<View style={{ gap: spacing.sm }}>
						<AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
							Invite
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
							<View style={{ gap: spacing.sm }}>
								<View style={{
									backgroundColor: colors.surfaceMuted,
									borderRadius: 8,
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
										borderRadius: 10,
										padding: spacing.sm,
										alignItems: 'center',
										opacity: pressed ? 0.8 : 1,
									})}>
									<AppText style={{ color: colors.textOnPrimary }}>
										{copied ? 'Copied!' : 'Copy link'}
									</AppText>
								</Pressable>
							</View>
						) : (
							<Pressable
								onPress={handleGenerateInvite}
								disabled={!selectedTrip}
								style={({ pressed }) => ({
									backgroundColor: colors.primary,
									borderRadius: 10,
									padding: spacing.sm,
									alignItems: 'center',
									opacity: pressed ? 0.8 : 1,
								})}>
								<AppText style={{ color: colors.textOnPrimary }}>Generate invite link</AppText>
							</Pressable>
						)}
					</View>
				)}

			</ScrollView>
		</View>
	);
}
