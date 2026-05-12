import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { ParticipantsList } from '@/components/trip/participants-list';
import type { EventWithCount } from '@/services/events.service';
import { useEventsStore } from '@/store/events.store';
import { useTripStore } from '@/store/trip.store';
import type { Task } from '@/types';

type EventView = 'main' | 'participants';

function formatFull(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function EventDetailModal({
  event,
  relatedTasks = [],
  onClose,
  onEdit,
  onDelete,
  onTaskPress,
}: {
  event: EventWithCount | null;
  relatedTasks?: Task[];
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTaskPress?: (task: Task) => void;
}) {
  const { theme: { colors, radius, spacing, stroke, sizes } } = useAppTheme();
  const { currentParticipant, participantsWithProfiles } = useTripStore();
  const { registerForEvent, unregisterFromEvent, getEventBannerUrl } = useEventsStore();

  const [view, setView] = useState<EventView>('main');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [locationVisible, setLocationVisible] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setView('main');
    setLocationVisible(false);
  }, [event?.id]);

  useEffect(() => {
    if (event?.banner_image_url) {
      getEventBannerUrl(event.banner_image_url).then(setBannerUrl).catch(() => {});
    } else {
      setBannerUrl(null);
    }
  }, [event?.banner_image_url, getEventBannerUrl]);

  if (!event) return null;

  const participantId = currentParticipant?.id;
  const isRegistered = !!participantId && event.event_participation.some((p) => p.participant_id === participantId);
  const registeredCount = event.event_participation.length;
  const isMandatory = event.is_optional === false;
  const registeredIds = new Set(event.event_participation.map((p) => p.participant_id));

  async function handleToggleRegistration() {
    if (!participantId || !event) return;
    setRegistering(true);
    try {
      if (isRegistered) await unregisterFromEvent(event.id, participantId);
      else await registerForEvent(event.id, participantId);
    } finally {
      setRegistering(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  const title = view === 'main' ? (event.title ?? '') : 'Participants';

  return (
    <PageSheetModal
      visible
      title={title}
      onClose={onClose}
      onBack={view === 'participants' ? () => setView('main') : undefined}
      onEdit={view === 'main' ? onEdit : undefined}
      onDelete={view === 'main' && onDelete ? handleDelete : undefined}
    >
      {view === 'participants' ? (
        <ParticipantsList
          participants={participantsWithProfiles.filter((p) => registeredIds.has(p.id))}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {bannerUrl ? (
            <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden' }}>
              <Image source={{ uri: bannerUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}

          <Stack space="sm">
            {isMandatory ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  borderRadius: radius.full,
                  backgroundColor: colors.warning,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 3,
                }}>
                <AppText variant="caption" style={{ color: colors.textOnPrimary, fontWeight: '700' }}>
                  Mandatory
                </AppText>
              </View>
            ) : null}
            {event.description ? (
              <AppText tone="muted">{event.description}</AppText>
            ) : (
              <AppText tone="muted">No description added.</AppText>
            )}
          </Stack>

          <Card style={{ padding: spacing.md }}>
            <Stack space="sm">
              {event.location_label ? (
                <Pressable onPress={() => setLocationVisible(true)}>
                  <InfoRow icon="location-outline" label="Location" value={event.location_label} tone="primary" />
                </Pressable>
              ) : null}
              <InfoRow icon="time-outline" label="Start" value={formatFull(event.start_time)} />
              <InfoRow icon="flag-outline" label="End" value={formatFull(event.end_time)} />
              {event.price_range ? (
                <InfoRow icon="cash-outline" label="Price range" value={event.price_range} />
              ) : null}
            </Stack>
          </Card>

          <Pressable
            onPress={() => setView('participants')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: stroke.thin,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Row gap="xs" align="center">
              <Ionicons name="people-outline" size={sizes.icon.sm} color={colors.primary} />
              <View>
                <AppText style={{ fontWeight: '600' }}>Participants</AppText>
                <AppText variant="caption" tone="muted">
                  {registeredCount} registered
                </AppText>
              </View>
            </Row>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {relatedTasks.length > 0 ? (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
                <AppText style={{ fontWeight: '600' }}>Related tasks</AppText>
              </View>
              {relatedTasks.map((task, index) => (
                <Pressable
                  key={task.id}
                  disabled={!onTaskPress}
                  onPress={() => onTaskPress?.(task)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderTopWidth: index === 0 ? 0 : stroke.thin,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.72 : 1,
                  })}>
                  <Ionicons name="checkbox-outline" size={18} color={colors.primary} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText numberOfLines={1}>{task.title ?? 'Untitled task'}</AppText>
                    {task.due_time ? (
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {formatFull(task.due_time)}
                      </AppText>
                    ) : null}
                  </View>
                  {onTaskPress ? (
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  ) : null}
                </Pressable>
              ))}
            </Card>
          ) : null}

          <Button
            label={isRegistered ? 'Unregister' : 'Register'}
            variant={isRegistered ? 'secondary' : 'primary'}
            fullWidth
            loading={registering}
            onPress={() => { void handleToggleRegistration(); }}
          />
        </ScrollView>
      )}

      {event.location_label ? (
        <LocationViewModal
          visible={locationVisible}
          onClose={() => setLocationVisible(false)}
          label={event.location_label}
          latitude={event.latitude ?? undefined}
          longitude={event.longitude ?? undefined}
        />
      ) : null}
    </PageSheetModal>
  );
}

function InfoRow({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: string;
  label: string;
  value: string;
  tone?: 'default' | 'primary';
}) {
  const { theme: { colors, spacing } } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <Ionicons name={icon as never} size={20} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <AppText variant="caption" tone="muted">{label}</AppText>
        <AppText tone={tone}>{value}</AppText>
      </View>
    </View>
  );
}
