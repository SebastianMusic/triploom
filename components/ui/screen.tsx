import { View, ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { layout } from '@/constants/theme';

export type ScreenProps = ScrollViewProps & {
  padded?: boolean;
  includeTopInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  padded = true,
  includeTopInset = false,
  contentContainerStyle,
  contentStyle,
  ...props
}: ScreenProps) {
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const horizontalPadding = padded ? layout.screenHorizontalPadding : 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={includeTopInset ? ['top', 'left', 'right'] : ['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[{ flex: 1, backgroundColor: colors.bg }, contentStyle]}
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.m,
            paddingBottom: spacing.xl * 2,
            gap: layout.screenVerticalGap,
            backgroundColor: colors.bg,
          },
          contentContainerStyle,
        ]}
        {...props}>
        <View style={{ gap: spacing.m }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
