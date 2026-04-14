import { ScrollView, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

export type ScreenProps = ScrollViewProps;

export function Screen({ children, contentContainerStyle, ...props }: ScreenProps) {
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgDark }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingHorizontal: spacing.s,
            paddingTop: spacing.m,
            paddingBottom: spacing.l,
            gap: spacing.m,
            backgroundColor: colors.bgDark,
          },
          contentContainerStyle,
        ]}
        {...props}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
