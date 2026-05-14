import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { EventDetailModal } from '@/components/events/event-detail-modal';
import { EventFormSheet } from '@/components/events/event-form-sheet';
import { EventPreviewCard } from '@/components/events/event-preview-card';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { Container } from '@/components/ui/container';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TripSettingsPanel } from '@/components/trip/trip-settings-panel';
import { useTripBannerUrl } from '@/hooks/use-trip-banner-url';
import type { EventWithCount } from '@/services/events.service';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useAuthStore } from '@/store/auth.store';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTasksStore } from '@/store/tasks.store';
import { useTripHeaderActionsStore } from '@/store/trip-header-actions.store';
import { useTripStore } from '@/store/trip.store';
import type { Announcement, Task } from '@/types';
import { TripRole } from '@/types';

const HERO_HEIGHT = 320;
const SHEET_OVERLAP = 48;

function formatFullDay(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) return hexColor;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getTimeValue(iso: string | null | undefined) {
  if (!iso) return Number.MAX_SAFE_INTEGER;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function sortEventsByPriority(events: EventWithCount[]) {
  return [...events].sort((a, b) => {
    const aMandatory = a.is_optional === false;
    const bMandatory = b.is_optional === false;
    if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
    return getTimeValue(a.start_time) - getTimeValue(b.start_time);
  });
}

function getEventEndTimeValue(event: EventWithCount) {
  const endValue = getTimeValue(event.end_time);
  if (endValue !== Number.MAX_SAFE_INTEGER) return endValue;
  return getTimeValue(event.start_time);
}

function sortTasksByPriority(
  tasks: Task[],
  assignments: Record<string, { is_completed: boolean | null }>,
) {
  return [...tasks].sort((a, b) => {
    const aDone = assignments[a.id]?.is_completed ?? false;
    const bDone = assignments[b.id]?.is_completed ?? false;
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aMandatory = a.is_mandatory ?? false;
    const bMandatory = b.is_mandatory ?? false;
    if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
    return getTimeValue(a.due_time) - getTimeValue(b.due_time);
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ compose?: string; editAnnouncement?: string }>();
  const { height: viewportHeight } = useWindowDimensions();
  const { session } = useAuthStore();
  const { selectedTrip, setSelectedTrip } = useProfileStore();
  const {
    currentTrip,
    currentParticipant,
    participantsWithProfiles,
    fetchCurrentParticipant,
    fetchParticipants,
    leaveTrip,
  } = useTripStore();
  const { events, isLoading: eventsLoading, fetchEvents } = useEventsStore();
  const {
    tasks,
    fields,
    assignments,
    myFieldResponses,
    isLoading: tasksLoading,
    getAllTasks,
    fetchAssignments,
    fetchAllAssignments,
    fetchTaskFields,
    fetchMyFieldResponses,
    upsertAssignment,
    upsertFieldResponse,
    deleteMyFieldResponses,
  } = useTasksStore();
  const {
    announcements,
    isLoading: announcementsLoading,
    fetchAnnouncements,
    deleteAnnouncement,
    subscribeToAnnouncements,
    unsubscribeFromAnnouncements,
  } = useAnnouncementStore();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const {
    theme: { colors, radius, shadows, spacing, typography },
  } = useAppTheme();
  const transparentBackground = withAlpha(colors.background, 0);
  const bannerUrl = useTripBannerUrl(currentTrip?.banner_image_url);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventWithCount | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earlierAnnouncementsVisible, setEarlierAnnouncementsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [announcementDescriptionHasOverflow, setAnnouncementDescriptionHasOverflow] = useState(false);
  const [tripDescriptionHasOverflow, setTripDescriptionHasOverflow] = useState(false);
  const [tripDescriptionVisible, setTripDescriptionVisible] = useState(false);
  const setHeaderActions = useTripHeaderActionsStore((state) => state.setActions);

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  useFocusEffect(useCallback(() => {
    if (!isOrganizer) {
      setHeaderActions([]);
      return () => setHeaderActions([]);
    }

    setHeaderActions([
      {
        key: 'trip-settings',
        accessibilityLabel: 'Open trip settings',
        iconName: 'settings-outline',
        onPress: () => setSettingsVisible(true),
      },
      {
        key: 'create-announcement',
        accessibilityLabel: 'Create announcement',
        iconName: 'add',
        onPress: () => router.push({ pathname: '/(app)/(trip)/home', params: { compose: 'announcement' } }),
      },
    ]);

    return () => setHeaderActions([]);
  }, [isOrganizer, router, setHeaderActions]));

  const selectedEvent = selectedEventId
    ? (events.find((event) => event.id === selectedEventId) ?? null)
    : null;
  const editingAnnouncement = params.editAnnouncement
    ? (announcements.find((announcement) => announcement.id === params.editAnnouncement) ?? null)
    : null;

  const sortedTasks = useMemo(() => sortTasksByPriority(tasks, assignments), [assignments, tasks]);
  const topTaskCandidates = useMemo(
    () =>
      sortedTasks.filter((task) => {
        if (assignments[task.id]?.is_completed ?? false) return false;
        if (!task.due_time) return true;
        return new Date(task.due_time).getTime() >= Date.now();
      }),
    [assignments, sortedTasks],
  );
  const topTask = useMemo(
    () => topTaskCandidates[0] ?? null,
    [topTaskCandidates],
  );
  const topTaskAssignment = topTask ? (assignments[topTask.id] ?? null) : null;
  const sortedEvents = useMemo(() => sortEventsByPriority(events), [events]);
  const upcomingEvents = useMemo(
    () => sortedEvents.filter((event) => getEventEndTimeValue(event) >= Date.now()),
    [sortedEvents],
  );
  const topEvent = upcomingEvents[0] ?? null;
  const selectedEventTasks = selectedEvent
    ? tasks.filter((task) => task.event_id === selectedEvent.id)
    : [];
  const latestAnnouncement = announcements[0] ?? null;
  const loading = eventsLoading || tasksLoading || announcementsLoading;
  const announcementEditorVisible = params.compose === 'announcement' || !!editingAnnouncement;
  const visibleTaskIds = useMemo(
    () => Array.from(new Set([selectedTask?.id].filter(Boolean) as string[])),
    [selectedTask?.id],
  );
  const isInitialLoading =
    loading &&
    announcements.length === 0 &&
    !topEvent &&
    !topTask;

  useFocusEffect(
    useCallback(() => {
      if (!selectedTrip) return;
      void fetchEvents(selectedTrip);
      void getAllTasks(selectedTrip);
      void fetchAnnouncements(selectedTrip);
      void fetchParticipants(selectedTrip);
    }, [fetchAnnouncements, fetchEvents, fetchParticipants, getAllTasks, selectedTrip]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!selectedTrip) return;
      subscribeToAnnouncements(selectedTrip);
      return () => unsubscribeFromAnnouncements();
    }, [selectedTrip, subscribeToAnnouncements, unsubscribeFromAnnouncements]),
  );

  useEffect(() => {
    if (selectedTrip && session?.user.id) {
      void fetchCurrentParticipant(selectedTrip, session.user.id);
    }
  }, [fetchCurrentParticipant, selectedTrip, session?.user.id]);

  useEffect(() => {
    if (!currentParticipant || tasks.length === 0) return;
    const taskIds = tasks.map((task) => task.id);
    void fetchAssignments(currentParticipant.id, taskIds);
  }, [currentParticipant, fetchAssignments, tasks]);

  useEffect(() => {
    setAnnouncementDescriptionHasOverflow(false);
  }, [latestAnnouncement?.id]);

  useEffect(() => {
    setTripDescriptionHasOverflow(false);
    setTripDescriptionVisible(false);
  }, [currentTrip?.description]);

  useEffect(() => {
    if (visibleTaskIds.length === 0) return;
    void fetchTaskFields(visibleTaskIds);
    void fetchAllAssignments(visibleTaskIds).catch(() => undefined);
  }, [fetchAllAssignments, fetchTaskFields, visibleTaskIds]);

  useEffect(() => {
    if (!currentParticipant) return;
    const fieldIds = Object.values(fields).flat().map((field) => field.id);
    if (fieldIds.length === 0) return;
    void fetchMyFieldResponses(currentParticipant.id, fieldIds);
  }, [currentParticipant, fetchMyFieldResponses, fields]);

  function closeAnnouncementEditor() {
    router.setParams({ compose: undefined, editAnnouncement: undefined });
  }

  function handleEditAnnouncement(announcement: Announcement) {
    setSelectedAnnouncement(null);
    router.setParams({ editAnnouncement: announcement.id, compose: undefined });
  }

  function handleDeleteAnnouncement(announcement: Announcement) {
    if (!selectedTrip) return;
    confirmDestructiveAction({
      title: 'Delete announcement',
      message: 'This cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteAnnouncement(selectedTrip, announcement.id);
        } catch (error) {
          Alert.alert(
            'Could not delete announcement',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  }

  async function handleRefresh() {
    if (!selectedTrip) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(selectedTrip),
        getAllTasks(selectedTrip),
        fetchAnnouncements(selectedTrip),
        fetchParticipants(selectedTrip),
        session?.user.id ? fetchCurrentParticipant(selectedTrip, session.user.id) : Promise.resolve(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleLeaveTrip() {
    if (!currentTrip) return;
    confirmDestructiveAction({
      title: 'Leave trip',
      message: `Leave "${currentTrip.name ?? 'this trip'}"? You can rejoin later with an invite link.`,
      onConfirm: async () => {
        await leaveTrip(currentTrip.id);
        await setSelectedTrip(null);
      },
    });
  }

  if (!currentTrip) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: HERO_HEIGHT,
          overflow: 'hidden',
        }}>
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            resizeMode="cover"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.primarySoft }} />
        )}
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: bannerUrl ? colors.overlay : colors.transparent,
          }}
        />
        {bannerUrl ? (
          <LinearGradient
            pointerEvents="none"
            colors={[transparentBackground, colors.background]}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 0,
              height: spacing.xxl,
            }}
          />
        ) : null}
      </View>

      <ScrollView
        bounces
        alwaysBounceVertical
        overScrollMode="always"
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={isRefreshing} onRefresh={() => { void handleRefresh(); }} />}
        contentContainerStyle={{ paddingTop: HERO_HEIGHT - SHEET_OVERLAP }}>
        <View
          style={{
            minHeight: viewportHeight + SHEET_OVERLAP + bottomOverlayOffset,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            backgroundColor: colors.background,
            paddingTop: spacing.md,
            paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
            ...shadows.lg,
          }}>
          <Container>
            <Stack space="sm">
              <View
                style={{
                  paddingTop: Math.max(spacing.xs, headerContentOffset - HERO_HEIGHT + SHEET_OVERLAP + spacing.xs),
                  paddingHorizontal: spacing.xs,
                }}>
                <AppText variant="title" numberOfLines={3}>
                  {currentTrip.name ?? 'Trip'}
                </AppText>
                <Row gap="sm" align="center" style={{ marginTop: spacing.xs }}>
                  <InlineMeta icon="calendar-outline" value={formatFullDay(currentTrip.start_date)} />
                  <InlineMeta icon="people-outline" value={String(participantsWithProfiles.length)} />
                </Row>
                {currentTrip.description ? (
                  <View style={{ marginTop: spacing.sm, gap: spacing.xs / 2 }}>
                    <AppText
                      tone="muted"
                      numberOfLines={3}
                      onTextLayout={(event) => {
                        if (event.nativeEvent.lines.length >= 3 || currentTrip.description!.length > 150) {
                          setTripDescriptionHasOverflow(true);
                        }
                      }}>
                      {currentTrip.description}
                    </AppText>
                    {tripDescriptionHasOverflow ? (
                      <Pressable
                        onPress={() => setTripDescriptionVisible(true)}
                        style={({ pressed }) => ({
                          alignSelf: 'flex-start',
                          opacity: pressed ? 0.72 : 1,
                        })}>
                        <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
                          Read more
                        </AppText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View
                style={{
                  height: 10,
                  marginTop: spacing.xs / 2,
                  marginBottom: spacing.xs,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceMuted,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    width: `${getTripProgressPercent()}%`,
                    height: '100%',
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>

              <Stack space="sm">
                <AnnouncementPreview />
                <InlineViewMoreButton
                  label="View all announcements"
                  onPress={() => setEarlierAnnouncementsVisible(true)}
                />
                <AttachmentLinkCard />
              </Stack>

              <Stack space="sm" style={{ marginTop: spacing.xs }}>
                <SectionEyebrow label="Next event" />
                {topEvent ? (
                  <>
                    <EventPreviewCard
                      event={topEvent}
                      fallbackBannerUri={bannerUrl}
                      onPress={() => setSelectedEventId(topEvent.id)}
                    />
                    {upcomingEvents.length > 1 ? (
                      <InlineViewMoreButton
                        label="View more events"
                        onPress={() => router.push('/(app)/(trip)/events')}
                      />
                    ) : null}
                  </>
                ) : (
                  <EmptyPreview label="No active events" />
                )}
              </Stack>

              <Stack space="sm" style={{ marginTop: spacing.lg }}>
                <SectionEyebrow label="Next task" />
                {topTask ? (
                  <TaskCard
                    task={topTask}
                    assignment={topTaskAssignment}
                    onPress={() => setSelectedTask(topTask)}
                  />
                ) : (
                  <EmptyPreview label="No active tasks" />
                )}
              </Stack>

              <View
                style={{
                  marginTop: spacing.lg,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}>
                <Button
                  label="Leave trip"
                  variant="destructive"
                  fullWidth
                  onPress={handleLeaveTrip}
                />
              </View>

              {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xs }} /> : null}
            </Stack>
          </Container>
        </View>
      </ScrollView>

      <EventDetailModal
        event={selectedEvent}
        relatedTasks={selectedEventTasks}
        onClose={() => setSelectedEventId(null)}
        onEdit={isCreatorOfEvent(selectedEvent) ? () => {
          setEditingEvent(selectedEvent);
          setSelectedEventId(null);
        } : undefined}
        onTaskPress={(task) => {
          setSelectedEventId(null);
          setSelectedTask(task);
        }}
      />
      <EventFormSheet
        visible={!!editingEvent}
        mode="edit"
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onDeleted={() => setSelectedEventId(null)}
      />
      <TaskDetailModal
        task={selectedTask}
        fields={selectedTask ? (fields[selectedTask.id] ?? []) : []}
        assignment={selectedTask ? (assignments[selectedTask.id] ?? null) : null}
        myFieldResponses={myFieldResponses}
        relatedEventName={selectedTask?.event_id ? events.find((event) => event.id === selectedTask.event_id)?.title : null}
        onClose={() => setSelectedTask(null)}
        onMarkComplete={async (pending) => {
          if (!currentParticipant || !selectedTask) return;
          const taskFields = fields[selectedTask.id] ?? [];
          const fieldIds = taskFields.map((field) => field.id);
          if (fieldIds.length > 0) {
            await deleteMyFieldResponses(currentParticipant.id, fieldIds);
          }
          for (const field of taskFields) {
            const fieldPending = pending[field.id];
            if (!fieldPending) continue;
            for (const response of fieldPending) {
              await upsertFieldResponse(field.id, currentParticipant.id, response);
            }
          }
          await upsertAssignment(selectedTask.id, currentParticipant.id, { is_completed: true });
          void fetchAllAssignments([selectedTask.id]).catch(() => undefined);
        }}
        onUndoComplete={() => {
          if (!currentParticipant || !selectedTask) return;
          void upsertAssignment(selectedTask.id, currentParticipant.id, { is_completed: false });
          void fetchAllAssignments([selectedTask.id]).catch(() => undefined);
        }}
      />
      <PageSheetModal
        visible={!!selectedAnnouncement}
        title={selectedAnnouncement?.title ?? 'Announcement'}
        onClose={() => setSelectedAnnouncement(null)}
        onEdit={isOrganizer && selectedAnnouncement ? () => handleEditAnnouncement(selectedAnnouncement) : undefined}
        onDelete={
          isOrganizer && selectedAnnouncement
            ? () => {
                handleDeleteAnnouncement(selectedAnnouncement);
                setSelectedAnnouncement(null);
              }
            : undefined
        }>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {selectedAnnouncement?.description ? (
            <AppText>{selectedAnnouncement.description}</AppText>
          ) : (
            <AppText tone="muted">No details.</AppText>
          )}
          {selectedAnnouncement?.created_at ? (
            <InlineMeta
              icon="time-outline"
              value={`${formatFullDay(selectedAnnouncement.created_at)} ${formatTime(selectedAnnouncement.created_at)}`}
            />
          ) : null}
        </ScrollView>
      </PageSheetModal>
      <PageSheetModal
        visible={earlierAnnouncementsVisible}
        title="Announcements"
        onClose={() => setEarlierAnnouncementsVisible(false)}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
          {announcements.length === 0 ? (
            <Card style={{ padding: spacing.md }}>
              <AppText tone="muted">No announcements.</AppText>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Pressable
                key={announcement.id}
                onPress={() => {
                  setEarlierAnnouncementsVisible(false);
                  setSelectedAnnouncement(announcement);
                }}
                style={({ pressed }) => ({
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  padding: spacing.md,
                  opacity: pressed ? 0.82 : 1,
                  ...shadows.sm,
                })}>
                <Row justify="space-between" align="flex-start" gap="sm">
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText style={typography.label} numberOfLines={2}>
                      {announcement.title}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {formatFullDay(announcement.created_at)}
                    </AppText>
                    {announcement.description ? (
                      <AppText variant="caption" tone="muted" numberOfLines={3}>
                        {announcement.description}
                      </AppText>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Row>
              </Pressable>
            ))
          )}
        </ScrollView>
      </PageSheetModal>
      <PageSheetModal
        visible={announcementEditorVisible}
        title="Announcement"
        onClose={closeAnnouncementEditor}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: spacing.sm }}>
          <Container>
            <AnnouncementForm
              key={editingAnnouncement?.id ?? 'new'}
              announcementId={editingAnnouncement?.id}
              initialTitle={editingAnnouncement?.title}
              initialDescription={editingAnnouncement?.description}
              onPosted={closeAnnouncementEditor}
            />
          </Container>
        </ScrollView>
      </PageSheetModal>
      <PageSheetModal
        visible={tripDescriptionVisible}
        title={currentTrip.name ?? 'Trip'}
        onClose={() => setTripDescriptionVisible(false)}>
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          <AppText>{currentTrip.description}</AppText>
        </ScrollView>
      </PageSheetModal>
      <PageSheetModal
        visible={settingsVisible}
        title="Trip settings"
        onClose={() => setSettingsVisible(false)}>
        <TripSettingsPanel
          onClose={() => setSettingsVisible(false)}
          contentInsetBottom={bottomOverlayOffset}
        />
      </PageSheetModal>
    </View>
  );

  function AnnouncementPreview() {
    if (isInitialLoading) {
      return (
        <Card style={{ padding: spacing.md }}>
          <Row gap="sm" align="center">
            <ActivityIndicator color={colors.primary} />
            <AppText tone="muted">Loading announcements...</AppText>
          </Row>
        </Card>
      );
    }

    if (!latestAnnouncement) {
      return (
        <EmptyPreview label="No announcements yet" />
      );
    }

    return (
      <Card
        variant="interactive"
        onPress={() => setSelectedAnnouncement(latestAnnouncement)}
        style={{
          padding: spacing.md,
        }}>
        <Stack space="xs">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle" numberOfLines={3}>
                {latestAnnouncement.title}
              </AppText>
              <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {formatFullDay(latestAnnouncement.created_at)}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Row>
          {latestAnnouncement.description ? (
            <AppText
              tone="muted"
              numberOfLines={5}
              onTextLayout={(event) => {
                if (event.nativeEvent.lines.length > 5) {
                  setAnnouncementDescriptionHasOverflow(true);
                }
              }}>
              {latestAnnouncement.description}
            </AppText>
          ) : null}
          <Row justify="space-between" align="center">
            {announcementDescriptionHasOverflow ? (
              <Pressable
                onPress={() => setSelectedAnnouncement(latestAnnouncement)}
                style={({ pressed }) => ({
                  paddingVertical: spacing.xs / 2,
                  opacity: pressed ? 0.72 : 1,
                })}>
                <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
                  View more
                </AppText>
              </Pressable>
            ) : (
              <View />
            )}
          </Row>
        </Stack>
      </Card>
    );
  }

  function InlineMeta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
    if (!value) return null;
    return (
      <Row gap="xs" align="center" style={{ maxWidth: '100%' }}>
        <Ionicons name={icon} size={15} color={colors.primary} />
        <AppText variant="caption" tone="muted" numberOfLines={2} style={{ flexShrink: 1, lineHeight: 17 }}>
          {value}
        </AppText>
      </Row>
    );
  }

  function InlineViewMoreButton({ label, onPress }: { label: string; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          paddingVertical: spacing.xs / 2,
          opacity: pressed ? 0.72 : 1,
        })}>
        <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
          {label}
        </AppText>
      </Pressable>
    );
  }

  function AttachmentLinkCard() {
    const url = currentTrip?.description_file_url;
    if (!url) return null;

    return (
      <Card
        variant="interactive"
        onPress={() => {
          void Linking.openURL(url);
        }}
        style={{ padding: spacing.sm, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }}>
        <Row justify="space-between" align="center" gap="sm">
          <Row gap="sm" align="center" style={{ flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primarySoft,
              }}>
              <Ionicons name="link-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={typography.label}>Attachment</AppText>
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {url}
              </AppText>
            </View>
          </Row>
          <Ionicons name="open-outline" size={18} color={colors.textMuted} />
        </Row>
      </Card>
    );
  }

  function SectionEyebrow({ label }: { label: string }) {
    return (
      <AppText
        variant="subtitle"
        numberOfLines={2}
        style={{
          ...typography.subtitle,
          letterSpacing: 0,
        }}>
        {label}
      </AppText>
    );
  }

  function EmptyPreview({ label }: { label: string }) {
    return (
      <Card style={{ padding: spacing.md, backgroundColor: colors.surfaceMuted }}>
        <AppText tone="muted">{label}</AppText>
      </Card>
    );
  }

  function getTripProgressPercent() {
    const start = currentTrip?.start_date ? new Date(currentTrip.start_date).getTime() : null;
    const end = currentTrip?.end_date ? new Date(currentTrip.end_date).getTime() : null;
    if (!start || !end || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return 0;
    }

    const progress = ((Date.now() - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  function isCreatorOfEvent(event: EventWithCount | null) {
    return !!event && !!currentParticipant?.id && event.created_by_id === currentParticipant.id;
  }
}
