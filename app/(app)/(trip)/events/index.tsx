import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventCard } from '@/components/events/event-card';
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

  // top of TripHeader + iconButton.md + headerPaddingBottom = header bottom edge
  const headerHeight = insets.top + spacing.xs + sizes.iconButton.md + layout.headerPaddingBottom;
  // right offset: headerPaddingHorizontal + iconButton (avatar) + small gap → place + button left of avatar
  const addButtonRight = layout.headerPaddingHorizontal + sizes.iconButton.md + spacing.xs;

  useEffect(() => {
    if (selectedTrip) {
      void fetchEvents(selectedTrip);
    }
  }, [selectedTrip]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + spacing.sm,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : events.length === 0 ? (
          <AppText tone="muted" style={{ textAlign: 'center', marginTop: spacing.xl }}>
            No upcoming events
          </AppText>
        ) : (
          events.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </ScrollView>

      {/* + button overlaid in TripHeader area, left of the avatar */}
      <Pressable
        accessibilityLabel="Create event"
        onPress={() => router.push('/(app)/(trip)/events/create_event')}
        style={({ pressed }) => ({
          position: 'absolute',
          top: insets.top + spacing.xs,
          right: addButtonRight,
          width: sizes.iconButton.md,
          height: sizes.iconButton.md,
          borderRadius: sizes.iconButton.md / 2,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        })}>
        <Ionicons name="add" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}
