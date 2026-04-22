import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TripParticipantWithProfile } from '@/services/trip.service';
import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
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

type Props = {
  visible: boolean;
  onClose: () => void;
  participants: TripParticipantWithProfile[];
  isOrganizer: boolean;
};

export function PersonsSheet({ visible, onClose, participants, isOrganizer }: Props) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();

  const sorted = [...participants].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role ?? ''] ?? 2;
    const roleB = ROLE_ORDER[b.role ?? ''] ?? 2;
    if (roleA !== roleB) return roleA - roleB;
    return (a.profile?.user_name ?? '').localeCompare(b.profile?.user_name ?? '');
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderBottomWidth: stroke.thin,
            borderBottomColor: colors.border,
          }}>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle">Persons ({participants.length})</AppText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xl,
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            gap: spacing.xs,
          }}>
          {sorted.map((item) => {
            const name = item.profile?.user_name ?? 'Unknown';
            const roleLabel = item.role ? (ROLE_LABELS[item.role] ?? item.role) : 'Participant';
            const email = item.profile?.email ?? null;
            const phone = item.profile?.phonenumber ?? null;

            return (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: stroke.thin,
                  borderBottomColor: colors.border,
                }}>
                <Avatar name={name} size="md" />

                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <AppText style={{ fontWeight: '600' }}>{name}</AppText>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surfaceMuted,
                      }}>
                      <AppText variant="caption" tone="muted">{roleLabel}</AppText>
                    </View>
                  </View>

                  {isOrganizer && (
                    <View style={{ gap: 2, marginTop: 2 }}>
                      {email ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                          <AppText variant="caption" tone="muted">{email}</AppText>
                        </View>
                      ) : null}
                      {phone ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                          <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                          <AppText variant="caption" tone="muted">{phone}</AppText>
                        </View>
                      ) : null}
                      {!email && !phone ? (
                        <AppText variant="caption" tone="muted">No contact info</AppText>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
