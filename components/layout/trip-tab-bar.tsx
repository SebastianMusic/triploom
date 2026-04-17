import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, motion } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const TAB_BAR_WIDTH_RATIO = layout.tabBarWidthRatio;
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
  const barHorizontalPadding = spacing.s / 2;
  const barVerticalPadding = spacing.s / 2;
  const visibleRoutes = state.routes.filter((route) =>
    TAB_ROUTES.includes(route.name as (typeof TAB_ROUTES)[number])
  );
  const visibleRouteCount = Math.max(visibleRoutes.length, 1);
  const itemWidth = `${100 / visibleRouteCount}%` as `${number}%`;
  const visibleIndex = visibleRoutes.findIndex((route) => route.key === state.routes[state.index]?.key);
  const activeIndex = visibleIndex < 0 ? 0 : visibleIndex;
  const barWidth = screenWidth * TAB_BAR_WIDTH_RATIO;
  const sliderWidth = (barWidth - barHorizontalPadding * 2) / visibleRouteCount;
  const sliderOffset = sliderWidth * activeIndex;
  const sliderTranslateX = useRef(new Animated.Value(sliderOffset)).current;

  useEffect(() => {
    Animated.timing(sliderTranslateX, {
      toValue: sliderOffset,
      duration: motion.normal,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [sliderOffset, sliderTranslateX]);

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
          width: barWidth,
          minHeight: barHeight,
          marginBottom: bottomOffset,
          paddingHorizontal: barHorizontalPadding,
          paddingVertical: barVerticalPadding,
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
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: barHorizontalPadding,
            top: barVerticalPadding,
            bottom: barVerticalPadding,
            width: sliderWidth,
            borderRadius: radius.full,
            backgroundColor: colors.navigationPill,
            transform: [{ translateX: sliderTranslateX }],
          }}
        />
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
                zIndex: 1,
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
