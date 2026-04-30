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

import { AnnouncementForm } from '@/components/announcement/AnnouncementForm';
import { EventDetailModal } from '@/components/events/event-detail-modal';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { TaskDetailModal } from '@/components/tasks/task-detail-modal';
import { Card } from '@/components/ui/card';
import { confirmDestructiveAction } from '@/components/ui/confirm-destructive-action';
import { Container } from '@/components/ui/container';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripBannerUrl } from '@/hooks/use-trip-banner-url';
import { getEventBannerUrl } from '@/services/events.service';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useAuthStore } from '@/store/auth.store';
import { useEventsStore } from '@/store/events.store';
import { useProfileStore } from '@/store/profile.store';
import { useTasksStore } from '@/store/tasks.store';
import { useTripStore } from '@/store/trip.store';
import type { Announcement, Task } from '@/types';
import { TripRole } from '@/types';

const HERO_HEIGHT = 320;
const SHEET_OVERLAP = 72;

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

function sortTasks(tasks: Task[], assignments: Record<string, { is_completed: boolean | null }>): Task[] {
  return [...tasks].sort((a, b) => {
    const aDone = assignments[a.id]?.is_completed ?? false;
    const bDone = assignments[b.id]?.is_completed ?? false;
    if (aDone !== bDone) return aDone ? 1 : -1;
    const aMandatory = a.is_mandatory ?? false;
    const bMandatory = b.is_mandatory ?? false;
    if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
    const aDue = a.due_time ? new Date(a.due_time).getTime() : Number.MAX_SAFE_INTEGER;
    const bDue = b.due_time ? new Date(b.due_time).getTime() : Number.MAX_SAFE_INTEGER;
    return aDue - bDue;
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
  const bannerUrl = useTripBannerUrl(currentTrip?.banner_image_url);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [eventPreviewUrls, setEventPreviewUrls] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  const selectedEvent = selectedEventId
    ? (events.find((event) => event.id === selectedEventId) ?? null)
    : null;
  const editingAnnouncement = params.editAnnouncement
    ? (announcements.find((announcement) => announcement.id === params.editAnnouncement) ?? null)
    : null;

  const sortedTasks = useMemo(() => sortTasks(tasks, assignments), [assignments, tasks]);
  const visibleTasks = sortedTasks;
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aMandatory = a.is_optional === false;
        const bMandatory = b.is_optional === false;
        if (aMandatory !== bMandatory) return aMandatory ? -1 : 1;
        const aTime = a.start_time ? new Date(a.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.start_time ? new Date(b.start_time).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }),
    [events],
  );
  const visibleEvents = useMemo(() => {
    const mandatoryEvents = sortedEvents.filter((event) => event.is_optional === false);
    return mandatoryEvents.length > 0 ? mandatoryEvents : sortedEvents;
  }, [sortedEvents]);
  const latestAnnouncement = announcements[0] ?? null;
  const loading = eventsLoading || tasksLoading || announcementsLoading;
  const announcementEditorVisible = params.compose === 'announcement' || !!editingAnnouncement;
  const visibleTaskIds = useMemo(() => visibleTasks.map((task) => task.id), [visibleTasks]);
  const isInitialLoading =
    loading &&
    announcements.length === 0 &&
    visibleEvents.length === 0 &&
    visibleTasks.length === 0;

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
    const eventsWithBanner = visibleEvents.filter((event) => event.banner_image_url);
    if (eventsWithBanner.length === 0) {
      setEventPreviewUrls({});
      return;
    }

    let cancelled = false;
    Promise.all(
      eventsWithBanner.map(async (event) => {
        const url = await getEventBannerUrl(event.banner_image_url);
        return [event.id, url] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) setEventPreviewUrls(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setEventPreviewUrls({});
      });

    return () => {
      cancelled = true;
    };
  }, [visibleEvents]);

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
        }}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.primarySoft }} />
        )}
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: bannerUrl ? colors.overlayStrong : colors.transparent,
          }}
        />
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

              <Stack space="sm">
                <SectionHeader title="Announcements" count={announcements.length} />
                <AnnouncementPreview />
              </Stack>

              {visibleEvents.length > 0 ? (
                <Stack space="sm">
                  <SectionHeader title="Events" count={visibleEvents.length} />
                  <Stack space="xs">
                    {visibleEvents.map((event) => (
                      <CompactOverviewRow
                        key={event.id}
                        imageUri={eventPreviewUrls[event.id] ?? bannerUrl}
                        icon="calendar-outline"
                        title={event.title ?? 'Untitled event'}
                        date={formatEventTime(event.start_time, event.end_time)}
                        place={event.location}
                        description={event.description}
                        onPress={() => setSelectedEventId(event.id)}
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : null}

              {visibleTasks.length > 0 ? (
                <Stack space="sm">
                  <SectionHeader title="Tasks" count={visibleTasks.length} />
                  <Stack space="xs">
                    {visibleTasks.map((task) => (
                      <CompactOverviewRow
                        key={task.id}
                        imageUri={bannerUrl}
                        icon="checkbox-outline"
                        title={task.title ?? 'Untitled task'}
                        date={formatDue(task.due_time)}
                        description={task.description}
                        onPress={() => setSelectedTask(task)}
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : null}

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

  function CompactOverviewRow({
    imageUri,
    icon,
    title,
    date,
    place,
    description,
    onPress,
  }: {
    imageUri?: string | null;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    date?: string | null;
    place?: string | null;
    description?: string | null;
    onPress?: () => void;
  }) {
    return (
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          padding: spacing.sm,
          ...shadows.sm,
          opacity: pressed ? 0.78 : 1,
        })}>
        <Row gap="sm" align="center">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              resizeMode="cover"
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceMuted,
              }}
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={[typography.label, { lineHeight: 18 }]} numberOfLines={1}>
              {title}
            </AppText>
            {date || place ? (
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {[date, place].filter(Boolean).join(' · ')}
              </AppText>
            ) : null}
            {description ? (
              <AppText variant="caption" tone="muted" numberOfLines={1}>
                {description}
              </AppText>
            ) : null}
          </View>
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
        </Row>
      </Pressable>
    );
  }

  function SectionHeader({ title, count }: { title: string; count: number }) {
    return (
      <Row justify="space-between" align="center">
        <AppText style={typography.label}>{title}</AppText>
        <View
          style={{
            minWidth: 28,
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            borderRadius: radius.full,
            backgroundColor: colors.surfaceMuted,
            alignItems: 'center',
          }}>
          <AppText variant="caption" tone="muted">
            {count}
          </AppText>
        </View>
      </Row>
    );
  }

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
        <Card style={{ padding: spacing.md }}>
          <AppText style={typography.label}>No announcements</AppText>
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
            Nothing posted yet
          </AppText>
        </Card>
      );
    }

    return (
      <Card
        variant="interactive"
        onPress={() => setSelectedAnnouncement(latestAnnouncement)}
        style={{ padding: spacing.md, backgroundColor: colors.surface }}>
        <Stack space="xs">
          <Row justify="space-between" align="flex-start" gap="sm">
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle" numberOfLines={2}>
                {latestAnnouncement.title}
              </AppText>
              <AppText variant="caption" tone="muted" style={{ marginTop: 2 }}>
                {formatFullDay(latestAnnouncement.created_at)}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Row>
          {latestAnnouncement.description ? (
            <AppText tone="muted" numberOfLines={5}>
              {latestAnnouncement.description}
            </AppText>
          ) : null}
          <Pressable
            onPress={() => setSelectedAnnouncement(latestAnnouncement)}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingVertical: spacing.xs / 2,
              opacity: pressed ? 0.72 : 1,
            })}>
            <AppText variant="caption" tone="primary" style={{ fontWeight: '700' }}>
              View more
            </AppText>
          </Pressable>
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

}
