import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

type Props = {
  onClose?: () => void;
};

export function TripEditForm({ onClose }: Props) {
  const {
    theme: { colors, spacing, typography },
  } = useAppTheme();

  const currentTrip = useTripStore((s) => s.currentTrip);
  const currentParticipant = useTripStore((s) => s.currentParticipant);
  const updateTrip = useTripStore((s) => s.updateTrip);

  const canEdit =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const [name, setName] = useState(currentTrip?.name ?? '');
  const [description, setDescription] = useState(currentTrip?.description ?? '');
  const [startDate, setStartDate] = useState(currentTrip?.start_date ?? '');
  const [endDate, setEndDate] = useState(currentTrip?.end_date ?? '');
  const [fileUrl, setFileUrl] = useState(currentTrip?.description_file_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentTrip || !canEdit) return null;

  async function handleSave() {
    if (!currentTrip) return;
    if (!name.trim()) {
      setError('Trip name is required.');
      return;
    }

    const trimmedUrl = fileUrl.trim();
    if (trimmedUrl && !trimmedUrl.startsWith('http')) {
      setError('Attachment link must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateTrip(currentTrip.id, {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        description_file_url: trimmedUrl || null,
      });
      onClose?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card variant="elevated">
      <View style={{ gap: spacing.md }}>
        <AppText variant="subtitle" style={typography.subtitle}>
          Edit trip
        </AppText>

        <Stack space="md">
          <Input
            label="Trip name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Summer in Barcelona"
            autoCorrect={false}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What's this trip about?"
            multiline
          />

          <Input
            label="Attachment link"
            value={fileUrl}
            onChangeText={setFileUrl}
            placeholder="https://drive.google.com/..."
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="url"
            rightElement={
              fileUrl ? (
                <Ionicons name="close-circle" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} onPress={() => setFileUrl('')} />
              ) : (
                <Ionicons name="link-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
              )
            }
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Start date"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="End date"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
        </Stack>

        {error ? (
          <AppText variant="caption" tone="error">
            {error}
          </AppText>
        ) : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {onClose ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel"
                variant="secondary"
                fullWidth
                disabled={isSaving}
                onPress={onClose}
              />
            </View>
          ) : null}
          <View style={{ flex: onClose ? 1 : undefined, minWidth: onClose ? undefined : 120 }}>
            <Button
              label="Save"
              variant="primary"
              fullWidth={!!onClose}
              loading={isSaving}
              onPress={() => { void handleSave(); }}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}
