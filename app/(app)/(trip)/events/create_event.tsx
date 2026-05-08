import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { AppDateTimePicker, DateTimeField } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { EventLocationInput } from '@/components/events/event-location-input';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { uploadEventBanner } from '@/services/events.service';
import { createEventSchema, TripEventPermission, TripRole } from '@/types';

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

type PickerTarget = 'start' | 'end' | null;

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { headerContentOffset } = useTripChromeInsets();
  const { selectedTrip } = useProfileStore();
  const { currentParticipant, currentTrip } = useTripStore();
  const { createEvent } = useEventsStore();
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [priceRange, setPriceRange] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;
  const canCreateEvent =
    currentTrip?.event_permission !== TripEventPermission.Organizer || isOrganizer;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(useCallback(() => { clearForm(); }, []));

  // Picker state
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  function clearForm() {
    setTitle('');
    setDescription('');
    setLocationLabel('');
    setLocationCoords(null);
    setStartDate(null);
    setEndDate(null);
    setPriceRange('');
    setBannerUri(null);
    setIsMandatory(false);
    setErrors({});
  }

  function openPicker(target: PickerTarget) {
    setPickerTarget(target);
  }

  function commitDate(date: Date) {
    if (pickerTarget === 'start') {
      setStartDate(date);
      setErrors((e) => ({ ...e, start_time: undefined }));
    } else {
      setEndDate(date);
      setErrors((e) => ({ ...e, end_time: undefined }));
    }

    setPickerTarget(null);
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
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
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

    if (endDate <= new Date()) {
      setErrors({ end_time: 'End time must be in the future' });
      return;
    }

    if (!selectedTrip) {
      Alert.alert('Error', 'No active trip found.');
      return;
    }

    if (!canCreateEvent) {
      Alert.alert('Only organizers can create events for this trip.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bannerPath: string | null = null;
      if (bannerUri && currentParticipant?.id) {
        bannerPath = await uploadEventBanner(bannerUri, currentParticipant.id);
      }

      await createEvent({
        title: result.data.title,
        description: result.data.description,
        location_label: result.data.location_label,
        latitude: result.data.latitude ?? null,
        longitude: result.data.longitude ?? null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        price_range: result.data.price_range ?? null,
        trip_id: selectedTrip,
        created_by_id: currentParticipant?.id ?? null,
        is_optional: isOrganizer ? !isMandatory : null,
        banner_image_url: bannerPath,
      });

      clearForm();
      router.replace('/(app)/(trip)/events');
    } catch {
      Alert.alert('Error', 'Could not create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardScreenView
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: insets.bottom + spacing.xl,
      }}>
        <Container>
        <Stack space="sm">
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="subtitle">New Event</AppText>
        </View>

        <EventBannerPicker uri={bannerUri} onSelect={setBannerUri} />

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
          onChangeText={(text) => { setLocationLabel(text); setLocationCoords(null); setErrors((e) => ({ ...e, location_label: undefined })); }}
          onSelectLocation={(loc) => { setLocationLabel(loc.label); setLocationCoords(loc); setErrors((e) => ({ ...e, location_label: undefined })); }}
          error={errors.location_label}
        />

        {/* Start time */}
        <DateTimeField
          label="Start time *"
          value={formatDisplay(startDate)}
          placeholder="Select date and time"
          active={!!startDate}
          error={errors.start_time}
          onPress={() => openPicker('start')}
          onClear={startDate ? () => setStartDate(null) : undefined}
        />

        {/* End time */}
        <DateTimeField
          label="End time *"
          value={formatDisplay(endDate)}
          placeholder="Select date and time"
          active={!!endDate}
          error={errors.end_time}
          onPress={() => openPicker('end')}
          onClear={endDate ? () => setEndDate(null) : undefined}
        />

        <Input
          label="Price range"
          placeholder="e.g. Free, 50–100 kr"
          value={priceRange}
          onChangeText={setPriceRange}
          error={errors.price_range}
        />

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

        <Button
          label="Create Event"
          fullWidth
          loading={isSubmitting}
          onPress={() => { void handleSubmit(); }}
        />
        </Stack>
        </Container>
      <AppDateTimePicker
        visible={pickerTarget !== null}
        value={(pickerTarget === 'start' ? startDate : endDate) ?? new Date()}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={commitDate}
        onClose={() => setPickerTarget(null)}
      />
    </KeyboardScreenView>
  );
}
