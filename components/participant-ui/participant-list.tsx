import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
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

export function ParticipantList() {
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const currentTrip = useTripStore((s) => s.currentTrip);
  const participantsWithProfiles = useTripStore((s) => s.participantsWithProfiles);
  const isLoadingParticipants = useTripStore((s) => s.isLoadingParticipants);
  const fetchParticipants = useTripStore((s) => s.fetchParticipants);

  useEffect(() => {
    if (currentTrip?.id) {
      fetchParticipants(currentTrip.id).catch(() => undefined);
    }
  }, [currentTrip?.id, fetchParticipants]);

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

  return (
    <Stack space="xs">
      {sorted.map((item) => {
        const name = item.profile?.user_name ?? 'Unknown';
        const roleLabel = item.role ? (ROLE_LABELS[item.role] ?? item.role) : 'Participant';

        return (
          <ListItem
            key={item.id}
            title={name}
            subtitle={roleLabel}
            leading={<Avatar name={name} size="md" />}
          />
        );
      })}
    </Stack>
  );
}
