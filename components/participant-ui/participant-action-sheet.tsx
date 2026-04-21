import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';
import type { TripParticipantWithProfile } from '@/services/trip.service';

type Action = {
  label: string;
  destructive?: boolean;
  onPress: () => Promise<void>;
};

type Props = {
  target: TripParticipantWithProfile;
  actorUserId: string;
  actorRole: string;
  tripId: string;
  onClose: () => void;
};

export function ParticipantActionSheet({ target, actorUserId, actorRole, tripId, onClose }: Props) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  const updateParticipantRole = useTripStore((s) => s.updateParticipantRole);
  const kickParticipant = useTripStore((s) => s.kickParticipant);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetRole = target.role as TripRole | null;
  const targetName = target.profile?.user_name ?? 'This participant';

  async function run(label: string, fn: () => Promise<void>) {
    setLoadingAction(label);
    setError(null);
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoadingAction(null);
    }
  }

  const actions: Action[] = [];

  if (actorRole === TripRole.Organizer || actorRole === TripRole.CoOrganizer) {
    const canTouchTarget =
      actorRole === TripRole.Organizer || targetRole !== TripRole.Organizer;

    if (canTouchTarget) {
      if (targetRole === TripRole.Participant) {
        actions.push({
          label: 'Promote to Co-organizer',
          onPress: () => run('Promote to Co-organizer', () =>
            updateParticipantRole(tripId, actorUserId, target.user_id!, TripRole.CoOrganizer),
          ),
        });
      }

      if (targetRole === TripRole.CoOrganizer) {
        actions.push({
          label: 'Demote to Participant',
          onPress: () => run('Demote to Participant', () =>
            updateParticipantRole(tripId, actorUserId, target.user_id!, TripRole.Participant),
          ),
        });
      }

      if (actorRole === TripRole.Organizer && targetRole === TripRole.CoOrganizer) {
        actions.push({
          label: 'Promote to Organizer',
          onPress: () => run('Promote to Organizer', () =>
            updateParticipantRole(tripId, actorUserId, target.user_id!, TripRole.Organizer),
          ),
        });
      }

      actions.push({
        label: 'Kick from trip',
        destructive: true,
        onPress: () => run('Kick from trip', () => kickParticipant(tripId, target.user_id!)),
      });
    }
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayStrong }}
        onPress={onClose}>
        <Pressable>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.lg,
              gap: spacing.sm,
            }}>
            <AppText style={[typography.label, { marginBottom: spacing.xs }]}>
              {targetName}
            </AppText>

            {actions.length === 0 ? (
              <AppText tone="muted">No actions available.</AppText>
            ) : (
              actions.map((action) => (
                <Pressable
                  key={action.label}
                  disabled={loadingAction !== null}
                  onPress={action.onPress}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    borderRadius: radius.lg,
                    backgroundColor: action.destructive ? colors.surfaceMuted : colors.surfaceMuted,
                    paddingHorizontal: spacing.md,
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: spacing.sm,
                    opacity: pressed || loadingAction !== null ? 0.6 : 1,
                  })}>
                  {loadingAction === action.label ? (
                    <ActivityIndicator color={action.destructive ? colors.error : colors.primary} />
                  ) : null}
                  <AppText
                    style={[
                      typography.label,
                      { color: action.destructive ? colors.error : colors.text },
                    ]}>
                    {action.label}
                  </AppText>
                </Pressable>
              ))
            )}

            {error ? (
              <AppText variant="caption" tone="error">
                {error}
              </AppText>
            ) : null}

            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
                marginTop: spacing.xs,
              })}>
              <AppText style={[typography.label, { color: colors.textMuted }]}>Cancel</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
