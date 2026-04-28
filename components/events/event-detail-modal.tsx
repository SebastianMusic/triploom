import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { Row } from '@/components/ui/row';
import { useAppTheme } from '@/components/ui/theme-provider';
import { ParticipantsList } from '@/components/trip/participants-list';
import { getEventBannerUrl } from '@/services/events.service';
import type { EventWithCount } from '@/services/events.service';
import { useEventsStore } from '@/store/events.store';
import { useTripStore } from '@/store/trip.store';

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
  onClose,
  onEdit,
  onDelete,
}: {
  event: EventWithCount | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { theme: { colors, spacing, radius, stroke, sizes } } = useAppTheme();
  const { currentParticipant, participantsWithProfiles } = useTripStore();
  const { registerForEvent, unregisterFromEvent } = useEventsStore();

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
  }, [event?.banner_image_url]);

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
      if (isRegistered) unregisterFromEvent(event.id, participantId);
      else registerForEvent(event.id, participantId);
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
            <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' }}>
              <Image source={{ uri: bannerUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}

          {isMandatory && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.warning, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
              <AppText variant="caption" style={{ color: '#fff' }}>Mandatory</AppText>
            </View>
          )}

          {event.description ? <AppText tone="muted">{event.description}</AppText> : null}

          <View style={{ gap: spacing.sm }}>
            {event.location ? (
              <Pressable onPress={() => setLocationVisible(true)}>
                <InfoRow icon="location-outline">
                  <AppText variant="caption" tone="muted">Location</AppText>
                  <AppText tone="primary">{event.location}</AppText>
                </InfoRow>
              </Pressable>
            ) : null}

            <InfoRow icon="time-outline">
              <AppText variant="caption" tone="muted">Start</AppText>
              <AppText>{formatFull(event.start_time)}</AppText>
            </InfoRow>

            <InfoRow icon="flag-outline">
              <AppText variant="caption" tone="muted">End</AppText>
              <AppText>{formatFull(event.end_time)}</AppText>
            </InfoRow>

            {event.price_range ? (
              <InfoRow icon="cash-outline">
                <AppText variant="caption" tone="muted">Price range</AppText>
                <AppText>{event.price_range}</AppText>
              </InfoRow>
            ) : null}
          </View>

          {/* Participants row — navigates to sub-view */}
          <Pressable
            onPress={() => setView('participants')}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.surface,
              borderRadius: radius.md, borderWidth: stroke.thin, borderColor: colors.border,
              paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Row gap="xs">
              <Ionicons name="people-outline" size={sizes.icon.sm} color={colors.textMuted} />
              <AppText variant="caption" style={{ fontWeight: '600' }}>
                {`Participants — ${registeredCount}`}
              </AppText>
            </Row>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <Button
            label={isRegistered ? 'Unregister' : 'Register'}
            variant={isRegistered ? 'secondary' : 'primary'}
            fullWidth
            loading={registering}
            onPress={() => { void handleToggleRegistration(); }}
          />
        </ScrollView>
      )}

      {event.location ? (
        <LocationViewModal
          visible={locationVisible}
          onClose={() => setLocationVisible(false)}
          address={event.location}
        />
      ) : null}
    </PageSheetModal>
  );
}

function InfoRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  const { theme: { colors, spacing } } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <Ionicons name={icon as never} size={20} color={colors.textMuted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
