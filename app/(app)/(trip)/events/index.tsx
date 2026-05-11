import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { EventDetailModal } from '@/components/events/event-detail-modal';
import { EventFormSheet } from '@/components/events/event-form-sheet';
import { CompactEventCard, EventPreviewCard } from '@/components/events/event-preview-card';
import { useTripChromeInsets } from '@/components/layout';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTasksStore } from '@/store/tasks.store';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types/trip.types';
import type { EventWithCount } from '@/services/events.service';

function getEventEndTime(event: EventWithCount) {
  const raw = event.end_time ?? event.start_time;
  if (!raw) return null;
  const value = new Date(raw).getTime();
  return Number.isNaN(value) ? null : value;
}

function sortUpcomingEvents(events: EventWithCount[]) {
  return [...events].sort((a, b) => {
    const aMandatory = a.is_optional === false;
    const bMandatory = b.is_optional === false;
    if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
    return (getEventEndTime(a) ?? Number.MAX_SAFE_INTEGER) - (getEventEndTime(b) ?? Number.MAX_SAFE_INTEGER);
  });
}

function sortPastEvents(events: EventWithCount[]) {
  return [...events].sort((a, b) => (getEventEndTime(b) ?? 0) - (getEventEndTime(a) ?? 0));
}

export default function EventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ compose?: string }>();
  const { selectedTrip } = useProfileStore();
  const { events, isLoading, fetchEvents, deleteEvent } = useEventsStore();
  const { tasks, getAllTasks } = useTasksStore();
  const { currentParticipant, fetchParticipants } = useTripStore();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventWithCount | null>(null);
  const [visiblePastEventCount, setVisiblePastEventCount] = useState(0);
  const selectedEvent = selectedEventId ? (events.find((e) => e.id === selectedEventId) ?? null) : null;
  const selectedEventTasks = selectedEvent
    ? tasks.filter((task) => task.event_id === selectedEvent.id)
    : [];
  const createSheetVisible = params.compose === 'event';
  const now = Date.now();
  const upcomingEvents = sortUpcomingEvents(
    events.filter((event) => {
      const endTime = getEventEndTime(event);
      return endTime === null || endTime >= now;
    }),
  );
  const pastEvents = sortPastEvents(
    events.filter((event) => {
      const endTime = getEventEndTime(event);
      return endTime !== null && endTime < now;
    }),
  );
  const visiblePastEvents = pastEvents.slice(0, visiblePastEventCount);

  useFocusEffect(
    useCallback(() => {
      if (selectedTrip) {
        void fetchEvents(selectedTrip);
        void getAllTasks(selectedTrip);
        void fetchParticipants(selectedTrip);
      }
    }, [fetchEvents, fetchParticipants, getAllTasks, selectedTrip]),
  );

  async function handleRefresh() {
    if (!selectedTrip) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(selectedTrip),
        getAllTasks(selectedTrip),
      ]);
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
              count={upcomingEvents.length}
            />
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
            ) : upcomingEvents.length === 0 ? (
              <EmptyState
                title="No upcoming events"
                description="Add an event to give the trip a clearer plan."
              />
            ) : (
              upcomingEvents.map((event) => (
                <EventPreviewCard
                  key={event.id}
                  event={event}
                  onPress={() => setSelectedEventId(event.id)}
                />
              ))
            )}
            {!isLoading && pastEvents.length > 0 ? (
              <Stack space="sm" style={{ marginTop: spacing.sm }}>
                <SectionHeader title="Previous events" count={pastEvents.length} />
                <Button
                  label={
                    visiblePastEventCount === 0
                      ? `Show previous events (${pastEvents.length})`
                      : 'Hide previous events'
                  }
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    setVisiblePastEventCount((count) => (count === 0 ? Math.min(6, pastEvents.length) : 0));
                  }}
                />
                {visiblePastEvents.length > 0 ? (
                  <Stack space="sm">
                    {visiblePastEvents.map((event) => (
                      <CompactEventCard
                        key={event.id}
                        event={event}
                        onPress={() => setSelectedEventId(event.id)}
                      />
                    ))}
                    {visiblePastEventCount < pastEvents.length ? (
                      <Button
                        label="Load more previous events"
                        variant="secondary"
                        fullWidth
                        onPress={() => {
                          setVisiblePastEventCount((count) => Math.min(count + 6, pastEvents.length));
                        }}
                      />
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}
          </Stack>
        </Container>
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        relatedTasks={selectedEventTasks}
        onClose={() => setSelectedEventId(null)}
        onEdit={isCreatorOf(selectedEvent) ? () => {
          setEditingEvent(selectedEvent);
          setSelectedEventId(null);
        } : undefined}
        onDelete={canDeleteEvent(selectedEvent) ? () => {
          const id = selectedEvent!.id;
          setSelectedEventId(null);
          void deleteEvent(id);
        } : undefined}
        onTaskPress={() => {
          setSelectedEventId(null);
          router.push('/(app)/(trip)/tasks');
        }}
      />
      <EventFormSheet
        visible={createSheetVisible}
        mode="create"
        onClose={() => router.setParams({ compose: undefined })}
      />
      <EventFormSheet
        visible={!!editingEvent}
        mode="edit"
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onDeleted={() => setSelectedEventId(null)}
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
