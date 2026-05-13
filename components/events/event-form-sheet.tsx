import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';

import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { EventLocationInput } from '@/components/events/event-location-input';
import { Button } from '@/components/ui/button';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { AppDateTimePicker, DateTimeField } from '@/components/ui/date-time-picker';
import { DestructiveFormFooter } from '@/components/ui/destructive-form-footer';
import { Input } from '@/components/ui/input';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { EventWithCount } from '@/services/events.service';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { createEventSchema, TripEventPermission, TripRole } from '@/types';

type EventFormMode = 'create' | 'edit';
type PickerTarget = 'start' | 'end' | null;

type EventFormSheetProps = {
  visible: boolean;
  mode: EventFormMode;
  event?: EventWithCount | null;
  onClose: () => void;
  onSaved?: (event?: EventWithCount) => void;
  onDeleted?: () => void;
};

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

export function EventFormSheet({
  visible,
  mode,
  event,
  onClose,
  onSaved,
  onDeleted,
}: EventFormSheetProps) {
  const { selectedTrip } = useProfileStore();
  const { currentParticipant, currentTrip } = useTripStore();
  const { createEvent, updateEvent, deleteEvent, getEventBannerUrl, uploadEventBanner } = useEventsStore();
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const isEdit = mode === 'edit';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [priceRange, setPriceRange] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [bannerLocalUri, setBannerLocalUri] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [bannerRemoved, setBannerRemoved] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;
  const canCreateEvent =
    currentTrip?.event_permission !== TripEventPermission.Organizer || isOrganizer;

  useEffect(() => {
    if (!visible) return;

    setTitle(isEdit ? event?.title ?? '' : '');
    setDescription(isEdit ? event?.description ?? '' : '');
    setLocationLabel(isEdit ? event?.location_label ?? '' : '');
    setLocationCoords(
      isEdit && event?.latitude != null && event?.longitude != null
        ? { latitude: event.latitude, longitude: event.longitude }
        : null,
    );
    setStartDate(isEdit && event?.start_time ? new Date(event.start_time) : null);
    setEndDate(isEdit && event?.end_time ? new Date(event.end_time) : null);
    setPriceRange(isEdit ? event?.price_range ?? '' : '');
    setIsMandatory(isEdit ? event?.is_optional === false : false);
    setBannerLocalUri(null);
    setBannerRemoved(false);
    setPickerTarget(null);
    setErrors({});
  }, [
    event?.description,
    event?.end_time,
    event?.id,
    event?.is_optional,
    event?.latitude,
    event?.location_label,
    event?.longitude,
    event?.price_range,
    event?.start_time,
    event?.title,
    isEdit,
    visible,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!visible || !isEdit || !event?.banner_image_url || bannerRemoved) {
      setExistingBannerUrl(null);
      return undefined;
    }

    getEventBannerUrl(event.banner_image_url)
      .then((url) => {
        if (!cancelled) setExistingBannerUrl(url);
      })
      .catch(() => {
        if (!cancelled) setExistingBannerUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [bannerRemoved, event?.banner_image_url, getEventBannerUrl, isEdit, visible]);

  function commitDate(date: Date) {
    if (pickerTarget === 'start') {
      setStartDate(date);
      setErrors((current) => ({ ...current, start_time: undefined }));
    } else if (pickerTarget === 'end') {
      setEndDate(date);
      setErrors((current) => ({ ...current, end_time: undefined }));
    }
    setPickerTarget(null);
  }

  function handleRemoveBanner() {
    setBannerRemoved(true);
    setBannerLocalUri(null);
    setExistingBannerUrl(null);
  }

  async function handleSubmit() {
    setErrors({});

    const result = createEventSchema.safeParse({
      title,
      description,
      location_label: locationLabel,
      latitude: locationCoords?.latitude ?? null,
      longitude: locationCoords?.longitude ?? null,
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

    if (!isEdit && endDate <= new Date()) {
      setErrors({ end_time: 'End time must be in the future' });
      return;
    }

    if (!isEdit && !selectedTrip) {
      Alert.alert('Error', 'No active trip found.');
      return;
    }

    if (!isEdit && !canCreateEvent) {
      Alert.alert('Only organizers can create events for this trip.');
      return;
    }

    if (isEdit && !event) return;

    setIsSubmitting(true);
    try {
      let bannerPath: string | null = isEdit ? event?.banner_image_url ?? null : null;
      if (bannerRemoved) {
        bannerPath = null;
      }
      if (bannerLocalUri && currentParticipant?.id) {
        bannerPath = await uploadEventBanner(bannerLocalUri, currentParticipant.id);
      }

      if (isEdit && event) {
        await updateEvent(event.id, {
          title: result.data.title,
          description: result.data.description,
          location_label: result.data.location_label,
          latitude: result.data.latitude ?? null,
          longitude: result.data.longitude ?? null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          price_range: result.data.price_range ?? null,
          is_optional: isOrganizer ? !isMandatory : event.is_optional,
          banner_image_url: bannerPath,
        });
        onSaved?.(event);
      } else {
        const created = await createEvent({
          title: result.data.title,
          description: result.data.description,
          location_label: result.data.location_label,
          latitude: result.data.latitude ?? null,
          longitude: result.data.longitude ?? null,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          price_range: result.data.price_range ?? null,
          trip_id: selectedTrip!,
          created_by_id: currentParticipant?.id ?? null,
          is_optional: isOrganizer ? !isMandatory : null,
          banner_image_url: bannerPath,
        });
        onSaved?.(created);
      }
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDelete() {
    if (!event) return;
    confirmDestructiveAction({
      title: 'Delete event',
      message: 'Are you sure you want to delete this event? This cannot be undone.',
      onConfirm: async () => {
        await deleteEvent(event.id);
        onDeleted?.();
        onClose();
      },
    });
  }

  if (!visible || (isEdit && !event)) return null;

  const bannerUri = bannerLocalUri ?? existingBannerUrl;

  return (
    <PageSheetModal
      visible={visible}
      title={isEdit ? 'Edit event' : 'New event'}
      onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm }}>
          <Stack space="sm">
            <EventBannerPicker
              uri={bannerUri}
              onSelect={(uri) => {
                setBannerLocalUri(uri);
                setBannerRemoved(false);
              }}
              onRemove={bannerUri ? handleRemoveBanner : undefined}
            />

            <Input
              label="Title *"
              placeholder="Event title"
              value={title}
              onChangeText={setTitle}
              error={errors.title}
            />

            <Input
              label="Description *"
              placeholder="What is this event about?"
              value={description}
              onChangeText={setDescription}
              multiline
              error={errors.description}
            />

            <EventLocationInput
              value={locationLabel}
              onChangeText={(text) => {
                setLocationLabel(text);
                setLocationCoords(null);
                setErrors((current) => ({ ...current, location_label: undefined }));
              }}
              onSelectLocation={(loc) => {
                setLocationLabel(loc.label);
                setLocationCoords(loc);
                setErrors((current) => ({ ...current, location_label: undefined }));
              }}
              error={errors.location_label}
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

            <Input
              label="Price range"
              placeholder="e.g. Free, 50-100 kr"
              value={priceRange}
              onChangeText={setPriceRange}
              error={errors.price_range}
            />

            {isOrganizer ? (
              <Pressable
                onPress={() => setIsMandatory((current) => !current)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isMandatory ? colors.warning : colors.border,
                    backgroundColor: isMandatory ? colors.warning : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {isMandatory ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
                </View>
                <AppText>Mandatory event</AppText>
              </Pressable>
            ) : null}

            <Button
              label={isEdit ? 'Save changes' : 'Create event'}
              fullWidth
              loading={isSubmitting}
              onPress={() => {
                void handleSubmit();
              }}
            />

            {isEdit ? (
              <DestructiveFormFooter
                label="Delete event"
                onPress={handleDelete}
              />
            ) : null}
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppDateTimePicker
        visible={pickerTarget !== null}
        value={(pickerTarget === 'start' ? startDate : endDate) ?? new Date()}
        mode="datetime"
        minimumDate={!isEdit ? new Date() : undefined}
        onConfirm={commitDate}
        onClose={() => setPickerTarget(null)}
      />
    </PageSheetModal>
  );
}
