import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { IconButton } from '@/components/ui/icon-button';
import { useAppTheme } from '@/components/ui/theme-provider';

type BackButtonProps = Omit<ComponentProps<typeof IconButton>, 'icon'> & {
  accessibilityLabel?: string;
};

export function BackButton({ accessibilityLabel = 'Go back', onPress, ...props }: BackButtonProps) {
  const {
    theme: { colors },
  } = useAppTheme();

  return (
    <IconButton
      accessibilityLabel={accessibilityLabel}
      size="lg"
      icon={<Ionicons name="chevron-back" size={24} color={colors.icon} />}
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
