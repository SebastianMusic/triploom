import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PressableProps } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { useAppTheme } from '@/components/ui/theme-provider';

type BackButtonProps = Omit<PressableProps, 'children'> & {
  accessibilityLabel?: string;
};

export function BackButton({ accessibilityLabel = 'Go back', onPress, ...props }: BackButtonProps) {
  const {
    theme: { colors },
  } = useAppTheme();

  return (
    <IconButton
      accessibilityLabel={accessibilityLabel}
      icon={<Ionicons name="chevron-back" size={22} color={colors.icon} />}
      onPress={(event) => {
        if (onPress) {
          onPress(event);
          return;
        }
        router.back();
      }}
      {...props}
    />
  );
}
