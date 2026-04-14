import { Switch, View } from 'react-native';

import { useThemeStore } from '@/store/theme.store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { AppText } from '@/components/ui/text';

export function ThemeSwitch() {
  const {
    mode,
    theme: { colors, spacing },
  } = useAppTheme();
  const toggleMode = useThemeStore((state) => state.toggleMode);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
      }}>
      <AppText variant="caption" tone="muted">
        Dark mode
      </AppText>
      <Switch
        value={mode === 'dark'}
        onValueChange={toggleMode}
        trackColor={{ false: colors.border, true: colors.secondary }}
        thumbColor={mode === 'dark' ? colors.bgLight : colors.primary}
      />
    </View>
  );
}
