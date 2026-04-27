import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventBannerPicker } from '@/components/events/event-banner-picker';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { createTripSchema, TripEventPermission } from '@/types';

type DateTarget = 'start' | 'end' | null;

function formatDate(date: Date | null): string {
  if (!date) return 'Select date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CreateTripScreen() {
  const insets = useSafeAreaInsets();
  const { createTrip, isLoading } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const {
    theme: { colors, opacity, radius, spacing, stroke, typography },
  } = useAppTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [eventPermission, setEventPermission] = useState<TripEventPermission>(TripEventPermission.All);
  const [pickerTarget, setPickerTarget] = useState<DateTarget>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function openDatePicker(target: DateTarget) {
    setPickerTarget(target);
  }

  function handleDateChange(_event: DateTimePickerEvent, selected?: Date) {
    if (!selected) {
      setPickerTarget(null);
      return;
    }

    if (pickerTarget === 'start') {
      setStartDate(selected);
      setErrors((current) => ({ ...current, start_date: undefined }));
    }

    if (pickerTarget === 'end') {
      setEndDate(selected);
      setErrors((current) => ({ ...current, end_date: undefined }));
    }

    setPickerTarget(null);
  }

  async function handleSubmit() {
    setErrors({});

    if (startDate && endDate && endDate < startDate) {
      setErrors({ end_date: 'End date must be after start date' });
      return;
    }

    const result = createTripSchema.safeParse({
      name: name.trim(),
      description: description.trim() || null,
      start_date: startDate ? startDate.toISOString().slice(0, 10) : null,
      end_date: endDate ? endDate.toISOString().slice(0, 10) : null,
      banner_image_url: bannerUri,
      event_permission: eventPermission,
    });

    if (!result.success) {
      const nextErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    try {
      const trip = await createTrip(result.data);
      await setSelectedTrip(trip.id);
    } catch (error: unknown) {
      Alert.alert(
        'Could not create trip',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }

  const dateFieldStyle = {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: stroke.thin,
    borderColor: colors.transparent,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  };

  const permissionOptions = [
    {
      value: TripEventPermission.All,
      title: 'Everyone',
      description: 'Participants can suggest and publish events.',
      icon: 'people-outline' as const,
    },
    {
      value: TripEventPermission.Organizer,
      title: 'Organizers',
      description: 'Only organizer roles can publish events.',
      icon: 'shield-checkmark-outline' as const,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <Container>
          <Stack space="sm">
            <BackButton />

            <View style={{ gap: spacing.xs }}>
              <AppText style={typography.title}>Trip details</AppText>
            </View>

            <View
              style={{
                borderRadius: radius.xl,
                backgroundColor: colors.surface,
                padding: spacing.sm,
                gap: spacing.sm,
              }}>
          <EventBannerPicker
            label="Banner"
            uri={bannerUri}
            onSelect={setBannerUri}
            onRemove={() => setBannerUri(null)}
          />

          <View style={{ gap: spacing.md }}>
            <Input
              label="Name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
              placeholder="Berlin 2026"
              autoCapitalize="words"
              error={errors.name}
            />

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Short context for the group"
              multiline
              error={errors.description}
            />
          </View>

          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <AppText variant="caption">Start date</AppText>
              <Pressable style={dateFieldStyle} onPress={() => openDatePicker('start')}>
                <AppText
                  numberOfLines={1}
                  style={{ flex: 1, color: startDate ? colors.text : colors.textMuted }}>
                  {formatDate(startDate)}
                </AppText>
                <Ionicons name="calendar-outline" size={18} color={colors.icon} />
              </Pressable>
              {errors.start_date ? <AppText variant="caption" tone="error">{errors.start_date}</AppText> : null}
            </View>

            <View style={{ gap: spacing.xs }}>
              <AppText variant="caption">End date</AppText>
              <Pressable style={dateFieldStyle} onPress={() => openDatePicker('end')}>
                <AppText
                  numberOfLines={1}
                  style={{ flex: 1, color: endDate ? colors.text : colors.textMuted }}>
                  {formatDate(endDate)}
                </AppText>
                <Ionicons name="calendar-outline" size={18} color={colors.icon} />
              </Pressable>
              {errors.end_date ? <AppText variant="caption" tone="error">{errors.end_date}</AppText> : null}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={typography.label}>Event permissions</AppText>
                <AppText variant="caption" tone="muted">
                  Choose who can publish events on this trip.
                </AppText>
              </View>
            </View>

            <View
              style={{
                borderRadius: radius.lg,
                backgroundColor: colors.secondarySoft,
                padding: spacing.xs,
                gap: spacing.xs,
              }}>
              {permissionOptions.map((option) => {
                const selected = eventPermission === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => setEventPermission(option.value)}
                    style={({ pressed }) => ({
                      minHeight: 66,
                      borderRadius: radius.md,
                      backgroundColor: selected ? colors.surface : colors.secondarySoft,
                      padding: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      opacity: pressed ? opacity.pressed : 1,
                    })}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
                      }}>
                      <Ionicons
                        name={option.icon}
                        size={19}
                        color={selected ? colors.primary : colors.icon}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText style={typography.label}>{option.title}</AppText>
                      <AppText variant="caption" tone="muted">
                        {option.description}
                      </AppText>
                    </View>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
            </View>

            <Button
              label="Create trip"
              fullWidth
              loading={isLoading}
              onPress={() => { void handleSubmit(); }}
            />
          </Stack>
        </Container>
      </ScrollView>

      {pickerTarget ? (
        <DateTimePicker
          value={pickerTarget === 'start' ? startDate ?? new Date() : endDate ?? startDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
