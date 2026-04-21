import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { TripEditForm } from '@/components/trip/trip-edit-form';
import { Card } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type InfoRowProps = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string };

function InfoRow({ icon, label, value }: InfoRowProps) {
  const {
    theme: { colors, spacing, typography },
  } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      <Ionicons name={icon} size={16} color={colors.icon} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <AppText variant="caption" tone="muted" style={typography.caption}>
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

export function TripInfoCard() {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  const currentTrip = useTripStore((s) => s.currentTrip);
  const currentParticipant = useTripStore((s) => s.currentParticipant);

  const [editing, setEditing] = useState(false);

  if (!currentTrip) return null;

  const canEdit =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const dateRange =
    currentTrip.start_date || currentTrip.end_date
      ? `${formatDate(currentTrip.start_date)} – ${formatDate(currentTrip.end_date)}`
      : null;

  if (editing) {
    return <TripEditForm onClose={() => setEditing(false)} />;
  }

  return (
    <Card variant="elevated">
      {currentTrip.banner_image_url ? (
        <Image
          source={{ uri: currentTrip.banner_image_url }}
          style={{
            width: '100%',
            height: 140,
            borderRadius: radius.md,
            marginBottom: spacing.md,
            backgroundColor: colors.surfaceMuted,
          }}
          resizeMode="cover"
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs / 2 }}>
          <AppText variant="subtitle" style={typography.subtitle}>
            {currentTrip.name ?? 'Unnamed trip'}
          </AppText>
          {currentTrip.description ? (
            <AppText tone="muted">{currentTrip.description}</AppText>
          ) : null}
        </View>
        {canEdit ? (
          <IconButton
            icon={<Ionicons name="create-outline" size={20} color={colors.icon} />}
            variant="ghost"
            onPress={() => setEditing(true)}
          />
        ) : null}
      </View>

      {dateRange ? (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <InfoRow icon="calendar-outline" label="Dates" value={dateRange} />
        </View>
      ) : null}
    </Card>
  );
}
