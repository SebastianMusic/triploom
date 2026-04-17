import { useRouter } from 'expo-router';
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
  const { displayAvatarUrl, profile } = useProfileStore();
  const {
    theme: { layout, spacing },
  } = useAppTheme();
  const isProfileRoute = routeName === 'profile/index';

  function handleOpenProfile() {
    if (isProfileRoute) return;
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
          justifyContent: 'flex-end',
        }}>
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
