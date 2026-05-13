import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { ListItem } from '@/components/ui/list-item';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import { TripRole } from '@/types/trip.types';

const ROLE_LABELS: Record<TripRole, string | null> = {
  [TripRole.Organizer]: 'Organizer',
  [TripRole.CoOrganizer]: 'Co-organizer',
  [TripRole.Participant]: null,
};

const ROLE_ORDER: Record<TripRole, number> = {
  [TripRole.Organizer]: 0,
  [TripRole.CoOrganizer]: 1,
  [TripRole.Participant]: 2,
};

export function ParticipantsList({
  participants,
  registeredIds,
}: {
  participants: TripParticipantWithProfile[];
  /** When provided, shows a registration status icon per participant. */
  registeredIds?: Set<string>;
}) {
  const { theme: { colors, spacing } } = useAppTheme();

  if (participants.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <AppText tone="muted">No participants</AppText>
      </View>
    );
  }

  const sorted = [...participants].sort((a, b) => {
    const aO = ROLE_ORDER[a.role as TripRole] ?? 2;
    const bO = ROLE_ORDER[b.role as TripRole] ?? 2;
    return aO - bO;
  });

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}>
      {sorted.map((p) => {
        const name = p.profile?.user_name ?? 'Unknown';
        const roleLabel = ROLE_LABELS[p.role as TripRole] ?? null;
        const isRegistered = registeredIds?.has(p.id);

        return (
          <ListItem
            key={p.id}
            title={name}
            subtitle={roleLabel ?? undefined}
            leading={
              <ProfileAvatar
                name={name}
                size="sm"
                userId={p.user_id}
                imageId={p.profile?.profile_picture_url}
              />
            }
            trailing={
              registeredIds !== undefined ? (
                <Ionicons
                  name={isRegistered ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isRegistered ? colors.success : colors.textMuted}
                />
              ) : undefined
            }
          />
        );
      })}
    </ScrollView>
  );
}
