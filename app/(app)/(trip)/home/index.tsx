import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { EventDetailModal } from '@/components/events/event-detail-modal';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripBannerUrl } from '@/hooks/use-trip-banner-url';
import { getEventBannerUrl, type EventWithCount } from '@/services/events.service';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useAuthStore } from '@/store/auth.store';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTasksStore } from '@/store/tasks.store';
import { useTripStore } from '@/store/trip.store';
import type { Announcement, Task } from '@/types';
import { TripRole } from '@/types';
import { TaskFieldType } from '@/types/tasks.types';

const HERO_HEIGHT = 320;
const SHEET_OVERLAP = 48;

type PendingResponseMap = Record<
  string,
  { option_id?: string | null; is_checked?: boolean | null; value?: string | null }[]
>;

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

function formatDue(iso: string | null | undefined): string {
  if (!iso) return 'No deadline';
  return `${formatFullDay(iso)} ${formatTime(iso)}`;
}

function formatEventTime(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return '';
  const startText = `${formatFullDay(start)} ${formatTime(start)}`;
  if (!end) return startText;
  return `${startText} - ${formatTime(end)}`;
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
  const { selectedTrip } = useProfileStore();
  const {
    currentTrip,
    currentParticipant,
    participantsWithProfiles,
    fetchCurrentParticipant,
    fetchParticipants,
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
  const [topEventPreviewUrl, setTopEventPreviewUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earlierAnnouncementsVisible, setEarlierAnnouncementsVisible] = useState(false);
  const [announcementDescriptionHasOverflow, setAnnouncementDescriptionHasOverflow] = useState(false);
  const [taskPendingResponses, setTaskPendingResponses] = useState<PendingResponseMap>({});

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

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
  const topTaskFields = topTask ? (fields[topTask.id] ?? []) : [];
  const topTaskAssignment = topTask ? (assignments[topTask.id] ?? null) : null;
  const sortedEvents = useMemo(() => sortEventsByPriority(events), [events]);
  const topEvent = sortedEvents[0] ?? null;
  const latestAnnouncement = announcements[0] ?? null;
  const loading = eventsLoading || tasksLoading || announcementsLoading;
  const announcementEditorVisible = params.compose === 'announcement' || !!editingAnnouncement;
  const visibleTaskIds = useMemo(
    () => Array.from(new Set([topTask?.id, selectedTask?.id].filter(Boolean) as string[])),
    [selectedTask?.id, topTask?.id],
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
    setTaskPendingResponses({});
  }, [topTask?.id]);

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

  useEffect(() => {
    if (!topEvent?.banner_image_url) {
      setTopEventPreviewUrl(null);
      return;
    }

    let cancelled = false;
    getEventBannerUrl(topEvent.banner_image_url)
      .then((url) => {
        if (!cancelled) setTopEventPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setTopEventPreviewUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [topEvent?.banner_image_url]);

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
        await deleteAnnouncement(selectedTrip, announcement.id);
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

  async function handleCompleteTopTask() {
    if (!currentParticipant || !topTask) return;
    const fieldIds = topTaskFields.map((field) => field.id);
    if (fieldIds.length > 0) {
      await deleteMyFieldResponses(currentParticipant.id, fieldIds);
    }
    for (const field of topTaskFields) {
      const pending = taskPendingResponses[field.id];
      if (!pending) continue;
      for (const response of pending) {
        await upsertFieldResponse(field.id, currentParticipant.id, response);
      }
    }
    await upsertAssignment(topTask.id, currentParticipant.id, { is_completed: true });
    setTaskPendingResponses({});
    void fetchAllAssignments([topTask.id]).catch(() => undefined);
  }

  function handleUndoTopTaskComplete() {
    if (!currentParticipant || !topTask) return;
    const prefilled: PendingResponseMap = {};
    for (const field of topTaskFields) {
      const responses = myFieldResponses[field.id] ?? [];
      if (responses.length > 0) {
        prefilled[field.id] = responses.map((response) => ({
          option_id: response.option_id,
          is_checked: response.is_checked,
          value: response.value,
        }));
      }
    }
    setTaskPendingResponses(prefilled);
    void upsertAssignment(topTask.id, currentParticipant.id, { is_completed: false });
    void fetchAllAssignments([topTask.id]).catch(() => undefined);
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
              <View style={{ paddingTop: Math.max(0, headerContentOffset - HERO_HEIGHT + SHEET_OVERLAP) }}>
                <AppText variant="title" numberOfLines={1}>
                  {currentTrip.name ?? 'Trip'}
                </AppText>
                <Row gap="sm" align="center" style={{ marginTop: spacing.xs }}>
                  <InlineMeta icon="calendar-outline" value={formatFullDay(currentTrip.start_date)} />
                  <InlineMeta icon="people-outline" value={String(participantsWithProfiles.length)} />
                </Row>
              </View>

              <View
                style={{
                  height: 1,
                  marginTop: spacing.xs / 2,
                  marginBottom: 0,
                  backgroundColor: colors.border,
                }}
              />

              <Stack space="sm">
                <AnnouncementPreview />
                <InlineViewMoreButton
                  label="View all announcements"
                  onPress={() => setEarlierAnnouncementsVisible(true)}
                />
              </Stack>

              <Stack space="sm" style={{ marginTop: spacing.xs }}>
                <SectionEyebrow label="Next event" />
                {topEvent ? (
                  <>
                    <EventPreviewCard />
                    {sortedEvents.length > 1 ? (
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

              <Stack space="sm" style={{ marginTop: spacing.xs }}>
                <SectionEyebrow label="Next task" />
                {topTask ? (
                  <>
                    <TaskPreviewCard />
                    <InlineViewMoreButton
                      label="View more tasks"
                      onPress={() => router.push('/(app)/(trip)/tasks')}
                    />
                  </>
                ) : (
                  <EmptyPreview label="No active tasks" />
                )}
              </Stack>

              {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xs }} /> : null}
            </Stack>
          </Container>
        </View>
      </ScrollView>

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEventId(null)} />
      <TaskDetailModal
        task={selectedTask}
        fields={selectedTask ? (fields[selectedTask.id] ?? []) : []}
        assignment={selectedTask ? (assignments[selectedTask.id] ?? null) : null}
        myFieldResponses={myFieldResponses}
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
        style={{ padding: spacing.md }}>
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

  function EventPreviewCard() {
    if (!topEvent) return null;

    const isMandatory = topEvent.is_optional === false;

    return (
      <Pressable
        onPress={() => setSelectedEventId(topEvent.id)}
        style={({ pressed }) => ({
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: isMandatory ? colors.warningSoft : colors.surface,
          opacity: pressed ? 0.82 : 1,
          ...shadows.sm,
        })}>
        <View>
          {topEventPreviewUrl || bannerUrl ? (
            <Image
              source={{ uri: topEventPreviewUrl ?? bannerUrl ?? '' }}
              resizeMode="cover"
              style={{ width: '100%', height: 186, backgroundColor: colors.surfaceMuted }}
            />
          ) : (
            <View
              style={{
                height: 186,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isMandatory ? colors.warning : colors.primarySoft,
              }}>
              <Ionicons name="calendar-outline" size={28} color={isMandatory ? colors.textOnPrimary : colors.primary} />
            </View>
          )}
          {isMandatory ? (
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: spacing.sm,
                borderRadius: radius.full,
                backgroundColor: colors.warning,
                paddingHorizontal: spacing.xs,
                paddingVertical: 4,
              }}>
              <AppText variant="caption" style={{ color: colors.text }}>
                Mandatory
              </AppText>
            </View>
          ) : null}
        </View>
        <Stack space="sm" style={{ padding: spacing.md }}>
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="subtitle" numberOfLines={2}>
                {topEvent.title ?? 'Untitled event'}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Row>

          <InlineMeta icon="time-outline" value={formatEventTime(topEvent.start_time, topEvent.end_time)} />
          {topEvent.location ? <InlineMeta icon="location-outline" value={topEvent.location} /> : null}
          {topEvent.price_range ? <InlineMeta icon="cash-outline" value={topEvent.price_range} /> : null}

          {topEvent.description ? (
            <AppText tone="muted" numberOfLines={3}>
              {topEvent.description}
            </AppText>
          ) : null}
        </Stack>
      </Pressable>
    );
  }

  function TaskPreviewCard() {
    if (!topTask) return null;

    const isCompleted = topTaskAssignment?.is_completed ?? false;
    const isMandatory = topTask.is_mandatory ?? false;

    function getResponses(fieldId: string) {
      if (isCompleted) return myFieldResponses[fieldId] ?? [];
      return taskPendingResponses[fieldId] ?? [];
    }

    function handleToggleCheckbox(fieldId: string) {
      setTaskPendingResponses((prev) => {
        const current = prev[fieldId]?.[0]?.is_checked ?? false;
        return { ...prev, [fieldId]: [{ option_id: null, is_checked: !current }] };
      });
    }

    function handleSelectDropdown(fieldId: string, optionId: string) {
      setTaskPendingResponses((prev) => ({
        ...prev,
        [fieldId]: [{ option_id: optionId, is_checked: null, value: null }],
      }));
    }

    function handleChangeText(fieldId: string, value: string) {
      setTaskPendingResponses((prev) => ({
        ...prev,
        [fieldId]: [{ option_id: null, is_checked: null, value }],
      }));
    }

    return (
      <Card style={{ padding: spacing.md, backgroundColor: isMandatory ? colors.warningSoft : colors.surface }}>
        <Stack space="sm">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={{ flex: 1, gap: 6 }}>
              {isMandatory ? (
                <View
                  style={{
                    alignSelf: 'flex-start',
                    borderRadius: radius.full,
                    backgroundColor: colors.warning,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: 4,
                  }}>
                  <AppText variant="caption" style={{ color: colors.text }}>
                    Mandatory
                  </AppText>
                </View>
              ) : null}
              <AppText variant="subtitle" numberOfLines={2}>
                {topTask.title ?? 'Untitled task'}
              </AppText>
            </View>
            <Pressable
              onPress={() => setSelectedTask(topTask)}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Row>

          <InlineMeta icon="calendar-outline" value={formatDue(topTask.due_time)} />
          {topTask.description ? <AppText tone="muted">{topTask.description}</AppText> : null}

          {topTaskFields.map((field) => {
            const responses = getResponses(field.id);

            if (field.type === TaskFieldType.Checkbox) {
              const checked = responses[0]?.is_checked ?? false;
              return (
                <Pressable
                  key={field.id}
                  disabled={isCompleted}
                  onPress={() => handleToggleCheckbox(field.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    opacity: isCompleted ? 0.6 : 1,
                  }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: checked ? colors.primary : colors.border,
                      backgroundColor: checked ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {checked ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
                  </View>
                  <AppText>{field.label}</AppText>
                </Pressable>
              );
            }

            if (field.type === TaskFieldType.Dropdown) {
              const selected = responses[0]?.option_id ?? null;
              return (
                <Stack key={field.id} space="xs" style={{ opacity: isCompleted ? 0.6 : 1 }}>
                  <AppText variant="caption" tone="muted">
                    {field.label}
                  </AppText>
                  {field.options.map((option) => {
                    const active = selected === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        disabled={isCompleted}
                        onPress={() => handleSelectDropdown(field.id, option.id)}
                        style={{
                          borderRadius: radius.md,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primarySoft : colors.surface,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.sm,
                        }}>
                        <AppText tone={active ? 'primary' : 'default'}>{option.label}</AppText>
                      </Pressable>
                    );
                  })}
                </Stack>
              );
            }

            if (field.type === TaskFieldType.TextInput) {
              const value = (responses[0]?.value ?? '') as string;
              return (
                <Stack key={field.id} space="xs">
                  <AppText variant="caption" tone="muted">
                    {field.label}
                  </AppText>
                  <TaskTextFieldInput
                    initialValue={value}
                    editable={!isCompleted}
                    onSave={(text) => handleChangeText(field.id, text)}
                  />
                </Stack>
              );
            }

            return null;
          })}

          {isCompleted ? (
            <Pressable
              onPress={handleUndoTopTaskComplete}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: radius.full,
                borderWidth: 1.5,
                borderColor: colors.success,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.72 : 1,
              })}>
              <Row gap="xs">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText style={{ color: colors.success, fontWeight: '600' }}>Completed</AppText>
              </Row>
              <AppText variant="caption" tone="muted">
                Tap to undo
              </AppText>
            </Pressable>
          ) : (
            <Button label="Mark as done" fullWidth onPress={() => { void handleCompleteTopTask(); }} />
          )}
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
}

function TaskTextFieldInput({
  initialValue,
  editable,
  onSave,
}: {
  initialValue: string;
  editable: boolean;
  onSave: (value: string) => void;
}) {
  const {
    theme: { colors },
  } = useAppTheme();
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      value={localValue}
      onChangeText={setLocalValue}
      onBlur={() => onSave(localValue)}
      editable={editable}
      placeholder="Type here..."
      multiline
      style={{ opacity: editable ? 1 : 0.6, color: editable ? colors.text : colors.textMuted }}
    />
  );
}
