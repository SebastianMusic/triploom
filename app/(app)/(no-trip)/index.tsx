import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, ImageBackground, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole, type TripWithRole } from '@/types/trip.types';

type TripBucket = 'active' | 'past';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRange(trip: TripWithRole) {
  const start = formatDate(trip.start_date);
  const end = formatDate(trip.end_date);
  if (start && end) return `${start} - ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return 'no value';
}

function getTripBucket(trip: TripWithRole): TripBucket {
  if (!trip.end_date) return 'active';
  const end = new Date(trip.end_date);
  if (Number.isNaN(end.getTime())) return 'active';
  return end < new Date() ? 'past' : 'active';
}

function roleLabel(role: TripRole) {
  if (role === TripRole.CoOrganizer) return 'Co-organizer';
  if (role === TripRole.Organizer) return 'Organizer';
  return 'Participant';
}

type TripActionProps = {
  disabled: boolean;
  selecting: boolean;
  trip: TripWithRole;
  onOptions: (trip: TripWithRole) => void;
  onSelect: (tripId: string) => void;
};

function SectionHeader({ title, count }: { title: string; count?: number }) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <AppText style={typography.label}>{title}</AppText>
      {typeof count === 'number' ? (
        <View
          style={{
            minWidth: 28,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: radius.full,
            backgroundColor: colors.secondarySoft,
            alignItems: 'center',
          }}>
          <AppText variant="caption" tone="muted">
            {count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function StatusPill({ label }: { label: string }) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
      }}>
      <AppText variant="caption" tone="primary">
        {label}
      </AppText>
    </View>
  );
}

function valueOrFallback(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'no value';
}

function getNextActionPreview() {
  return 'no value';
}

function TripSummaryCard({ trip, disabled, selecting, onSelect, onOptions }: TripActionProps) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const bannerSource = trip.banner_image_url;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelect(trip.id)}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        opacity: disabled ? 0.65 : pressed ? 0.94 : 1,
      })}>
      <View
        style={{
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        }}>
        {bannerSource ? (
          <ImageBackground source={{ uri: bannerSource }} resizeMode="cover" style={{ height: 168 }}>
            <View
              style={{
                flex: 1,
                padding: spacing.sm,
                justifyContent: 'space-between',
                backgroundColor: colors.overlay,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusPill label={roleLabel(trip.userRole)} />
                <IconButton
                  icon={<Ionicons name="ellipsis-horizontal" size={20} color={colors.icon} />}
                  disabled={disabled}
                  onPress={() => onOptions(trip)}
                />
              </View>

              <View style={{ gap: 2 }}>
                <AppText numberOfLines={1} style={[typography.subtitle, { color: colors.textOnPrimary }]}>
                  {valueOrFallback(trip.name)}
                </AppText>
                <AppText variant="caption" style={{ color: colors.textOnPrimary }}>
                  {formatDateRange(trip)}
                </AppText>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View
            style={{
              position: 'relative',
              height: 168,
              padding: spacing.sm,
              justifyContent: 'space-between',
              backgroundColor: colors.primary,
              overflow: 'hidden',
            }}>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -42,
                right: -28,
                width: 142,
                height: 142,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.primarySoft,
                opacity: 0.32,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -20,
                bottom: 34,
                width: '72%',
                height: 1,
                backgroundColor: colors.primarySoft,
                opacity: 0.38,
                transform: [{ rotate: '-10deg' }],
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusPill label={roleLabel(trip.userRole)} />
              <IconButton
                icon={<Ionicons name="ellipsis-horizontal" size={20} color={colors.icon} />}
                disabled={disabled}
                onPress={() => onOptions(trip)}
              />
            </View>

            <View style={{ gap: 2 }}>
              <AppText numberOfLines={1} style={[typography.subtitle, { color: colors.textOnPrimary }]}>
                {valueOrFallback(trip.name)}
              </AppText>
              <AppText variant="caption" style={{ color: colors.primarySoft }}>
                {formatDateRange(trip)}
              </AppText>
            </View>
          </View>
        )}

        <View style={{ padding: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}>
                <Ionicons name="flag-outline" size={16} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" tone="muted">
                  Next action
                </AppText>
                <AppText numberOfLines={1} style={typography.label}>
                  {getNextActionPreview()}
                </AppText>
              </View>
            </View>
            {selecting ? <ActivityIndicator color={colors.primary} /> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CompactPastTripCard({ trip, disabled, selecting, onSelect, onOptions }: TripActionProps) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const bannerSource = trip.banner_image_url;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelect(trip.id)}
      style={({ pressed }) => ({
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        opacity: disabled ? 0.65 : pressed ? 0.94 : 1,
      })}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, alignItems: 'center' }}>
        {bannerSource ? (
          <ImageBackground
            source={{ uri: bannerSource }}
            resizeMode="cover"
            style={{ width: 86, height: 86, overflow: 'hidden', borderRadius: radius.md }}
          />
        ) : (
          <View
            style={{
              width: 86,
              height: 86,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <AppText variant="caption" tone="muted">
              no value
            </AppText>
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <AppText numberOfLines={1} style={typography.label}>
            {valueOrFallback(trip.name)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatDateRange(trip)}
          </AppText>
          <AppText numberOfLines={1} variant="caption" tone="secondary">
            {roleLabel(trip.userRole)}
          </AppText>
        </View>
        {selecting ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <IconButton
            variant="ghost"
            icon={<Ionicons name="ellipsis-horizontal" size={20} color={colors.icon} />}
            disabled={disabled}
            onPress={() => onOptions(trip)}
          />
        )}
      </View>
    </Pressable>
  );
}

type TripOptionsSheetProps = {
  trip: TripWithRole | null;
  visible: boolean;
  onClose: () => void;
  onLeave: (trip: TripWithRole) => void;
  onDelete: (trip: TripWithRole) => void;
};

function TripOptionsSheet({ trip, visible, onClose, onLeave, onDelete }: TripOptionsSheetProps) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();

  if (!trip) return null;

  const canDelete = trip.userRole === TripRole.Organizer;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: colors.overlayStrong,
        }}>
        <View
          style={{
            padding: spacing.md,
            paddingBottom: spacing.lg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.background,
            gap: spacing.sm,
          }}>
          <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
            <AppText style={typography.label}>{trip.name ?? 'Trip settings'}</AppText>
            <AppText variant="caption" tone="muted">
              {roleLabel(trip.userRole)} - {formatDateRange(trip)}
            </AppText>
          </View>

          <Pressable
            onPress={() => {
              onClose();
              onLeave(trip);
            }}
            style={({ pressed }) => ({
              padding: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.9 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            })}>
            <Ionicons name="exit-outline" size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <AppText style={typography.label}>Leave trip</AppText>
              <AppText variant="caption" tone="muted">
                Remove yourself from this trip.
              </AppText>
            </View>
          </Pressable>

          {canDelete ? (
            <Pressable
              onPress={() => {
                onClose();
                onDelete(trip);
              }}
              style={({ pressed }) => ({
                padding: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.9 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              })}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <AppText style={typography.label}>Delete trip</AppText>
                <AppText variant="caption" tone="muted">
                  Permanently delete this trip for everyone.
                </AppText>
              </View>
            </Pressable>
          ) : null}

          <Button label="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </Pressable>
    </Modal>
  );
}

export default function TripPickerScreen() {
  const insets = useSafeAreaInsets();
  const menuProgress = useRef(new Animated.Value(0)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingTripId, setSelectingTripId] = useState<string | null>(null);
  const [mutatingTripId, setMutatingTripId] = useState<string | null>(null);
  const [optionsTrip, setOptionsTrip] = useState<TripWithRole | null>(null);

  const { fetchTrips, trips, isLoading, leaveTrip, deleteTrip } = useTripStore();
  const { setSelectedTrip } = useProfileStore();
  const {
    theme: { colors, layout, radius, spacing, typography },
  } = useAppTheme();

  useEffect(() => {
    fetchTrips().catch((fetchError: unknown) => {
      setSelectionError(fetchError instanceof Error ? fetchError.message : 'Failed to load trips.');
    });
  }, [fetchTrips]);

  const activeTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripBucket(trip) === 'active')
        .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')),
    [trips],
  );

  const pastTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripBucket(trip) === 'past')
        .sort((a, b) => (b.end_date ?? '').localeCompare(a.end_date ?? '')),
    [trips],
  );

  const isBusy = isLoading || selectingTripId !== null || mutatingTripId !== null;

  useEffect(() => {
    Animated.timing(menuProgress, {
      toValue: menuOpen ? 1 : 0,
      duration: 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [menuOpen, menuProgress]);

  const menuOpacity = menuProgress;
  const menuTranslateY = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const menuScale = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const iconRotate = menuProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTrips();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTrips]);

  async function handleSelectTrip(tripId: string) {
    setSelectionError(null);
    setSelectingTripId(tripId);
    try {
      await setSelectedTrip(tripId);
    } catch (selectError: unknown) {
      setSelectionError(selectError instanceof Error ? selectError.message : 'Failed to select trip.');
    } finally {
      setSelectingTripId(null);
    }
  }

  function handleLeaveTrip(trip: TripWithRole) {
    const tripName = trip.name ?? 'this trip';
    Alert.alert('Leave Trip', `Are you sure you want to leave "${tripName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setMutatingTripId(trip.id);
          try {
            await leaveTrip(trip.id);
          } catch {
            setSelectionError('Failed to leave trip. Please try again.');
          } finally {
            setMutatingTripId(null);
          }
        },
      },
    ]);
  }

  function handleDeleteTrip(trip: TripWithRole) {
    const tripName = trip.name ?? 'this trip';
    Alert.alert('Delete Trip', `Delete "${tripName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setMutatingTripId(trip.id);
          try {
            await deleteTrip(trip.id);
          } catch (deleteError: unknown) {
            Alert.alert('Error', deleteError instanceof Error ? deleteError.message : 'Failed to delete trip.');
          } finally {
            setMutatingTripId(null);
          }
        },
      },
    ]);
  }

  function handleTripOptions(trip: TripWithRole) {
    setOptionsTrip(trip);
  }

  function handleJoinWithCode() {
    router.push('./join');
  }

  function openCreateForm() {
    setSelectionError(null);
    setMenuOpen(false);
    router.push('./create');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xxxl + spacing.xl,
          gap: spacing.xl,
        }}>
        <View style={{ paddingHorizontal: layout.screenPadding, gap: spacing.lg }}>
          <View>
            <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase' }}>
              Welcome back
            </AppText>
            <AppText style={typography.title}>Your Trips</AppText>
          </View>

          {selectionError ? (
            <View
              style={{
                padding: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
              }}>
              <AppText variant="caption" tone="error">
                {selectionError}
              </AppText>
            </View>
          ) : null}

          {isLoading && trips.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {!isLoading && trips.length === 0 ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="No trips yet" />
              <View
                style={{
                  minHeight: 280,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  justifyContent: 'flex-end',
                  backgroundColor: colors.surface,
                }}>
                <View style={{ gap: spacing.sm }}>
                  <AppText variant="subtitle">Start with one trip</AppText>
                  <AppText tone="muted">Create a trip for your group, or join an existing one with an invite code.</AppText>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Button label="Create trip" onPress={openCreateForm} />
                    <Button label="Join code" variant="secondary" onPress={handleJoinWithCode} />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {activeTrips.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="Active trips" count={activeTrips.length} />
              <View style={{ gap: spacing.md }}>
                {activeTrips.map((trip) => (
                  <TripSummaryCard
                    key={trip.id}
                    trip={trip}
                    disabled={isBusy}
                    selecting={selectingTripId === trip.id || mutatingTripId === trip.id}
                    onSelect={handleSelectTrip}
                    onOptions={handleTripOptions}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {pastTrips.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title="Past trips" count={pastTrips.length} />
              <View style={{ gap: spacing.sm }}>
                {pastTrips.map((trip) => (
                  <CompactPastTripCard
                    key={trip.id}
                    trip={trip}
                    disabled={isBusy}
                    selecting={selectingTripId === trip.id || mutatingTripId === trip.id}
                    onSelect={handleSelectTrip}
                    onOptions={handleTripOptions}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {menuOpen ? (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: colors.overlay,
          }}
        />
      ) : null}

      {menuOpen ? (
        <Animated.View
          style={{
            position: 'absolute',
            right: spacing.md,
            bottom: insets.bottom + spacing.lg + 68,
            gap: spacing.xs,
            alignItems: 'flex-end',
            opacity: menuOpacity,
            transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
          }}>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              handleJoinWithCode();
            }}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.9 : 1,
            })}>
            <AppText variant="caption">Join with code</AppText>
          </Pressable>
          <Pressable
            onPress={openCreateForm}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.9 : 1,
            })}>
            <AppText variant="caption">Create trip</AppText>
          </Pressable>
        </Animated.View>
      ) : null}

      <FloatingActionButton
        icon={
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons name="add" size={28} color={colors.textOnPrimary} />
          </Animated.View>
        }
        onPress={() => setMenuOpen((open) => !open)}
      />

      <TripOptionsSheet
        trip={optionsTrip}
        visible={optionsTrip !== null}
        onClose={() => setOptionsTrip(null)}
        onLeave={handleLeaveTrip}
        onDelete={handleDeleteTrip}
      />
    </View>
  );
}
