import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

const TAB_BAR_WIDTH_RATIO = 0.9;
const TAB_BAR_WIDTH = `${TAB_BAR_WIDTH_RATIO * 100}%`;
const TAB_ROUTES = ['home/index', 'events/index', 'tasks/index', 'chat/index'] as const;

export function TripTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const {
    mode,
    theme: { colors, spacing, radius },
  } = useAppTheme();

  const iconSize = radius.m;
  const itemSize = spacing.l + spacing.s / 2;
  const horizontalInset = screenWidth * ((1 - TAB_BAR_WIDTH_RATIO) / 2);
  const bottomOffset = horizontalInset + insets.bottom / 4;
  const barHeight = spacing.l + spacing.s;
  const fadeHeight = bottomOffset + barHeight + spacing.m;
  const visibleRoutes = state.routes.filter((route) =>
    TAB_ROUTES.includes(route.name as (typeof TAB_ROUTES)[number])
  );
  const itemWidth = `${100 / visibleRoutes.length}%` as `${number}%`;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
      }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: fadeHeight,
        }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: fadeHeight * 0.56,
            backgroundColor: colors.navigationFadeStrong,
            opacity: mode === 'dark' ? 0.94 : 0.88,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: fadeHeight * 0.34,
            height: fadeHeight * 0.34,
            backgroundColor: colors.navigationFadeSoft,
            opacity: mode === 'dark' ? 0.5 : 0.34,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: fadeHeight * 0.62,
            height: fadeHeight * 0.22,
            backgroundColor: colors.navigationFadeSoft,
            opacity: mode === 'dark' ? 0.22 : 0.14,
          }}
        />
      </View>

      <View
        style={{
          width: TAB_BAR_WIDTH,
          minHeight: barHeight,
          marginBottom: bottomOffset,
          paddingHorizontal: spacing.s / 2,
          paddingVertical: spacing.s / 2,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radius.full,
          backgroundColor: colors.bgLight,
          shadowColor: colors.navigationShadow,
          shadowOpacity: mode === 'dark' ? 0.6 : 0.24,
          shadowRadius: mode === 'dark' ? 34 : 24,
          shadowOffset: { width: 0, height: 18 },
          elevation: 28,
        }}>
        {visibleRoutes.map((route) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = state.index === routeIndex;
          const activeColor = options.tabBarActiveTintColor ?? colors.secondary;
          const inactiveColor = options.tabBarInactiveTintColor ?? colors.textMuted;
          const color = isFocused ? activeColor : inactiveColor;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                width: itemWidth,
                minHeight: itemSize,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.full,
              }}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color,
                size: iconSize,
              })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
