import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { Container } from '@/components/ui/container';
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
	const { theme: { colors, opacity, radius, shadows, spacing, stroke, typography } } = useAppTheme();

	const selectedTrip = useProfileStore((state) => state.selectedTrip);
	const {
		inviteUrl,
		isGeneratingInvite,
		inviteError,
		generateInvite,
		currentParticipant,
		currentTrip,
		participantsWithProfiles,
		fetchParticipants,
	} = useTripStore();

	const canManage =
		currentParticipant?.role === TripRole.Organizer ||
		currentParticipant?.role === TripRole.CoOrganizer;

	useEffect(() => {
		if (currentTrip?.id) {
			fetchParticipants(currentTrip.id).catch(() => undefined);
		}
	}, [currentTrip?.id, fetchParticipants]);

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
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: colors.background }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
				contentContainerStyle={{
					paddingTop: headerContentOffset,
					paddingBottom: bottomOverlayOffset,
				}}>
				<Container>
					<Stack space="sm">
						{canManage ? (
							<TripEditForm />
						) : null}

						{canManage ? (
							<Pressable
								onPress={() => router.push('/(app)/(trip)/admin/people')}
								style={({ pressed }) => ([
									{
										gap: spacing.xs,
										borderRadius: radius.xl,
										backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
										borderWidth: stroke.thin,
										borderColor: colors.border,
										padding: spacing.sm,
									},
									shadows.sm,
								])}>
								<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
										<View
											style={{
												width: 44,
												height: 44,
												borderRadius: radius.full,
												alignItems: 'center',
												justifyContent: 'center',
												backgroundColor: colors.secondarySoft,
											}}>
											<Ionicons name="people-outline" size={22} color={colors.secondary} />
										</View>
										<View style={{ flex: 1, gap: 2 }}>
											<AppText style={typography.label}>People & groups</AppText>
											<AppText variant="caption" tone="muted">
												See participants, contact details, and group memberships.
											</AppText>
										</View>
									</View>
									<View style={{ alignItems: 'flex-end', gap: 2 }}>
										<AppText style={typography.label}>{participantsWithProfiles.length}</AppText>
										<AppText variant="caption" tone="muted">
											{participantsWithProfiles.length === 1 ? 'person' : 'people'}
										</AppText>
									</View>
								</View>
							</Pressable>
						) : null}

						{canManage ? (
							<View
								style={[
									{
										gap: spacing.sm,
										borderRadius: radius.xl,
										backgroundColor: colors.surface,
										borderWidth: 1,
										borderColor: colors.border,
										padding: spacing.sm,
									},
									shadows.sm,
								]}>
								<AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
									Invite
								</AppText>
								<AppText variant="caption" tone="muted">
									Generate a link to invite more people to this trip.
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
						) : null}
					</Stack>
				</Container>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
