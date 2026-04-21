import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppTheme } from '@/components/ui/theme-provider';
import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { LocationMapPicker } from '@/components/events/location-map-picker';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { uploadEventBanner } from '@/services/events.service';
import { createEventSchema, TripRole } from '@/types';

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
type PickerMode = 'date' | 'time';

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useProfileStore();
  const { currentParticipant } = useTripStore();
  const { createEvent } = useEventsStore();
  const {
    theme: { colors, layout, radius, spacing, stroke },
  } = useAppTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [priceRange, setPriceRange] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const isOrganizer = currentParticipant?.role === TripRole.Organizer;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker state
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('date');
  // Temp date while picking on iOS (committed on "Done")
  const [tempDate, setTempDate] = useState<Date>(new Date());

  function openPicker(target: PickerTarget) {
    const current = target === 'start' ? startDate : endDate;
    setTempDate(current ?? new Date());
    setPickerMode('date');
    setPickerTarget(target);
  }

  function handlePickerChange(_event: DateTimePickerEvent, selected?: Date) {
    if (!selected) {
      // Android: dismissed
      setPickerTarget(null);
      return;
    }

    if (Platform.OS === 'android') {
      if (pickerMode === 'date') {
        // Keep the selected date, now open time picker
        setTempDate(selected);
        setPickerMode('time');
      } else {
        // Combine date from tempDate with time from selected
        const combined = new Date(tempDate);
        combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        commitDate(combined);
        setPickerTarget(null);
      }
    } else {
      // iOS: just update tempDate, commit on "Done"
      setTempDate(selected);
    }
  }

  function commitDate(date: Date) {
    if (pickerTarget === 'start') {
      setStartDate(date);
      setErrors((e) => ({ ...e, start_time: undefined }));
    } else {
      setEndDate(date);
      setErrors((e) => ({ ...e, end_time: undefined }));
    }
  }

  function handleIOSDone() {
    if (pickerMode === 'date') {
      setPickerMode('time');
    } else {
      commitDate(tempDate);
      setPickerTarget(null);
    }
  }

  async function handleSubmit() {
    setErrors({});

    const result = createEventSchema.safeParse({
      title,
      description,
      location,
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

    if (!selectedTrip) {
      Alert.alert('Error', 'No active trip found.');
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
        location: result.data.location,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        price_range: result.data.price_range ?? null,
        trip_id: selectedTrip,
        created_by_id: currentParticipant?.id ?? null,
        is_optional: isOrganizer ? !isMandatory : null,
        banner_image_url: bannerPath,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

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

  const showPicker = pickerTarget !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.md,
        }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: spacing.xs / 2 }}
            accessibilityLabel="Cancel">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle">New Event</AppText>
          <View style={{ width: 32 }} />
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

        <Input
          label="Location *"
          placeholder="Where is it?"
          value={location}
          onChangeText={setLocation}
          error={errors.location}
          rightElement={
            <Pressable
              onPress={() => setMapVisible(true)}
              style={{ paddingHorizontal: spacing.sm }}
              accessibilityLabel="Pick location on map">
              <Ionicons name="map-outline" size={20} color={colors.textMuted} />
            </Pressable>
          }
        />

        <LocationMapPicker
          visible={mapVisible}
          onClose={() => setMapVisible(false)}
          onSelectLocation={(address) => {
            setLocation(address);
            setErrors((e) => ({ ...e, location: undefined }));
          }}
        />

        {/* Start time */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption">Start time *</AppText>
          <Pressable style={dateFieldStyle} onPress={() => openPicker('start')}>
            <AppText style={{ color: startDate ? colors.text : colors.textMuted }}>
              {formatDisplay(startDate)}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          </Pressable>
          {errors.start_time ? (
            <AppText variant="caption" tone="error">{errors.start_time}</AppText>
          ) : null}
        </View>

        {/* End time */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption">End time *</AppText>
          <Pressable style={dateFieldStyle} onPress={() => openPicker('end')}>
            <AppText style={{ color: endDate ? colors.text : colors.textMuted }}>
              {formatDisplay(endDate)}
            </AppText>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          </Pressable>
          {errors.end_time ? (
            <AppText variant="caption" tone="error">{errors.end_time}</AppText>
          ) : null}
        </View>

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
      </ScrollView>

      {/* Android: picker renders directly (it's a native dialog) */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={pickerMode}
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* iOS: picker in a modal sheet */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setPickerTarget(null)}>
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
            onPress={() => setPickerTarget(null)}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingBottom: insets.bottom,
            }}>
            {/* Modal header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.md,
                paddingTop: spacing.sm,
                paddingBottom: spacing.xs,
              }}>
              <Pressable onPress={() => setPickerTarget(null)}>
                <AppText tone="primary">Cancel</AppText>
              </Pressable>
              <AppText variant="subtitle">
                {pickerMode === 'date' ? 'Select date' : 'Select time'}
              </AppText>
              <Pressable onPress={handleIOSDone}>
                <AppText tone="primary">
                  {pickerMode === 'date' ? 'Next' : 'Done'}
                </AppText>
              </Pressable>
            </View>

            <DateTimePicker
              value={tempDate}
              mode={pickerMode}
              display="spinner"
              onChange={handlePickerChange}
              style={{ height: 200 }}
            />
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}
