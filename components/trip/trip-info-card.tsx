import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

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
    theme: { colors, radius, spacing, stroke, typography },
  } = useAppTheme();

  const currentTrip = useTripStore((s) => s.currentTrip);
  const currentParticipant = useTripStore((s) => s.currentParticipant);

  const [editing, setEditing] = useState(false);
  const [openingFile, setOpeningFile] = useState(false);

  if (!currentTrip) return null;

  const canEdit =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const dateRange =
    currentTrip.start_date || currentTrip.end_date
      ? `${formatDate(currentTrip.start_date)} – ${formatDate(currentTrip.end_date)}`
      : null;

  const fileUrl = currentTrip.description_file_url;
  const fileName = fileUrl ? (fileUrl.split('/').pop() ?? 'Attachment') : null;

  async function handleOpenFile() {
    if (!fileUrl) return;
    setOpeningFile(true);
    try {
      await WebBrowser.openBrowserAsync(fileUrl);
    } finally {
      setOpeningFile(false);
    }
  }

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

      {fileName ? (
        <Pressable
          onPress={() => { void handleOpenFile(); }}
          disabled={openingFile}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            borderRadius: radius.md,
            borderWidth: stroke.thin,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          })}>
          {openingFile ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="document-outline" size={16} color={colors.primary} />
          )}
          <AppText style={{ flex: 1, fontSize: 13, color: colors.primary }} numberOfLines={1}>
            {fileName}
          </AppText>
          <Ionicons name="open-outline" size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </Card>
  );
}
