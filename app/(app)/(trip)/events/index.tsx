import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, EventCard } from '@/components/ui';
import { fakeEvents } from '@/constants/fake-events';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function EventsScreen() {
  const {
    theme: { colors, spacing, radius },
  } = useAppTheme();
  const [nextEvent, ...otherEvents] = fakeEvents;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.m,
          paddingTop: spacing.m,
          paddingBottom: spacing.xl * 2,
          gap: spacing.m,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 42, lineHeight: 50 }}>
            Events
          </AppText>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.secondary,
              borderRadius: radius.full,
              paddingHorizontal: spacing.s + spacing.s / 2,
              paddingVertical: spacing.s / 2,
              opacity: pressed ? 0.9 : 1,
            })}>
            <AppText variant="caption">Create Event</AppText>
          </Pressable>
        </View>

        <View style={{ gap: spacing.s }}>
          <AppText variant="subtitle">Next Event</AppText>
          {nextEvent ? (
            <EventCard
              title={nextEvent.title}
              location={nextEvent.location}
              startsAt={nextEvent.startsAt}
              host={nextEvent.host}
              attendees={nextEvent.attendees}
              imageUrl={nextEvent.imageUrl}
              featured
            />
          ) : null}
        </View>

        <View style={{ gap: spacing.s }}>
          <AppText variant="subtitle">All Events</AppText>
          {otherEvents.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              location={event.location}
              startsAt={event.startsAt}
              host={event.host}
              attendees={event.attendees}
              imageUrl={event.imageUrl}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
