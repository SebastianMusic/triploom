import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPrimaryTripTab, TRIP_TAB_ITEMS } from '@/components/layout/trip-navigation';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';
import { useTripChromeStore } from '@/store/trip-chrome.store';
import { useChatStore } from '@/store/chat.store';

export function TripTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const translateIndex = useRef(new Animated.Value(0)).current;
  const isNavigationHidden = useTripChromeStore((store) => store.isNavigationHidden);
  const {
    theme: { colors, layout, opacity, radius, shadows, sizes, spacing },
  } = useAppTheme();
  const { currentParticipant } = useTripStore();
  const hasAnyUnread = useChatStore((s) => s.chatRooms.some((r) => r.hasUnread));

  const isAdmin =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const visibleTabItems = TRIP_TAB_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const tabs = visibleTabItems.map((item) => {
    const route = state.routes.find((currentRoute) => currentRoute.name === item.routeName);

    return route ? { item, route } : null;
  }).filter(Boolean) as {
    item: (typeof TRIP_TAB_ITEMS)[number];
    route: (typeof state.routes)[number];
  }[];

  const activeRouteName = state.routes[state.index]?.name;
  const isHidden = !isPrimaryTripTab(activeRouteName ?? '');
  const activeIndex = tabs.findIndex(({ route }) => route.name === activeRouteName);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const bottomInset = Math.max(insets.bottom, spacing.xs);
  const reserveHeight = sizes.navigation.barHeight + bottomInset + spacing.xs;
  const segmentWidth = barWidth > 0 ? (barWidth - sizes.navigation.indicatorInset * 2) / Math.max(tabs.length, 1) : 0;
  const indicatorWidth = Math.max(segmentWidth - spacing.xs, 0);

  useEffect(() => {
    if (isHidden) return;
    Animated.timing(translateIndex, {
      toValue: safeIndex,
      duration: 260,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [safeIndex, translateIndex, isHidden]);

  if (isHidden) return null;

  if (isNavigationHidden) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 25,
        height: reserveHeight,
        justifyContent: 'flex-end',
        backgroundColor: colors.transparent,
      }}>
      <View
        onLayout={(event) => {
          setBarWidth(event.nativeEvent.layout.width);
        }}
        style={[
          {
            alignSelf: 'center',
            width: layout.floatingBarWidth,
            maxWidth: layout.floatingBarMaxWidth,
            minHeight: sizes.navigation.barHeight,
            marginBottom: bottomInset,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            padding: sizes.navigation.indicatorInset,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          shadows.lg,
        ]}>
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: sizes.navigation.indicatorInset,
              left: sizes.navigation.indicatorInset,
              width: indicatorWidth,
              height: sizes.navigation.barHeight - sizes.navigation.indicatorInset * 2,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceMuted,
              opacity: isPrimaryTripTab(activeRouteName ?? '') ? 1 : 0,
              transform: [{ translateX: Animated.multiply(translateIndex, segmentWidth) }],
            }}
          />
        ) : null}

        {tabs.map(({ item, route }, index) => {
          const isFocused = index === activeIndex;
          const options = descriptors[route.key]?.options;
          const showUnreadDot = item.routeName === 'chat/index' && hasAnyUnread;

          return (
            <Pressable
              key={route.key}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? item.label}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onLongPress={() => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: sizes.navigation.barHeight - sizes.navigation.indicatorInset * 2,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? opacity.pressed : 1,
              })}>
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={isFocused ? item.activeIcon : item.icon}
                  size={sizes.icon.md}
                  color={isFocused ? colors.primary : colors.icon}
                />
                {showUnreadDot && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -1,
                      right: -3,
                      width: 7,
                      height: 7,
                      borderRadius: 3.5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
