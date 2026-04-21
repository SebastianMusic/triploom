import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { ParticipantActionSheet } from '@/components/participant-ui/participant-action-sheet';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import { Avatar } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  [TripRole.Organizer]: 'Organizer',
  [TripRole.CoOrganizer]: 'Co-organizer',
  [TripRole.Participant]: 'Participant',
};

const ROLE_ORDER: Record<string, number> = {
  [TripRole.Organizer]: 0,
  [TripRole.CoOrganizer]: 1,
  [TripRole.Participant]: 2,
};

const ROLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  [TripRole.Organizer]: 'star',
  [TripRole.CoOrganizer]: 'star-half',
  [TripRole.Participant]: 'person',
};

export function ParticipantList() {
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const { session } = useAuthStore();
  const currentTrip = useTripStore((s) => s.currentTrip);
  const currentParticipant = useTripStore((s) => s.currentParticipant);
  const participantsWithProfiles = useTripStore((s) => s.participantsWithProfiles);
  const isLoadingParticipants = useTripStore((s) => s.isLoadingParticipants);
  const fetchParticipants = useTripStore((s) => s.fetchParticipants);

  const [selectedParticipant, setSelectedParticipant] = useState<TripParticipantWithProfile | null>(null);

  useEffect(() => {
    if (currentTrip?.id) {
      fetchParticipants(currentTrip.id).catch(() => undefined);
    }
  }, [currentTrip?.id, fetchParticipants]);

  const actorRole = currentParticipant?.role as TripRole | null;
  const canManage =
    actorRole === TripRole.Organizer || actorRole === TripRole.CoOrganizer;

  if (isLoadingParticipants) {
    return (
      <View style={{ alignItems: 'center', padding: spacing.md }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (participantsWithProfiles.length === 0) {
    return (
      <View style={{ padding: spacing.md }}>
        <AppText tone="muted">No participants yet.</AppText>
      </View>
    );
  }

  const sorted = [...participantsWithProfiles].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role ?? ''] ?? 2;
    const roleB = ROLE_ORDER[b.role ?? ''] ?? 2;
    if (roleA !== roleB) return roleA - roleB;
    return (a.profile?.user_name ?? '').localeCompare(b.profile?.user_name ?? '');
  });

  const currentUserId = session?.user.id;

  return (
    <>
      <Stack space="xs">
        {sorted.map((item) => {
          const name = item.profile?.user_name ?? 'Unknown';
          const roleLabel = item.role ? (ROLE_LABELS[item.role] ?? item.role) : 'Participant';
          const isSelf = item.user_id === currentUserId;
          const isTargetOrganizer = item.role === TripRole.Organizer;
          const tappable = canManage && !isSelf && !(actorRole === TripRole.CoOrganizer && isTargetOrganizer);

          const icon = ROLE_ICONS[item.role ?? ''] ?? 'person';
          const iconColor =
            item.role === TripRole.Organizer
              ? colors.warning
              : item.role === TripRole.CoOrganizer
                ? colors.secondary
                : colors.icon;

          return (
            <ListItem
              key={item.id}
              title={name}
              subtitle={roleLabel}
              leading={<Avatar name={name} size="md" />}
              trailing={<Ionicons name={icon} size={18} color={iconColor} />}
              onPress={tappable ? () => setSelectedParticipant(item) : undefined}
              disabled={!tappable}
            />
          );
        })}
      </Stack>

      {selectedParticipant && currentTrip && currentUserId ? (
        <ParticipantActionSheet
          target={selectedParticipant}
          actorUserId={currentUserId}
          actorRole={actorRole ?? ''}
          tripId={currentTrip.id}
          onClose={() => setSelectedParticipant(null)}
        />
      ) : null}
    </>
  );
}
