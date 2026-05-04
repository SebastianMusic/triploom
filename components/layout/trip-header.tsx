import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { ProfileBadgeFrame } from '@/components/ui/profile-badge-frame';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getTripScreenTitle, isPrimaryTripTab } from '@/components/layout/trip-navigation';
import { getProfileBadge } from '@/constants/profile-badges';
import { useProfileStore } from '@/store/profile.store';
import { useTripHeaderActionsStore } from '@/store/trip-header-actions.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

type TripHeaderProps = {
  routeName: string;
};

export function TripHeader({ routeName }: TripHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayAvatarUrl, profile, participatedTripCount, setSelectedTrip } = useProfileStore();
  const screenAction = useTripHeaderActionsStore((state) => state.action);
  const screenActions = useTripHeaderActionsStore((state) => state.actions);
  const currentParticipant = useTripStore((state) => state.currentParticipant);
  const {
    theme: { colors, layout, spacing, typography },
  } = useAppTheme();
  const isProfileRoute = routeName === 'account/index';
  const isHomeRoute = routeName === 'home/index';
  const isPrimaryRoute = isPrimaryTripTab(routeName);
  const [isSwitchingTrip, setIsSwitchingTrip] = useState(false);
  const badgeLevel = getProfileBadge(participatedTripCount ?? 0).level;
  const title = getTripScreenTitle(routeName);
  const actionVariant = isPrimaryRoute ? 'ghost' : 'surface';
  const canCreateAnnouncement =
    routeName === 'home/index' &&
    (currentParticipant?.role === TripRole.Organizer ||
      currentParticipant?.role === TripRole.CoOrganizer);
  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;
  const headerActions =
    canCreateAnnouncement
      ? [{
          accessibilityLabel: 'Create announcement',
          onPress: handleCreateAnnouncement,
        }]
      : routeName === 'events/index' && isOrganizer
        ? [{
            accessibilityLabel: 'Create event',
            onPress: () => router.push('/(app)/(trip)/events/create_event'),
          }]
        : screenActions.length > 0
          ? screenActions
          : screenAction
            ? [screenAction]
            : [];

  function handleOpenProfile() {
    if (isProfileRoute) return;
    router.push('/(app)/(trip)/account');
  }

  function handleCreateAnnouncement() {
    router.push({ pathname: '/(app)/(trip)/home', params: { compose: 'announcement' } });
  }

  async function handleSwitchTrip() {
    setIsSwitchingTrip(true);
    try {
      await setSelectedTrip(null);
      router.replace('/(app)/(no-trip)');
    } finally {
      setIsSwitchingTrip(false);
    }
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingTop: insets.top + spacing.xs,
        paddingBottom: layout.headerPaddingBottom,
        paddingHorizontal: layout.headerPaddingHorizontal,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: isPrimaryRoute ? 'space-between' : 'space-between',
          gap: spacing.sm,
        }}>
        {isHomeRoute ? (
          <IconButton
            accessibilityLabel="Switch trip"
            variant="accent"
            size="md"
            loading={isSwitchingTrip}
            icon={<Ionicons name="chevron-back" size={24} color={colors.text} />}
            onPress={handleSwitchTrip}
          />
        ) : isPrimaryRoute ? (
          <View style={{ flex: 1, paddingRight: spacing.sm }}>
            <AppText
              numberOfLines={1}
              style={[
                typography.subtitle,
                { color: colors.text, fontSize: 27, lineHeight: 32 },
              ]}>
              {title}
            </AppText>
          </View>
        ) : (
          <BackButton variant="surface" size="md" />
        )}
        {isProfileRoute && !isPrimaryRoute ? (
          <View style={{ width: 44, height: 44 }} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            {headerActions.map((action) => (
              <IconButton
                key={action.accessibilityLabel}
                accessibilityLabel={action.accessibilityLabel}
                variant="accent"
                size="md"
                icon={
                  <Ionicons
                    name={(action.iconName ?? 'add') as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={colors.text}
                  />
                }
                onPress={action.onPress}
              />
            ))}
            <IconButton
              accessibilityLabel="Open profile"
              active={isProfileRoute}
              variant={actionVariant}
              size="md"
              icon={
                <ProfileBadgeFrame level={badgeLevel} size={36}>
                  <Avatar
                    name={profile?.user_name ?? 'Profile'}
                    size="sm"
                    source={displayAvatarUrl ? { uri: displayAvatarUrl } : undefined}
                  />
                </ProfileBadgeFrame>
              }
              onPress={handleOpenProfile}
            />
          </View>
        )}
      </View>
    </View>
  );
}
