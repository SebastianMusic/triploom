import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ImageBackground, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Avatar } from '@/components/ui/avatar';
import { ProfileBadgeFrame } from '@/components/ui/profile-badge-frame';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getProfileBadge } from '@/constants/profile-badges';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import type { TripNextAction } from '@/types';
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
  if (role === TripRole.CoOrganizer || role === TripRole.Organizer) return 'Organizer';
  return 'Participant';
}

type TripActionProps = {
  disabled: boolean;
  selecting: boolean;
  trip: TripWithRole;
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
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons
        name={label === 'Organizer' ? 'construct-outline' : 'person-outline'}
        size={16}
        color={colors.primary}
      />
    </View>
  );
}

function valueOrFallback(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'no value';
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

function getNextActionPreview(action: TripNextAction | null | undefined) {
  if (!action) {
    return {
      label: 'Nothing scheduled yet',
      meta: null,
    };
  }

  return {
    label: action.title,
    meta: `${action.type === 'event' ? 'Event' : 'Task'}${formatActionDateTime(action.at) ? ` · ${formatActionDateTime(action.at)}` : ''}`,
  };
}

function TripSummaryCard({
  trip,
  disabled,
  selecting,
  nextAction,
  onSelect,
}: TripActionProps & { nextAction: TripNextAction | null | undefined }) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const bannerSource = trip.banner_image_url;
  const actionPreview = getNextActionPreview(nextAction);
  const cardDimOverlay = 'rgba(20, 32, 43, 0.44)';

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
        <View style={{ position: 'relative', aspectRatio: 3 / 2, backgroundColor: colors.primary }}>
          {bannerSource ? (
            <ImageBackground source={{ uri: bannerSource }} resizeMode="cover" style={{ flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  padding: spacing.md,
                  justifyContent: 'space-between',
                  backgroundColor: cardDimOverlay,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText style={[typography.body, { color: colors.textOnPrimary, fontSize: 14, lineHeight: 18 }]}>
                      {formatDateRange(trip)}
                    </AppText>
                    <AppText
                      numberOfLines={1}
                      style={[
                        typography.title,
                        { color: colors.textOnPrimary, fontSize: 28, lineHeight: 30 },
                      ]}>
                      {valueOrFallback(trip.name)}
                    </AppText>
                  </View>
                  <StatusPill label={roleLabel(trip.userRole)} />
                </View>

                <View
                  style={{
                    paddingTop: spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.22)',
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}>
                  <View
                    style={{
                      flex: 1,
                      paddingRight: spacing.md,
                    }}>
                    <AppText
                      numberOfLines={2}
                      style={[typography.subtitle, { color: colors.textOnPrimary, fontSize: 18, lineHeight: 22 }]}>
                      {actionPreview.label}
                    </AppText>
                  </View>
                  {actionPreview.meta ? (
                    <AppText
                      numberOfLines={2}
                      style={[
                        typography.caption,
                        { color: colors.textOnPrimary, opacity: 0.84, textAlign: 'right', maxWidth: '42%' },
                      ]}>
                      {actionPreview.meta}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View
              style={{
                flex: 1,
                padding: spacing.md,
                justifyContent: 'space-between',
                backgroundColor: colors.primary,
                overflow: 'hidden',
              }}>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: cardDimOverlay,
                }}
              />
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

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <AppText style={[typography.body, { color: colors.primarySoft, fontSize: 14, lineHeight: 18 }]}>
                    {formatDateRange(trip)}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={[
                      typography.title,
                      { color: colors.textOnPrimary, fontSize: 28, lineHeight: 30 },
                    ]}>
                    {valueOrFallback(trip.name)}
                  </AppText>
                </View>
                <StatusPill label={roleLabel(trip.userRole)} />
              </View>

              <View
                style={{
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255,255,255,0.2)',
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                }}>
                <View
                  style={{
                    flex: 1,
                    paddingRight: spacing.md,
                  }}>
                  <AppText
                    numberOfLines={2}
                    style={[typography.subtitle, { color: colors.textOnPrimary, fontSize: 18, lineHeight: 22 }]}>
                    {actionPreview.label}
                  </AppText>
                </View>
                {actionPreview.meta ? (
                  <AppText
                    numberOfLines={2}
                    style={[
                      typography.caption,
                      { color: colors.textOnPrimary, opacity: 0.82, textAlign: 'right', maxWidth: '42%' },
                    ]}>
                    {actionPreview.meta}
                  </AppText>
                ) : null}
              </View>
            </View>
          )}

          {selecting ? (
            <View
              style={{
                position: 'absolute',
                right: spacing.sm,
                bottom: spacing.sm,
              }}>
              <ActivityIndicator color={colors.textOnPrimary} />
            </View>
          ) : null}
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
        </View>
        <StatusPill label={roleLabel(trip.userRole)} />
        {selecting ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
    </Pressable>
  );
}

export default function TripPickerScreen() {
  const appRouter = useRouter();
  const insets = useSafeAreaInsets();
  const menuProgress = useRef(new Animated.Value(0)).current;
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingTripId, setSelectingTripId] = useState<string | null>(null);

  const { fetchTrips, trips, tripNextActions, isLoading } = useTripStore();
  const { profile, displayAvatarUrl, participatedTripCount, setSelectedTrip } = useProfileStore();
  const {
    theme: { colors, layout, radius, spacing, typography },
  } = useAppTheme();
  const displayName = profile?.user_name?.trim() || 'traveler';
  const badgeLevel = getProfileBadge(participatedTripCount ?? 0).level;

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

  const isBusy = isLoading || selectingTripId !== null;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => appRouter.push('/(app)/profile')}
              hitSlop={16}
              style={({ pressed }) => ({
                borderRadius: radius.full,
                opacity: pressed ? 0.84 : 1,
              })}>
              <ProfileBadgeFrame level={badgeLevel} size={64}>
                <Avatar
                  name={profile?.user_name ?? 'Profile'}
                  size="lg"
                  source={displayAvatarUrl ? { uri: displayAvatarUrl } : undefined}
                />
              </ProfileBadgeFrame>
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase' }}>
                WELCOME BACK {displayName.toUpperCase()}!
              </AppText>
              <AppText style={typography.title}>Your Trips</AppText>
            </View>
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
                    nextAction={tripNextActions[trip.id]}
                    disabled={isBusy}
                    selecting={selectingTripId === trip.id}
                    onSelect={handleSelectTrip}
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
                    selecting={selectingTripId === trip.id}
                    onSelect={handleSelectTrip}
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
            <Ionicons name="add" size={28} color={colors.text} />
          </Animated.View>
        }
        onPress={() => setMenuOpen((open) => !open)}
      />
    </View>
  );
}
