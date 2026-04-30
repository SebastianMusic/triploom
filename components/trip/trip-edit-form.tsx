import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { Button } from '@/components/ui/button';
import { AppDateTimePicker, DateTimeField } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TripSummaryPreviewCard } from '@/components/trip/trip-summary-preview-card';
import { useTripStore } from '@/store/trip.store';
import { TripEventPermission, TripRole } from '@/types';

type Props = {
  onClose?: () => void;
};

type DateTarget = 'start' | 'end' | null;
type BannerModal = 'none' | 'menu' | 'camera' | 'view';

function formatDate(date: Date | null): string {
  if (!date) return 'Select date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  const start = startDate ? formatDate(startDate) : null;
  const end = endDate ? formatDate(endDate) : null;
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return 'No dates yet';
}

function formatActionDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNextActionPreview(action: { type: 'event' | 'task'; title: string; at: string } | null | undefined) {
  if (!action) {
    return {
      label: 'Nothing scheduled yet',
      meta: null,
    };
  }

  const at = formatActionDateTime(action.at);
  return {
    label: action.title,
    meta: `${action.type === 'event' ? 'Event' : 'Task'}${at ? ` · ${at}` : ''}`,
  };
}

export function TripEditForm({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const {
    mode,
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();

  const currentTrip = useTripStore((s) => s.currentTrip);
  const currentParticipant = useTripStore((s) => s.currentParticipant);
  const tripNextActions = useTripStore((s) => s.tripNextActions);
  const updateTrip = useTripStore((s) => s.updateTrip);
  const getTripBannerUrl = useTripStore((s) => s.getTripBannerUrl);
  const uploadTripBanner = useTripStore((s) => s.uploadTripBanner);

  const canEdit =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const [name, setName] = useState(currentTrip?.name ?? '');
  const [description, setDescription] = useState(currentTrip?.description ?? '');
  const [fileUrl, setFileUrl] = useState(currentTrip?.description_file_url ?? '');
  const [startDate, setStartDate] = useState<Date | null>(
    currentTrip?.start_date ? new Date(currentTrip.start_date) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    currentTrip?.end_date ? new Date(currentTrip.end_date) : null,
  );
  const [bannerUri, setBannerUri] = useState(currentTrip?.banner_image_url ?? null);
  const [displayBannerUri, setDisplayBannerUri] = useState<string | null>(null);

  useEffect(() => {
    if (!bannerUri) { setDisplayBannerUri(null); return; }
    if (bannerUri.startsWith('http') || bannerUri.startsWith('file://') || bannerUri.startsWith('content://')) {
      setDisplayBannerUri(bannerUri);
      return;
    }
    getTripBannerUrl(bannerUri).then(setDisplayBannerUri).catch(() => setDisplayBannerUri(null));
  }, [bannerUri]);
  const [eventPermission, setEventPermission] = useState<TripEventPermission>(
    currentTrip?.event_permission === TripEventPermission.Organizer
      ? TripEventPermission.Organizer
      : TripEventPermission.All,
  );
  const [pickerTarget, setPickerTarget] = useState<DateTarget>(null);
  const [bannerModal, setBannerModal] = useState<BannerModal>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentTrip || !canEdit) return null;

  const permissionOptions = [
    {
      value: TripEventPermission.All,
      title: 'Everyone can add events',
      description: 'Best for collaborative planning where all participants can publish.',
      icon: 'people-outline' as const,
    },
    {
      value: TripEventPermission.Organizer,
      title: 'Only organizers can add events',
      description: 'Keeps the itinerary curated by organizer roles only.',
      icon: 'shield-checkmark-outline' as const,
    },
  ];
  const actionPreview = currentTrip
    ? getNextActionPreview(tripNextActions[currentTrip.id])
    : { label: 'Nothing scheduled yet', meta: null };

  async function handlePickFromLibrary() {
    setBannerModal('none');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBannerUri(result.assets[0].uri);
    }
  }

  function handleRemoveBanner() {
    if (!bannerUri) return;

    Alert.alert('Remove trip photo', 'Are you sure you want to remove this trip photo?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setBannerUri(null);
          setBannerModal('none');
        },
      },
    ]);
  }

  function handleDateChange(selected: Date) {
    if (pickerTarget === 'start') {
      setStartDate(selected);
    }

    if (pickerTarget === 'end') {
      setEndDate(selected);
    }

    setPickerTarget(null);
    setError(null);
  }

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

    if (startDate && endDate && endDate < startDate) {
      setError('End date must be after start date.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let finalBannerPath: string | null = bannerUri;
      if (bannerUri && (bannerUri.startsWith('file://') || bannerUri.startsWith('content://'))) {
        finalBannerPath = await uploadTripBanner(bannerUri, currentTrip.id);
      }

      await updateTrip(currentTrip.id, {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate ? startDate.toISOString().slice(0, 10) : null,
        end_date: endDate ? endDate.toISOString().slice(0, 10) : null,
        banner_image_url: finalBannerPath,
        event_permission: eventPermission,
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
    <>
      <Modal
        visible={bannerModal === 'camera'}
        animationType="slide"
        onRequestClose={() => setBannerModal('none')}>
        <GeneralCamera
          onPhotoTaken={(uri) => {
            setBannerUri(uri);
            setBannerModal('none');
          }}
          onClose={() => setBannerModal('none')}
        />
      </Modal>

      <Modal
        visible={bannerModal === 'view' && !!bannerUri}
        animationType="fade"
        onRequestClose={() => setBannerModal('none')}>
        <View
          style={{
            flex: 1,
            backgroundColor: mode === 'dark' ? colors.background : colors.text,
            justifyContent: 'center',
          }}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          ) : null}
          <Pressable
            style={({ pressed }) => ({
              position: 'absolute',
              top: insets.top + spacing.sm,
              right: spacing.md,
              width: 44,
              height: 44,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.overlay,
              opacity: pressed ? opacity.pressed : 1,
            })}
            onPress={() => setBannerModal('none')}
            hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </Modal>

      <View style={{ gap: spacing.lg }}>
        <PreviewCard
          name={name}
          bannerUri={displayBannerUri}
          dateLabel={formatDateRange(startDate, endDate)}
          highlight={actionPreview.label}
          meta={actionPreview.meta}
          roleLabel={
            currentParticipant?.role === TripRole.Participant ? 'Participant' : 'Organizer'
          }
          onPress={() => setBannerModal('menu')}
        />

        <View
          style={[
            {
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              padding: spacing.md,
              gap: spacing.lg,
            },
            shadows.sm,
          ]}>
          <View style={{ gap: spacing.md }}>
            <Input
              label="Trip name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError(null);
              }}
              placeholder="e.g. Summer in Barcelona"
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Input
              label="Description"
              value={description}
              onChangeText={(value) => {
                setDescription(value);
                setError(null);
              }}
              placeholder="What kind of trip is this?"
              multiline
            />

            <Input
              label="Attachment link"
              value={fileUrl}
              onChangeText={(value) => {
                setFileUrl(value);
                setError(null);
              }}
              placeholder="https://drive.google.com/..."
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="url"
              rightElement={
                fileUrl ? (
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textMuted}
                    style={{ marginRight: spacing.sm }}
                    onPress={() => {
                      setFileUrl('');
                      setError(null);
                    }}
                  />
                ) : (
                  <Ionicons
                    name="link-outline"
                    size={18}
                    color={colors.textMuted}
                    style={{ marginRight: spacing.sm }}
                  />
                )
              }
            />
          </View>

            <View style={{ gap: spacing.md }}>
              <AppText style={typography.label}>Dates</AppText>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <DateTimeField
                    label="Start date"
                    value={formatDate(startDate)}
                    placeholder="Select date"
                    active={!!startDate}
                    onPress={() => setPickerTarget('start')}
                    onClear={startDate ? () => setStartDate(null) : undefined}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateTimeField
                    label="End date"
                    value={formatDate(endDate)}
                    placeholder="Select date"
                    active={!!endDate}
                    onPress={() => setPickerTarget('end')}
                    onClear={endDate ? () => setEndDate(null) : undefined}
                  />
                </View>
              </View>
            </View>

          <View style={{ gap: spacing.md }}>
            <View style={{ gap: 4 }}>
              <AppText style={typography.label}>Event permissions</AppText>
              <AppText variant="caption" tone="muted">
                Decide who is allowed to publish events for this trip.
              </AppText>
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
                      minHeight: 72,
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
                        width: 42,
                        height: 42,
                        borderRadius: radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
                      }}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={selected ? colors.primary : colors.icon}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText style={typography.label}>{option.title}</AppText>
                      <AppText variant="caption" tone="muted">
                        {option.description}
                      </AppText>
                    </View>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? (
            <View
              style={{
                borderRadius: radius.md,
                backgroundColor: colors.surfaceMuted,
                padding: spacing.sm,
              }}>
              <AppText variant="caption" tone="error">
                {error}
              </AppText>
            </View>
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
            <View style={{ flex: 1 }}>
              <Button
                label="Save changes"
                variant="primary"
                fullWidth
                loading={isSaving}
                onPress={() => {
                  void handleSave();
                }}
              />
            </View>
          </View>
        </View>
      </View>

      <AppDateTimePicker
        visible={pickerTarget !== null}
        value={
          pickerTarget === 'start'
            ? startDate ?? new Date()
            : endDate ?? startDate ?? new Date()
        }
        mode="date"
        onConfirm={handleDateChange}
        onClose={() => setPickerTarget(null)}
      />

      <Modal
        transparent
        visible={bannerModal === 'menu'}
        animationType="fade"
        onRequestClose={() => setBannerModal('none')}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={() => setBannerModal('none')}
          />
          <View
            style={[
              {
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                backgroundColor: colors.surface,
                paddingTop: spacing.sm,
                paddingBottom: insets.bottom + spacing.xs,
              },
              shadows.lg,
            ]}>
            <View
              style={{
                alignSelf: 'center',
                width: 38,
                height: 4,
                borderRadius: radius.full,
                backgroundColor: colors.borderStrong,
                marginBottom: spacing.sm,
              }}
            />

            <AppText style={[typography.label, { textAlign: 'center', paddingBottom: spacing.xs }]}>
              Trip photo
            </AppText>

            {bannerUri ? (
              <SheetOption icon="eye-outline" label="View photo" onPress={() => setBannerModal('view')} />
            ) : null}
            <SheetOption icon="camera-outline" label="Take photo" onPress={() => setBannerModal('camera')} />
            <SheetOption
              icon="images-outline"
              label="Choose from library"
              onPress={() => {
                void handlePickFromLibrary();
              }}
            />
            {bannerUri ? (
              <SheetOption
                icon="trash-outline"
                label="Remove photo"
                destructive
                onPress={handleRemoveBanner}
              />
            ) : null}
            <SheetOption icon="close-outline" label="Cancel" muted onPress={() => setBannerModal('none')} />
          </View>
        </View>
      </Modal>
    </>
  );

  function PreviewCard({
    name: previewName,
    bannerUri: previewBannerUri,
    dateLabel,
    highlight,
    meta,
    roleLabel,
    onPress,
  }: {
    name: string;
    bannerUri: string | null;
    dateLabel: string;
    highlight: string;
    meta: string | null;
    roleLabel: string;
    onPress: () => void;
  }) {
    return (
      <View
        style={{
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          ...shadows.md,
        }}>
        <TripSummaryPreviewCard
          bannerUri={previewBannerUri}
          dateLabel={dateLabel}
          title={previewName.trim() || 'Unnamed trip'}
          highlight={highlight}
          meta={meta}
          roleLabel={roleLabel === 'Organizer' ? 'Organizer' : 'Participant'}
          onPress={onPress}
        />
      </View>
    );
  }

  function SheetOption({
    icon,
    label,
    muted = false,
    destructive = false,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    muted?: boolean;
    destructive?: boolean;
    onPress: () => void;
  }) {
    const foreground = destructive
      ? colors.error
      : muted
        ? colors.textMuted
        : colors.text;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 56,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          opacity: pressed ? opacity.pressed : 1,
        })}>
        <Ionicons name={icon} size={20} color={foreground} />
        <AppText style={[typography.label, { color: foreground }]}>
          {label}
        </AppText>
      </Pressable>
    );
  }
}
