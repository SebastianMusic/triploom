import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomActionSheet } from '@/components/ui/bottom-action-sheet';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Stack } from '@/components/ui/stack';
import { Avatar } from '@/components/ui/avatar';
import { ProfileBadgeFrame } from '@/components/ui/profile-badge-frame';
import { TripSummaryPreviewCard } from '@/components/trip/trip-summary-preview-card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getProfileBadge } from '@/constants/profile-badges';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { useTripBannerUrl } from '@/hooks/use-trip-banner-url';
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

function getTripStartTime(trip: TripWithRole) {
  if (!trip.start_date) return null;
  const start = new Date(trip.start_date);
  if (Number.isNaN(start.getTime())) return null;
  return start.getTime();
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
    theme: { colors, radius },
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
  const resolvedBannerUri = useTripBannerUrl(trip.banner_image_url);
  const actionPreview = getNextActionPreview(nextAction);

  return (
    <TripSummaryPreviewCard
      bannerUri={resolvedBannerUri}
      dateLabel={formatDateRange(trip)}
      title={valueOrFallback(trip.name)}
      highlight={actionPreview.label}
      meta={actionPreview.meta}
      roleLabel={roleLabel(trip.userRole)}
      disabled={disabled}
      selecting={selecting}
      onPress={() => onSelect(trip.id)}
    />
  );
}

function CompactPastTripCard({ trip, disabled, selecting, onSelect }: TripActionProps) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const bannerSource = useTripBannerUrl(trip.banner_image_url);

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingTripId, setSelectingTripId] = useState<string | null>(null);
  const [visiblePastTripCount, setVisiblePastTripCount] = useState(0);

  const { fetchTrips, trips, tripNextActions, isLoading } = useTripStore();
  const { profile, displayAvatarUrl, participatedTripCount, setSelectedTrip } = useProfileStore();
  const {
    theme: { colors, radius, spacing, typography },
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
        .sort((a, b) => {
          const aStart = getTripStartTime(a);
          const bStart = getTripStartTime(b);

          if (aStart === null && bStart === null) return 0;
          if (aStart === null) return 1;
          if (bStart === null) return -1;
          return aStart - bStart;
        }),
    [trips],
  );

  const pastTrips = useMemo(
    () =>
      trips
        .filter((trip) => getTripBucket(trip) === 'past')
        .sort((a, b) => (b.end_date ?? '').localeCompare(a.end_date ?? '')),
    [trips],
  );
  const visiblePastTrips = useMemo(
    () => pastTrips.slice(0, visiblePastTripCount),
    [pastTrips, visiblePastTripCount],
  );

  const isBusy = isLoading || selectingTripId !== null;

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

  function handleShowMorePastTrips() {
    setVisiblePastTripCount((current) => {
      if (current === 0) return 6;
      return Math.min(current + 6, pastTrips.length);
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xxxl + spacing.xl,
        }}>
        <Container>
        <Stack space="sm">
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
            <Stack space="sm">
              <SectionHeader title="No trips yet" />
              <View
                style={{
                  minHeight: 280,
                  borderRadius: radius.xl,
                  padding: spacing.sm,
                  justifyContent: 'flex-end',
                  backgroundColor: colors.surface,
                }}>
                <Stack space="sm">
                  <AppText variant="subtitle">Start with one trip</AppText>
                  <AppText tone="muted">Create a trip for your group, or join an existing one with an invite code.</AppText>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                    <Button label="Create trip" onPress={openCreateForm} />
                    <Button label="Join code" variant="secondary" onPress={handleJoinWithCode} />
                  </View>
                </Stack>
              </View>
            </Stack>
          ) : null}

          {activeTrips.length > 0 ? (
            <Stack space="sm">
              <SectionHeader title="Active trips" count={activeTrips.length} />
              <Stack space="sm">
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
              </Stack>
            </Stack>
          ) : null}

          {pastTrips.length > 0 ? (
            <Stack space="sm">
              <SectionHeader title="Past trips" count={pastTrips.length} />
              {visiblePastTrips.length > 0 ? (
                <Stack space="sm">
                  {visiblePastTrips.map((trip) => (
                    <CompactPastTripCard
                      key={trip.id}
                      trip={trip}
                      disabled={isBusy}
                      selecting={selectingTripId === trip.id}
                      onSelect={handleSelectTrip}
                    />
                  ))}
                </Stack>
              ) : null}
              {visiblePastTripCount < pastTrips.length ? (
                <Button
                  label={visiblePastTripCount === 0 ? `Show previous trips (${pastTrips.length})` : 'Load more previous trips'}
                  variant="secondary"
                  fullWidth
                  onPress={handleShowMorePastTrips}
                />
              ) : null}
            </Stack>
          ) : null}
        </Stack>
        </Container>
      </ScrollView>

      <BottomActionSheet
        visible={menuOpen}
        title="Trips"
        onClose={() => setMenuOpen(false)}
        items={[
          {
            key: 'create',
            label: 'Create trip',
            icon: 'add-outline',
            onPress: openCreateForm,
          },
          {
            key: 'join',
            label: 'Join with code',
            icon: 'key-outline',
            onPress: handleJoinWithCode,
          },
        ]}
      />

      <FloatingActionButton
        icon={<Ionicons name="add" size={28} color={colors.text} />}
        onPress={() => setMenuOpen((open) => !open)}
      />
    </View>
  );
}
