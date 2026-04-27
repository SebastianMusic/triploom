import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { ProfileBadgeFrame } from '@/components/ui/profile-badge-frame';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getProfileBadge } from '@/constants/profile-badges';
import { useProfileStore } from '@/store/profile.store';

const TRIP_ROUTES_WITH_PROFILE_BUTTON = new Set(['home', 'events', 'tasks', 'chat', 'account', 'admin']);

function shouldShowProfileButton(segments: readonly string[]) {
  if (segments[0] !== '(app)') return false;

  if (segments[1] !== '(trip)') return false;
  if (!TRIP_ROUTES_WITH_PROFILE_BUTTON.has(segments[2] ?? '')) return false;

  return segments.length <= 4 && (segments[3] === undefined || segments[3] === 'index');
}

export function GlobalProfileButton() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { displayAvatarUrl, profile, participatedTripCount } = useProfileStore();
  const {
    theme: { layout, spacing },
  } = useAppTheme();

  if (!shouldShowProfileButton(segments)) return null;

  const isProfileRoute = segments[1] === 'profile';
  const badgeLevel = getProfileBadge(participatedTripCount ?? 0).level;

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
          justifyContent: 'flex-end',
        }}>
        <IconButton
          accessibilityLabel="Open profile"
          active={isProfileRoute}
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
          onPress={() => {
            if (isProfileRoute) return;
            router.push('/(app)/profile');
          }}
        />
      </View>
    </View>
  );
}
