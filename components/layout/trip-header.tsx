import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/icon-button';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useProfileStore } from '@/store/profile.store';

type TripHeaderProps = {
  routeName: string;
};

export function TripHeader({ routeName }: TripHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLeavingTrip, setIsLeavingTrip] = useState(false);
  const { displayAvatarUrl, profile, setSelectedTrip } = useProfileStore();
  const {
    theme: { colors, layout, spacing },
  } = useAppTheme();
  const isProfileRoute = routeName === 'profile/index';

  async function handleLeaveTrip() {
    if (isLeavingTrip) {
      return;
    }

    setIsLeavingTrip(true);

    try {
      await setSelectedTrip(null);
      router.replace('/(app)/(no-trip)');
    } finally {
      setIsLeavingTrip(false);
    }
  }

  function handleOpenProfile() {
    if (isProfileRoute) {
      return;
    }

    router.push('/(app)/(trip)/profile');
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
          justifyContent: 'space-between',
        }}>
        <IconButton
          accessibilityLabel="Go back to trip selection"
          icon={<Ionicons name="arrow-back" size={22} color={colors.text} />}
          loading={isLeavingTrip}
          onPress={() => {
            void handleLeaveTrip();
          }}
        />

        <IconButton
          accessibilityLabel="Open profile"
          active={isProfileRoute}
          icon={
            <Avatar
              name={profile?.user_name ?? 'Profile'}
              size="sm"
              source={displayAvatarUrl ? { uri: displayAvatarUrl } : undefined}
            />
          }
          onPress={handleOpenProfile}
        />
      </View>
    </View>
  );
}
