import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskFieldType } from '@/types/tasks.types';
import type { Task } from '@/types';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import type { AssignmentWithParticipant, TaskFieldWithOptions, FieldResponseWithParticipant } from '@/services/tasks.service';

export function TaskStatsModal({
  visible,
  tasks,
  fields,
  allAssignments,
  allFieldResponses,
  participants,
  onSendReminder,
  onClose,
}: {
  visible: boolean;
  tasks: Task[];
  fields: Record<string, TaskFieldWithOptions[]>;
  allAssignments: Record<string, AssignmentWithParticipant[]>;
  allFieldResponses: Record<string, FieldResponseWithParticipant[]>;
  participants: TripParticipantWithProfile[];
  onSendReminder: (taskTitle: string, userIds: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const { theme: { colors, spacing, stroke } } = useAppTheme();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!visible) setSelectedTask(null);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
        }}>

          {selectedTask ? (
            <Pressable onPress={() => setSelectedTask(null)} style={{ padding: spacing.xs / 2, marginRight: spacing.xs }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <AppText variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>
            {selectedTask ? selectedTask.title : 'Statistikk'}
          </AppText>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {selectedTask
          ? <TaskDetailStats
              task={selectedTask}
              fields={fields[selectedTask.id] ?? []}
              assignments={allAssignments[selectedTask.id] ?? []}
              allFieldResponses={allFieldResponses}
              participants={participants}
              onSendReminder={onSendReminder}
            />
          : <TaskOverallList
              tasks={tasks}
              allAssignments={allAssignments}
              onSelect={setSelectedTask}
            />
        }
      </View>
    </Modal>
  );
}

function TaskOverallList({
  tasks,
  allAssignments,
  onSelect,
}: {
  tasks: Task[];
  allAssignments: Record<string, AssignmentWithParticipant[]>;
  onSelect: (task: Task) => void;
}) {
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();

  if (tasks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText tone="muted">Ingen oppgaver ennå</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
      {tasks.map((task) => {
        const assignments = allAssignments[task.id] ?? [];
        const total = assignments.length;
        const completed = assignments.filter(a => a.is_completed).length;
        const pct = total > 0 ? completed / total : 0;

        return (
          <Pressable
            key={task.id}
            onPress={() => onSelect(task)}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: stroke.thin,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.xs,
              opacity: pressed ? 0.8 : 1,
            })}>
            <Row justify="space-between" align="center">
              <AppText style={{ flex: 1, fontWeight: '600' }}>{task.title}</AppText>
              <Row gap="xs">
                <AppText variant="caption" tone="muted">
                  {total === 0 ? 'Ingen svar' : `${completed}/${total}`}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Row>
            </Row>
            {total > 0 && (
              <View style={{
                height: 6, borderRadius: radius.full,
                backgroundColor: colors.surfaceMuted, overflow: 'hidden',
              }}>
                <View style={{
                  width: `${pct * 100}%`, height: '100%',
                  borderRadius: radius.full,
                  backgroundColor: pct === 1 ? colors.success : colors.primary,
                }} />
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function TaskDetailStats({
  task,
  fields,
  assignments,
  allFieldResponses,
  participants,
  onSendReminder,
}: {
  task: Task;
  fields: TaskFieldWithOptions[];
  assignments: AssignmentWithParticipant[];
  allFieldResponses: Record<string, FieldResponseWithParticipant[]>;
  participants: TripParticipantWithProfile[];
  onSendReminder: (taskTitle: string, userIds: string[]) => Promise<void>;
}) {
  const { theme: { colors, spacing, radius } } = useAppTheme();
  const [sending, setSending] = useState(false);

  const completedUserIds = new Set(
    assignments
      .filter(a => a.is_completed)
      .map(a => a.trip_participant?.user_id)
      .filter((id): id is string => !!id)
  );

  const notCompletedUserIds = participants
    .map(p => p.user_id)
    .filter((id): id is string => id != null && !completedUserIds.has(id));

  async function sendReminders() {
    if (!notCompletedUserIds.length) return;
    setSending(true);
    try {
      await onSendReminder(task.title, notCompletedUserIds);
      Alert.alert('Sendt!', 'Påminnelse er sendt til deltakerne som ikke har fullført.');
    } catch {
      Alert.alert('Feil', 'Kunne ikke sende påminnelse. Prøv igjen.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      {/* Completion section */}
      <Stack space="sm">
        <Row justify="space-between" align="center">
          <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Fullføring — {completedUserIds.size}/{participants.length}
          </AppText>
          {notCompletedUserIds.length > 0 && (
            <Button
              label={sending ? 'Sender...' : 'Send påminnelse'}
              size="sm"
              variant="ghost"
              loading={sending}
              onPress={sendReminders}
            />
          )}
        </Row>
        {participants.length === 0 ? (
          <AppText tone="muted">Ingen deltakere ennå</AppText>
        ) : (
          participants.map((p) => {
            const name = p.profile?.user_name ?? 'Ukjent';
            const avatarUrl = p.profile?.profile_picture_url ?? null;
            const isCompleted = p.user_id != null && completedUserIds.has(p.user_id);
            return (
              <ParticipantRow
                key={p.id}
                name={name}
                avatarUrl={avatarUrl}
                isCompleted={isCompleted}
              />
            );
          })
        )}
      </Stack>

      {/* Field stats */}
      {fields.map((field) => {
        const responses = allFieldResponses[field.id] ?? [];

        if (field.type === TaskFieldType.Dropdown) {
          const total = responses.length;
          return (
            <Stack key={field.id} space="sm">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              {field.options.map((opt) => {
                const picked = responses.filter(r => r.option_id === opt.id);
                const pct = total > 0 ? picked.length / total : 0;
                const names = picked.map(r => r.trip_participant?.profile?.user_name ?? 'Ukjent').join(', ');
                return (
                  <View key={opt.id} style={{ gap: spacing.xs / 2 }}>
                    <Row justify="space-between">
                      <AppText variant="caption">{opt.label}</AppText>
                      <AppText variant="caption" tone="muted">{picked.length}</AppText>
                    </Row>
                    <View style={{
                      height: 8, borderRadius: 99,
                      backgroundColor: colors.surfaceMuted, overflow: 'hidden',
                    }}>
                      <View style={{
                        width: `${pct * 100}%`, height: '100%',
                        borderRadius: 99, backgroundColor: colors.primary,
                      }} />
                    </View>
                    {names ? <AppText variant="caption" tone="muted">{names}</AppText> : null}
                  </View>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.Checkbox) {
          return (
            <Stack key={field.id} space="sm">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              {field.options.map((opt) => {
                const checked = responses.filter(r => r.option_id === opt.id && r.is_checked);
                const names = checked.map(r => r.trip_participant?.profile?.user_name ?? 'Ukjent').join(', ');
                return (
                  <Row key={opt.id} gap="sm" style={{
                    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
                    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                  }}>
                    <Ionicons
                      name={checked.length > 0 ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={checked.length > 0 ? colors.primary : colors.textMuted}
                    />
                    <AppText variant="caption" style={{ flex: 1 }}>{opt.label}</AppText>
                    <AppText variant="caption" tone="muted">
                      {checked.length > 0 ? names : '–'}
                    </AppText>
                  </Row>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.TextInput) {
          const textResponses = responses.filter(r => r.value);
          return (
            <Stack key={field.id} space="sm">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              {textResponses.length === 0 ? (
                <AppText tone="muted">Ingen har svart ennå</AppText>
              ) : (
                textResponses.map((r) => {
                  const name = r.trip_participant?.profile?.user_name ?? 'Ukjent';
                  const avatarUrl = r.trip_participant?.profile?.profile_picture_url;
                  return (
                    <View key={r.id} style={{
                      backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
                      borderLeftWidth: 3, borderLeftColor: colors.primary,
                      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs / 2,
                    }}>
                      <Row gap="xs">
                        <Avatar name={name} size="sm" source={avatarUrl ? { uri: avatarUrl } : undefined} />
                        <AppText variant="caption" style={{ fontWeight: '600' }}>{name}</AppText>
                      </Row>
                      <AppText variant="caption">{r.value}</AppText>
                    </View>
                  );
                })
              )}
            </Stack>
          );
        }

        return null;
      })}
    </ScrollView>
  );
}

function ParticipantRow({
  name,
  avatarUrl,
  isCompleted,
}: {
  name: string;
  avatarUrl: string | null;
  isCompleted: boolean;
}) {
  const { theme: { colors, spacing, radius } } = useAppTheme();

  return (
    <Row gap="sm" style={{
      backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    }}>
      <Avatar name={name} size="sm" source={avatarUrl ? { uri: avatarUrl } : undefined} />
      <AppText variant="caption" style={{ flex: 1 }}>{name}</AppText>
      <Ionicons
        name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={isCompleted ? colors.success : colors.textMuted}
      />
    </Row>
  );
}
