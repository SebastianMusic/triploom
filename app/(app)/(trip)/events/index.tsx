import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCard } from '@/components/events/event-card';
import { Container } from '@/components/ui/container';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';

export default function EventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedTrip } = useProfileStore();
  const { events, isLoading, fetchEvents } = useEventsStore();
  const {
    theme: { colors, layout, sizes, spacing },
  } = useAppTheme();

  const headerHeight = insets.top + spacing.xs + sizes.iconButton.md + layout.headerPaddingBottom;
  const addButtonRight = layout.headerPaddingHorizontal + sizes.iconButton.md + spacing.xs;

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedTrip) {
        void fetchEvents(selectedTrip);
      }
    }, [fetchEvents, selectedTrip]),
  );

  async function handleRefresh() {
    if (!selectedTrip) return;
    setRefreshing(true);
    try {
      await fetchEvents(selectedTrip);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { void handleRefresh(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={headerHeight}
          />
        }
        contentContainerStyle={{
          paddingTop: headerHeight + spacing.sm,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <Container>
          <Stack space="sm">
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : events.length === 0 ? (
              <AppText tone="muted" style={{ textAlign: 'center', marginTop: spacing.xl }}>
                No upcoming events
              </AppText>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push({ pathname: '/(app)/(trip)/events/[id]', params: { id: event.id } })}
                />
              ))
            )}
          </Stack>
        </Container>
      </ScrollView>

      <Pressable
        accessibilityLabel="Create event"
        onPress={() => router.push('/(app)/(trip)/events/create_event')}
        hitSlop={8}
        style={({ pressed }) => ({
          position: 'absolute',
          top: insets.top + spacing.xs,
          right: addButtonRight,
          width: sizes.iconButton.md,
          height: sizes.iconButton.md,
          borderRadius: sizes.iconButton.md / 2,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 12,
          elevation: 3,
        })}>
        <Ionicons name="add" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}
