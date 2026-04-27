import { useRouter } from 'expo-router';
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

type TripHeaderProps = {
  routeName: string;
};

export function TripHeader({ routeName }: TripHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayAvatarUrl, profile, participatedTripCount } = useProfileStore();
  const {
    theme: { colors, layout, spacing, typography },
  } = useAppTheme();
  const isProfileRoute = routeName === 'account/index';
  const isPrimaryRoute = isPrimaryTripTab(routeName);
  const badgeLevel = getProfileBadge(participatedTripCount ?? 0).level;
  const title = getTripScreenTitle(routeName);
  const actionVariant = isPrimaryRoute ? 'ghost' : 'surface';

  function handleOpenProfile() {
    if (isProfileRoute) return;
    router.push('/(app)/(trip)/account');
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
        {isPrimaryRoute ? (
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
        )}
      </View>
    </View>
  );
}
