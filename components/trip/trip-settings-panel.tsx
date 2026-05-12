import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { Container } from '@/components/ui/container';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { TripEditForm } from '@/components/trip/trip-edit-form';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';

type TripSettingsPanelProps = {
  onClose?: () => void;
  contentInsetBottom?: number;
};

export function TripSettingsPanel({ onClose, contentInsetBottom = 0 }: TripSettingsPanelProps) {
  const router = useRouter();
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const {
    deleteTrip,
    currentParticipant,
    currentTrip,
  } = useTripStore();

  const canManage =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;
  const canDeleteTrip = currentParticipant?.role === TripRole.Organizer;

  function handleDeleteTrip() {
    if (!currentTrip) return;
    confirmDestructiveAction({
      title: 'Delete trip',
      message: `Delete "${currentTrip.name ?? 'this trip'}"? This cannot be undone.`,
      onConfirm: async () => {
        await deleteTrip(currentTrip.id);
        await useProfileStore.getState().setSelectedTrip(null);
        onClose?.();
        router.replace('/(app)/(no-trip)');
      },
    });
  }

  if (!canManage) {
    return (
      <View style={{ padding: spacing.md }}>
        <AppText tone="muted">Only organizers can edit trip settings.</AppText>
      </View>
    );
  }

  return (
    <KeyboardScreenView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: spacing.md,
        paddingBottom: Math.max(spacing.xl, contentInsetBottom + spacing.md),
      }}>
      <Container>
        <Stack space="sm">
          <TripEditForm onClose={onClose} />

          {canDeleteTrip ? (
            <View
              style={{
                marginTop: spacing.lg,
                paddingTop: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}>
              <Button
                label="Delete trip"
                variant="destructive"
                fullWidth
                onPress={handleDeleteTrip}
              />
            </View>
          ) : null}
        </Stack>
      </Container>
    </KeyboardScreenView>
  );
}
