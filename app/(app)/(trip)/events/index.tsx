import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { EventCard } from '@/components/events/event-card';
import { EventDetailModal } from '@/components/events/event-detail-modal';
import { useTripChromeInsets } from '@/components/layout';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';
import type { EventWithCount } from '@/services/events.service';

export default function EventsScreen() {
  const router = useRouter();
  const { selectedTrip } = useProfileStore();
  const { events, isLoading, fetchEvents, deleteEvent } = useEventsStore();
  const { currentParticipant, fetchParticipants } = useTripStore();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = selectedEventId ? (events.find((e) => e.id === selectedEventId) ?? null) : null;

  useFocusEffect(
    useCallback(() => {
      if (selectedTrip) {
        void fetchEvents(selectedTrip);
        void fetchParticipants(selectedTrip);
      }
    }, [fetchEvents, fetchParticipants, selectedTrip]),
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
          <AppRefreshControl
            refreshing={refreshing}
            onRefresh={() => { void handleRefresh(); }}
            progressViewOffset={headerContentOffset}
          />
        }
        contentContainerStyle={{
          paddingTop: headerContentOffset,
          paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
        }}>
        <Container>
          <Stack space="sm">
            <SectionHeader
              title="Upcoming events"
              subtitle="Plan, browse and open event details in one place."
              count={events.length}
            />
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : events.length === 0 ? (
              <EmptyState
                title="No events yet"
                description="Add the first event to give the trip a clearer plan."
              />
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => setSelectedEventId(event.id)}
                />
              ))
            )}
          </Stack>
        </Container>
      </ScrollView>

      <FloatingActionButton
        accessibilityLabel="Create event"
        onPress={() => router.push('/(app)/(trip)/events/create_event')}
        style={{
          bottom: bottomOverlayOffset - spacing.xl,
        }}
        icon={<Ionicons name="add" size={28} color={colors.textOnPrimary} />}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEventId(null)}
        onEdit={isCreatorOf(selectedEvent) ? () => {
          const id = selectedEvent!.id;
          setSelectedEventId(null);
          router.push({ pathname: '/(app)/(trip)/events/[id]', params: { id, edit: '1' } });
        } : undefined}
        onDelete={canDeleteEvent(selectedEvent) ? () => {
          const id = selectedEvent!.id;
          setSelectedEventId(null);
          void deleteEvent(id);
        } : undefined}
      />
    </View>
  );

  function isCreatorOf(event: EventWithCount | null) {
    return !!event && !!currentParticipant?.id && event.created_by_id === currentParticipant.id;
  }

  function canDeleteEvent(event: EventWithCount | null) {
    if (!event || !currentParticipant) return false;
    const isOrganizer = currentParticipant.role === TripRole.Organizer || currentParticipant.role === TripRole.CoOrganizer;
    return isOrganizer && event.created_by_id !== currentParticipant.id;
  }
}
