import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useAppTheme } from '@/components/ui/theme-provider';

type DestructiveFormFooterProps = {
  label: string;
  onPress: () => void;
};

export function DestructiveFormFooter({ label, onPress }: DestructiveFormFooterProps) {
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  return (
    <View
      style={{
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}>
      <Button
        label={label}
        variant="destructive"
        fullWidth
        onPress={onPress}
      />
    </View>
  );
}
