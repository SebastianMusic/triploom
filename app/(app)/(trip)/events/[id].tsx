import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { AppDateTimePicker, DateTimeField } from '@/components/ui/date-time-picker';
import { Button } from '@/components/ui/button';
import { EventLocationInput } from '@/components/events/event-location-input';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { EventParticipant, EventWithCount } from '@/services/events.service';
import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { Container } from '@/components/ui/container';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { Stack } from '@/components/ui/stack';
import { createEventSchema, TripRole } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDisplay(date: Date | null): string {
  if (!date) return 'Select date and time';
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFull(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type PickerTarget = 'start' | 'end' | null;
// ─── View screen ─────────────────────────────────────────────────────────────

function ViewEvent({ event, onBack, isCreator, isOrganizer, onEdit, onDelete }: { event: EventWithCount; onBack: () => void; isCreator?: boolean; isOrganizer?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing } } = useAppTheme();
  const { currentParticipant } = useTripStore();
  const { registerForEvent, unregisterFromEvent, getEventBannerUrl, getEventParticipants } = useEventsStore();
  const { getProfileImageUrlByPath } = useProfileStore();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const participantId = currentParticipant?.id;
  const isRegistered = !!participantId && event.event_participation.some(
    (p) => p.participant_id === participantId,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[] | null>(null);
  const [participantAvatarUrls, setParticipantAvatarUrls] = useState<Record<string, string>>({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (event.banner_image_url) {
      getEventBannerUrl(event.banner_image_url).then(setBannerUrl).catch(() => {});
    } else {
      setBannerUrl(null);
    }
  }, [event.banner_image_url]);

  useEffect(() => {
    setEventParticipants(null);
    setParticipantAvatarUrls({});
    setShowParticipants(false);
  }, [event.id]);

  useEffect(() => {
    if (!showParticipants) {
      setEventParticipants(null);
      setParticipantAvatarUrls({});
      return;
    }
    setLoadingParticipants(true);
    getEventParticipants(event.id)
      .then(async (participants) => {
        setEventParticipants(participants);
        const toResolve = participants.filter((p) => p.user_id && p.profile_picture_url);
        const resolved = await Promise.all(
          toResolve.map(async (p) => {
            const url = await getProfileImageUrlByPath(p.user_id!, p.profile_picture_url!);
            return { participant_id: p.participant_id, url };
          }),
        );
        setParticipantAvatarUrls((prev) => {
          const next = { ...prev };
          for (const { participant_id, url } of resolved) {
            if (url) next[participant_id] = url;
          }
          return next;
        });
      })
      .catch(() => setEventParticipants([]))
      .finally(() => setLoadingParticipants(false));
  }, [event.event_participation.length, showParticipants]);

  async function handleToggle() {
    if (!participantId) return;
    setIsLoading(true);
    try {
      if (isRegistered) {
        unregisterFromEvent(event.id, participantId);
      } else {
        registerForEvent(event.id, participantId);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const participantCount = event.event_participation.length;

  function handleToggleParticipants() {
    setShowParticipants((v) => !v);
  }

  function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
    return (
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <Ionicons name={icon as never} size={20} color={colors.textMuted} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }}>
      <Container>
        <Stack space="sm">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={onBack} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          </View>

          {bannerUrl ? (
            <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden' }}>
              <Image source={{ uri: bannerUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}

          <AppText variant="title">{event.title}</AppText>

          {event.description ? (
            <AppText variant="body" tone="muted">{event.description}</AppText>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            {event.location ? (
              <Pressable onPress={() => setLocationModalVisible(true)}>
                <Row icon="location-outline">
                  <AppText variant="caption" tone="muted">Location</AppText>
                  <AppText tone="primary">{event.location}</AppText>
                </Row>
              </Pressable>
            ) : null}

            {event.location ? (
              <LocationViewModal
                visible={locationModalVisible}
                onClose={() => setLocationModalVisible(false)}
                address={event.location}
              />
            ) : null}

            <Row icon="time-outline">
              <AppText variant="caption" tone="muted">Start</AppText>
              <AppText>{formatFull(event.start_time)}</AppText>
            </Row>

            <Row icon="flag-outline">
              <AppText variant="caption" tone="muted">End</AppText>
              <AppText>{formatFull(event.end_time)}</AppText>
            </Row>

            {event.price_range ? (
              <Row icon="cash-outline">
                <AppText variant="caption" tone="muted">Price range</AppText>
                <AppText>{event.price_range}</AppText>
              </Row>
            ) : null}

            <Pressable onPress={() => { void handleToggleParticipants(); }}>
              <Row icon="people-outline">
                <AppText variant="caption" tone="muted">Participants</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <AppText>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</AppText>
                  {participantCount > 0 && (
                    <Ionicons
                      name={showParticipants ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
                    />
                  )}
                </View>
                {showParticipants && (
                  loadingParticipants ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                  ) : (
                    <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
                      {(eventParticipants ?? []).map((p) => {
                        const name = p.user_name ?? 'Unknown';
                        const isEventCreator = p.participant_id === event.created_by_id;
                        return (
                          <View
                            key={p.participant_id}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
                            <Avatar
                              name={name}
                              size="sm"
                              source={participantAvatarUrls[p.participant_id] ? { uri: participantAvatarUrls[p.participant_id] } : undefined}
                            />
                            <AppText style={{ flex: 1 }}>{name}</AppText>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.surfaceMuted }}>
                              <AppText variant="caption" tone="muted">
                                {isEventCreator ? 'Event Organizer' : 'Participant'}
                              </AppText>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )
                )}
              </Row>
            </Pressable>
          </View>

          <Button
            label={isRegistered ? 'Unregister' : 'Register'}
            variant={isRegistered ? 'secondary' : 'primary'}
            fullWidth
            loading={isLoading}
            onPress={() => { void handleToggle(); }}
          />

          {isCreator && onEdit ? (
            <Button label="Edit event" variant="secondary" fullWidth onPress={onEdit} />
          ) : null}

          {isOrganizer && !isCreator && onDelete ? (
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete event',
                  'Are you sure you want to delete this event? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: onDelete },
                  ],
                );
              }}
              style={({ pressed }) => ({
                width: '100%',
                minHeight: 48,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#c0392b' : '#e74c3c',
              })}>
              <AppText style={{ color: '#fff', fontWeight: '600' }}>Delete event</AppText>
            </Pressable>
          ) : null}
        </Stack>
      </Container>
    </ScrollView>
  );
}

// ─── Edit screen ─────────────────────────────────────────────────────────────

function EditEvent({ event, onBack, onDeleteSuccess }: { event: EventWithCount; onBack: () => void; onDeleteSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing } } = useAppTheme();
  const { updateEvent, deleteEvent, getEventBannerUrl, uploadEventBanner } = useEventsStore();
  const { currentParticipant } = useTripStore();

  const isOrganizer = currentParticipant?.role === TripRole.Organizer;

  const [title, setTitle] = useState(event.title ?? '');
  const [description, setDescription] = useState(event.description ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [priceRange, setPriceRange] = useState(event.price_range ?? '');
  const [isMandatory, setIsMandatory] = useState(event.is_optional === false);
  const [bannerLocalUri, setBannerLocalUri] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);

  useEffect(() => {
    if (event.banner_image_url) {
      getEventBannerUrl(event.banner_image_url).then(setExistingBannerUrl).catch(() => {});
    } else {
      setExistingBannerUrl(null);
    }
  }, [event.banner_image_url]);

  function handleRemoveBanner() {
    setBannerRemoved(true);
    setBannerLocalUri(null);
    setExistingBannerUrl(null);
  }


  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(event.start_time ? new Date(event.start_time) : null);
  const [endDate, setEndDate] = useState<Date | null>(event.end_time ? new Date(event.end_time) : null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  async function handleSave() {
    setErrors({});
      const result = createEventSchema.safeParse({
       title, description, location,
      start_time: startDate ? startDate.toISOString() : '',
      end_time: endDate ? endDate.toISOString() : '',
       price_range: priceRange || undefined,
     });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (!startDate || !endDate) {
      setErrors({
        start_time: !startDate ? 'Start time is required' : undefined,
        end_time: !endDate ? 'End time is required' : undefined,
      });
      return;
    }

    if (endDate <= startDate) {
      setErrors({ end_time: 'End time must be after start time' });
      return;
    }

    setIsSubmitting(true);
    try {
      let bannerPath: string | null = bannerRemoved ? null : (event.banner_image_url ?? null);
      if (bannerLocalUri && currentParticipant?.id) {
        bannerPath = await uploadEventBanner(bannerLocalUri, currentParticipant.id);
      }

        await updateEvent(event.id, {
          title: result.data.title,
          description: result.data.description,
          location: result.data.location,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          price_range: result.data.price_range ?? null,
          is_optional: isOrganizer ? !isMandatory : event.is_optional,
          banner_image_url: bannerPath,
      });
      onBack();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDateConfirm(nextDate: Date) {
    if (pickerTarget === 'start') {
      setStartDate(nextDate);
      setErrors((current) => ({ ...current, start_time: undefined }));
    } else if (pickerTarget === 'end') {
      setEndDate(nextDate);
      setErrors((current) => ({ ...current, end_time: undefined }));
    }
    setPickerTarget(null);
  }

  return (
    <KeyboardScreenView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }}>
        <Container>
          <Stack space="sm">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pressable onPress={onBack} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Cancel">
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <AppText variant="subtitle">Edit Event</AppText>
              <View style={{ width: 32 }} />
            </View>

            <EventBannerPicker
              uri={bannerLocalUri ?? existingBannerUrl}
              onSelect={(uri) => { setBannerLocalUri(uri); setBannerRemoved(false); }}
              onRemove={handleRemoveBanner}
            />

            <Input label="Title *" placeholder="Event title" value={title} onChangeText={setTitle} error={errors.title} />
            <Input label="Description *" placeholder="What is this event about?" value={description} onChangeText={setDescription} multiline error={errors.description} />
            <EventLocationInput
              value={location}
              onChangeText={(text) => { setLocation(text); setErrors((e) => ({ ...e, location: undefined })); }}
              error={errors.location}
            />

            <DateTimeField
              label="Start time *"
              value={formatDisplay(startDate)}
              placeholder="Select date and time"
              active={!!startDate}
              error={errors.start_time}
              onPress={() => setPickerTarget('start')}
              onClear={startDate ? () => setStartDate(null) : undefined}
            />

            <DateTimeField
              label="End time *"
              value={formatDisplay(endDate)}
              placeholder="Select date and time"
              active={!!endDate}
              error={errors.end_time}
              onPress={() => setPickerTarget('end')}
              onClear={endDate ? () => setEndDate(null) : undefined}
            />

            <Input label="Price range" placeholder="e.g. Free, 50–100 kr" value={priceRange} onChangeText={setPriceRange} error={errors.price_range} />

            {isOrganizer ? (
              <Pressable
                onPress={() => setIsMandatory((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 6,
                  borderWidth: 2,
                  borderColor: isMandatory ? colors.warning : colors.border,
                  backgroundColor: isMandatory ? colors.warning : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isMandatory ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <AppText>Is mandatory</AppText>
              </Pressable>
            ) : null}

            <Button label="Save changes" fullWidth loading={isSubmitting} onPress={() => { void handleSave(); }} />

            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete event',
                  'Are you sure you want to delete this event? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => { void deleteEvent(event.id).then(() => onDeleteSuccess()); },
                    },
                  ],
                );
              }}
              style={({ pressed }) => ({
                width: '100%',
                minHeight: 48,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#c0392b' : '#e74c3c',
              })}>
              <AppText style={{ color: '#fff', fontWeight: '600' }}>Delete event</AppText>
            </Pressable>
          </Stack>
        </Container>
      <AppDateTimePicker
        visible={pickerTarget !== null}
        value={(pickerTarget === 'start' ? startDate : endDate) ?? new Date()}
        mode="datetime"
        onConfirm={handleDateConfirm}
        onClose={() => setPickerTarget(null)}
      />

    </KeyboardScreenView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EventScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const router = useRouter();
  const { currentParticipant } = useTripStore();
  const { events, deleteEvent, getEvent } = useEventsStore();

  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(edit === '1');
  const { theme: { colors } } = useAppTheme();

  useEffect(() => {
    const cached = events.find((e) => e.id === id);
    if (cached) { setEvent(cached); setLoading(false); return; }

    getEvent(id).then((e) => {
      setEvent(e ? { ...e, event_participation: [], creator: null } : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [events, id]);

  // Keep in sync when store updates (register/unregister, edit)
  useEffect(() => {
    const updated = events.find((e) => e.id === id);
    if (updated) setEvent(updated);
  }, [events, id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText tone="muted">Event not found.</AppText>
      </View>
    );
  }

  const isCreator = !!currentParticipant?.id && event.created_by_id === currentParticipant.id;
  const isOrganizer = currentParticipant?.role === TripRole.Organizer;

  if (isEditing && isCreator) {
    return <EditEvent event={event} onBack={() => edit === '1' ? router.navigate('/(app)/(trip)/events') : setIsEditing(false)} onDeleteSuccess={() => router.navigate('/(app)/(trip)/events')} />;
  }

  return (
    <ViewEvent
      event={event}
      onBack={() => router.navigate('/(app)/(trip)/events')}
      isCreator={isCreator}
      isOrganizer={isOrganizer}
      onEdit={() => setIsEditing(true)}
      onDelete={() => {
        void deleteEvent(event.id).then(() => router.navigate('/(app)/(trip)/events'));
      }}
    />
  );
}
