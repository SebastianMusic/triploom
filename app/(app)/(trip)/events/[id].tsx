import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { EventLocationInput } from '@/components/events/event-location-input';
import { Input } from '@/components/ui/input';
import { LocationViewModal } from '@/components/ui/location-view-modal';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getEvent, getEventBannerUrl, uploadEventBanner } from '@/services/events.service';
import type { EventWithCount } from '@/services/events.service';
import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { useEventsStore } from '@/store/events.store';
import { useTripStore } from '@/store/trip.store';
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

// ─── Date picker hook ────────────────────────────────────────────────────────

type PickerTarget = 'start' | 'end' | null;
type PickerMode = 'date' | 'time';

function useDatePicker(initial: { start: Date | null; end: Date | null }) {
  const [startDate, setStartDate] = useState<Date | null>(initial.start);
  const [endDate, setEndDate] = useState<Date | null>(initial.end);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  function openPicker(target: PickerTarget) {
    const current = target === 'start' ? startDate : endDate;
    setTempDate(current ?? new Date());
    setPickerMode('date');
    setPickerTarget(target);
  }

  function commitDate(date: Date) {
    if (pickerTarget === 'start') setStartDate(date);
    else setEndDate(date);
  }

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (!selected) { setPickerTarget(null); return; }
    if (Platform.OS === 'android') {
      if (pickerMode === 'date') { setTempDate(selected); setPickerMode('time'); }
      else {
        const combined = new Date(tempDate);
        combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        commitDate(combined);
        setPickerTarget(null);
      }
    } else {
      setTempDate(selected);
    }
  }

  function handleIOSDone() {
    if (pickerMode === 'date') { setPickerMode('time'); }
    else { commitDate(tempDate); setPickerTarget(null); }
  }

  return { startDate, endDate, pickerTarget, pickerMode, tempDate, openPicker, handleChange, handleIOSDone, setPickerTarget };
}

// ─── DatePickerOverlay ───────────────────────────────────────────────────────

function DatePickerOverlay({
  pickerTarget, pickerMode, tempDate, onClose, onChange, onIOSDone, insetBottom, colors, radius, spacing,
}: {
  pickerTarget: PickerTarget; pickerMode: PickerMode; tempDate: Date;
  onClose: () => void; onChange: (_e: DateTimePickerEvent, d?: Date) => void;
  onIOSDone: () => void; insetBottom: number;
  colors: ReturnType<typeof useAppTheme>['theme']['colors'];
  radius: ReturnType<typeof useAppTheme>['theme']['radius'];
  spacing: ReturnType<typeof useAppTheme>['theme']['spacing'];
}) {
  if (pickerTarget === null) return null;
  if (Platform.OS === 'android') {
    return <DateTimePicker value={tempDate} mode={pickerMode} display="default" onChange={onChange} />;
  }
  return (
    <>
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
        onPress={onClose}
      />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insetBottom }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
          <Pressable onPress={onClose}><AppText tone="primary">Cancel</AppText></Pressable>
          <AppText variant="subtitle">{pickerMode === 'date' ? 'Select date' : 'Select time'}</AppText>
          <Pressable onPress={onIOSDone}><AppText tone="primary">{pickerMode === 'date' ? 'Next' : 'Done'}</AppText></Pressable>
        </View>
        <DateTimePicker value={tempDate} mode={pickerMode} display="spinner" onChange={onChange} style={{ height: 200 }} />
      </View>
    </>
  );
}

// ─── View screen ─────────────────────────────────────────────────────────────

function ViewEvent({ event, onBack, isCreator, isOrganizer, onEdit, onDelete }: { event: EventWithCount; onBack: () => void; isCreator?: boolean; isOrganizer?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, layout, spacing } } = useAppTheme();
  const { currentParticipant } = useTripStore();
  const { registerForEvent, unregisterFromEvent } = useEventsStore();
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const participantId = currentParticipant?.id;
  const isRegistered = !!participantId && event.event_participation.some(
    (p) => p.participant_id === participantId,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (event.banner_image_url) {
      getEventBannerUrl(event.banner_image_url).then(setBannerUrl).catch(() => {});
    } else {
      setBannerUrl(null);
    }
  }, [event.banner_image_url]);

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

  function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
    return (
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <Ionicons name={icon as never} size={20} color={colors.textMuted} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: layout.screenPadding, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
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

        <Row icon="people-outline">
          <AppText variant="caption" tone="muted">Participants</AppText>
          <AppText>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</AppText>
        </Row>
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
    </ScrollView>
  );
}

// ─── Edit screen ─────────────────────────────────────────────────────────────

function EditEvent({ event, onBack, onDeleteSuccess }: { event: EventWithCount; onBack: () => void; onDeleteSuccess: () => void }) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, layout, radius, spacing, stroke } } = useAppTheme();
  const { updateEvent, deleteEvent } = useEventsStore();
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

  const picker = useDatePicker({
    start: event.start_time ? new Date(event.start_time) : null,
    end: event.end_time ? new Date(event.end_time) : null,
  });

  const dateFieldStyle = {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: stroke.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - spacing.xs / 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  };

  async function handleSave() {
    setErrors({});
    const result = createEventSchema.safeParse({
      title, description, location,
      start_time: picker.startDate ? picker.startDate.toISOString() : '',
      end_time: picker.endDate ? picker.endDate.toISOString() : '',
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

    if (!picker.startDate || !picker.endDate) {
      setErrors({
        start_time: !picker.startDate ? 'Start time is required' : undefined,
        end_time: !picker.endDate ? 'End time is required' : undefined,
      });
      return;
    }

    if (picker.endDate <= picker.startDate) {
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
        start_time: picker.startDate.toISOString(),
        end_time: picker.endDate.toISOString(),
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: layout.screenPadding, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
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

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption">Start time *</AppText>
          <Pressable style={dateFieldStyle} onPress={() => picker.openPicker('start')}>
            <AppText style={{ color: picker.startDate ? colors.text : colors.textMuted }}>{formatDisplay(picker.startDate)}</AppText>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          </Pressable>
          {errors.start_time ? <AppText variant="caption" tone="error">{errors.start_time}</AppText> : null}
        </View>

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption">End time *</AppText>
          <Pressable style={dateFieldStyle} onPress={() => picker.openPicker('end')}>
            <AppText style={{ color: picker.endDate ? colors.text : colors.textMuted }}>{formatDisplay(picker.endDate)}</AppText>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          </Pressable>
          {errors.end_time ? <AppText variant="caption" tone="error">{errors.end_time}</AppText> : null}
        </View>

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
      </ScrollView>

      <DatePickerOverlay
        pickerTarget={picker.pickerTarget}
        pickerMode={picker.pickerMode}
        tempDate={picker.tempDate}
        onClose={() => picker.setPickerTarget(null)}
        onChange={picker.handleChange}
        onIOSDone={picker.handleIOSDone}
        insetBottom={insets.bottom}
        colors={colors}
        radius={radius}
        spacing={spacing}
      />

    </KeyboardAvoidingView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentParticipant } = useTripStore();
  const { events, deleteEvent } = useEventsStore();

  const [event, setEvent] = useState<EventWithCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { theme: { colors } } = useAppTheme();

  useEffect(() => {
    const cached = events.find((e) => e.id === id);
    if (cached) { setEvent(cached); setLoading(false); return; }

    getEvent(id).then((e) => {
      setEvent(e ? { ...e, event_participation: [], creator: null } : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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
    return <EditEvent event={event} onBack={() => setIsEditing(false)} onDeleteSuccess={() => router.navigate('/(app)/(trip)/events')} />;
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
