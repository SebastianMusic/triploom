import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Avatar } from '@/components/ui/avatar';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskFieldType } from '@/types/tasks.types';
import type { Task } from '@/types';
import type { TripParticipantWithProfile } from '@/services/trip.service';
import type { AssignmentWithParticipant, TaskFieldWithOptions, FieldResponseWithParticipant } from '@/services/tasks.service';

type SelectedPerson = {
  participant_id: string;
  name: string;
  avatarUrl: string | null | undefined;
  assignment: AssignmentWithParticipant | null;
};

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
  const [completionView, setCompletionView] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ label: string; responses: FieldResponseWithParticipant[] } | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedTask(null);
      setCompletionView(false);
      setSelectedPerson(null);
      setSelectedOption(null);
    }
  }, [visible]);

  function handleBack() {
    if (selectedPerson) { setSelectedPerson(null); return; }
    if (selectedOption) { setSelectedOption(null); return; }
    if (completionView) { setCompletionView(false); return; }
    setSelectedTask(null);
  }

  function handleSelectTask(task: Task) {
    setSelectedTask(task);
    setCompletionView(false);
    setSelectedPerson(null);
    setSelectedOption(null);
  }

  const title = selectedPerson
    ? selectedPerson.name
    : selectedOption ? selectedOption.label
    : completionView ? 'Fullføring'
    : selectedTask ? selectedTask.title : 'Statistikk';

  const showBack = !!(selectedTask);
  const totalParticipants = participants.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
        }}>
          {showBack ? (
            <Pressable onPress={handleBack} style={{ padding: spacing.xs / 2, marginRight: spacing.xs }}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <AppText variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>{title}</AppText>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {selectedPerson && selectedTask ? (
          <PersonDetailStats
            participantId={selectedPerson.participant_id}
            assignment={selectedPerson.assignment}
            fields={fields[selectedTask.id] ?? []}
            allFieldResponses={allFieldResponses}
          />
        ) : selectedOption ? (
          <OptionDetailList responses={selectedOption.responses} />
        ) : completionView && selectedTask ? (
          <CompletionList
            participants={participants}
            allAssignments={allAssignments[selectedTask.id] ?? []}
            taskTitle={selectedTask.title ?? ''}
            onSelectPerson={setSelectedPerson}
            onSendReminder={onSendReminder}
          />
        ) : selectedTask ? (
          <TaskDetailStats
            task={selectedTask}
            fields={fields[selectedTask.id] ?? []}
            allAssignments={allAssignments[selectedTask.id] ?? []}
            allFieldResponses={allFieldResponses}
            totalParticipants={totalParticipants}
            onOpenCompletion={() => setCompletionView(true)}
            onSelectOption={(label, responses) => setSelectedOption({ label, responses })}
          />
        ) : (
          <TaskOverallList
            tasks={tasks}
            allAssignments={allAssignments}
            totalParticipants={totalParticipants}
            onSelect={handleSelectTask}
          />
        )}
      </View>
    </Modal>
  );
}

function TaskOverallList({
  tasks,
  allAssignments,
  totalParticipants,
  onSelect,
}: {
  tasks: Task[];
  allAssignments: Record<string, AssignmentWithParticipant[]>;
  totalParticipants: number;
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
        const completed = assignments.filter(a => a.is_completed).length;
        const total = totalParticipants;
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

function CompletionList({
  participants,
  allAssignments,
  taskTitle,
  onSelectPerson,
  onSendReminder,
}: {
  participants: TripParticipantWithProfile[];
  allAssignments: AssignmentWithParticipant[];
  taskTitle: string;
  onSelectPerson: (p: SelectedPerson) => void;
  onSendReminder: (taskTitle: string, userIds: string[]) => Promise<void>;
}) {
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();
  const [sending, setSending] = useState(false);

  const completedIds = new Set(allAssignments.filter(a => a.is_completed).map(a => a.participant_id));
  const nonCompleters = participants.filter(p => !completedIds.has(p.id));
  const completedCount = participants.length - nonCompleters.length;

  async function handleSendReminder() {
    const userIds = nonCompleters.map(p => p.user_id).filter((id): id is string => id !== null);
    setSending(true);
    try {
      await onSendReminder(taskTitle, userIds);
      Alert.alert('Sendt!', `Påminnelse sendt til ${nonCompleters.length} deltaker${nonCompleters.length === 1 ? '' : 'e'}.`);
    } catch {
      Alert.alert('Feil', 'Kunne ikke sende påminnelse. Prøv igjen.');
    } finally {
      setSending(false);
    }
  }

  const sorted = [...participants].sort((a, b) => {
    const aCompleted = completedIds.has(a.id);
    const bCompleted = completedIds.has(b.id);
    if (aCompleted === bCompleted) return 0;
    return aCompleted ? -1 : 1;
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
        borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <Row gap="xs">
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.textMuted} />
          <AppText variant="caption" style={{ fontWeight: '600' }}>
            {completedCount}/{participants.length} fullført
          </AppText>
        </Row>
        {nonCompleters.length > 0 && (
          <Pressable
            onPress={handleSendReminder}
            disabled={sending}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2,
              backgroundColor: colors.primary, borderRadius: radius.full,
              paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
              opacity: pressed || sending ? 0.7 : 1,
            })}>
            <Ionicons name="notifications-outline" size={14} color={colors.textOnPrimary} />
            <AppText variant="caption" style={{ color: colors.textOnPrimary, fontWeight: '600' }}>
              {sending ? 'Sender…' : 'Send påminnelse'}
            </AppText>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}>
        {sorted.map((participant) => {
          const assignment = allAssignments.find(a => a.participant_id === participant.id) ?? null;
          const name = participant.profile?.user_name ?? 'Ukjent';
          const avatarUrl = participant.profile?.profile_picture_url ?? undefined;
          const isCompleted = assignment?.is_completed ?? false;
          return (
            <Pressable
              key={participant.id}
              onPress={() => onSelectPerson({ participant_id: participant.id, name, avatarUrl, assignment })}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                backgroundColor: colors.surface, borderRadius: radius.md,
                paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                opacity: pressed ? 0.7 : 1,
                marginBottom: spacing.xs / 2,
              })}>
              <Avatar name={name} size="sm" source={avatarUrl ? { uri: avatarUrl } : undefined} />
              <AppText style={{ flex: 1 }}>{name}</AppText>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isCompleted ? colors.success : colors.textMuted}
              />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TaskDetailStats({
  task,
  fields,
  allAssignments,
  allFieldResponses,
  totalParticipants,
  onOpenCompletion,
  onSelectOption,
}: {
  task: Task;
  fields: TaskFieldWithOptions[];
  allAssignments: AssignmentWithParticipant[];
  allFieldResponses: Record<string, FieldResponseWithParticipant[]>;
  totalParticipants: number;
  onOpenCompletion: () => void;
  onSelectOption: (label: string, responses: FieldResponseWithParticipant[]) => void;
}) {
  const { theme: { colors, spacing, radius, stroke, sizes } } = useAppTheme();

  const completed = allAssignments.filter(a => a.is_completed).length;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      {task.description ? (
        <AppText tone="muted">{task.description}</AppText>
      ) : null}

      {task.due_time ? (
        <Row gap="xs">
          <Ionicons name="calendar-outline" size={sizes.icon.sm} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            {new Date(task.due_time).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}
            {new Date(task.due_time).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
          </AppText>
        </Row>
      ) : null}

      {/* Completion — navigates to full list */}
      <Pressable
        onPress={onOpenCompletion}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderRadius: radius.md, borderWidth: stroke.thin, borderColor: colors.border,
          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          opacity: pressed ? 0.8 : 1,
        })}>
        <Row gap="xs">
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <AppText variant="caption" style={{ fontWeight: '600' }}>
            Fullføring — {completed}/{totalParticipants}
          </AppText>
        </Row>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      {/* Field stats */}
      {fields.map((field) => {
        const responses = allFieldResponses[field.id] ?? [];

        if (field.type === TaskFieldType.Dropdown) {
          const total = responses.length;
          return (
            <Stack key={field.id} space="sm">
              <AppText variant="caption" tone="muted">{field.label}</AppText>
              {field.options.map((opt) => {
                const picked = responses.filter(r => r.option_id === opt.id);
                const pct = total > 0 ? picked.length / total : 0;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => onSelectOption(opt.label, picked)}
                    style={({ pressed }) => ({
                      borderRadius: radius.md, borderWidth: 1.5,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                      gap: spacing.xs / 2,
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <Row justify="space-between">
                      <AppText>{opt.label}</AppText>
                      <Row gap="xs">
                        <AppText variant="caption" tone="muted">{picked.length}</AppText>
                        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                      </Row>
                    </Row>
                    <View style={{
                      height: 4, borderRadius: radius.full,
                      backgroundColor: colors.surfaceMuted, overflow: 'hidden',
                    }}>
                      <View style={{
                        width: `${pct * 100}%`, height: '100%',
                        borderRadius: radius.full, backgroundColor: colors.primary,
                      }} />
                    </View>
                  </Pressable>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.Checkbox) {
          return (
            <Stack key={field.id} space="xs">
              <AppText variant="caption" tone="muted">{field.label}</AppText>
              {field.options.map((opt) => {
                const checked = responses.filter(r => r.option_id === opt.id && r.is_checked);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => onSelectOption(opt.label, checked)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                      opacity: pressed ? 0.7 : 1,
                    })}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                      borderColor: checked.length > 0 ? colors.primary : colors.border,
                      backgroundColor: checked.length > 0 ? colors.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked.length > 0
                        ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
                        : null}
                    </View>
                    <AppText style={{ flex: 1 }}>{opt.label}</AppText>
                    <Row gap="xs">
                      <AppText variant="caption" tone="muted">{checked.length}</AppText>
                      <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                    </Row>
                  </Pressable>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.TextInput) {
          const count = responses.filter(r => r.value).length;
          return (
            <Stack key={field.id} space="xs">
              <AppText variant="caption" tone="muted">{field.label}</AppText>
              <View style={{
                minHeight: 64, borderRadius: radius.md, borderWidth: stroke.thin,
                borderColor: colors.border, backgroundColor: colors.surface,
                paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <AppText tone="muted" variant="caption">Tekstsvar</AppText>
                <AppText variant="caption" tone="muted">
                  {count === 0 ? 'Ingen svar' : `${count} svart`}
                </AppText>
              </View>
            </Stack>
          );
        }

        return null;
      })}
    </ScrollView>
  );
}

function PersonDetailStats({
  participantId,
  assignment,
  fields,
  allFieldResponses,
}: {
  participantId: string;
  assignment: AssignmentWithParticipant | null;
  fields: TaskFieldWithOptions[];
  allFieldResponses: Record<string, FieldResponseWithParticipant[]>;
}) {
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();
  const isCompleted = assignment?.is_completed ?? false;

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
      <Row gap="sm" style={{
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.md, borderWidth: stroke.thin,
        borderColor: isCompleted ? colors.success : colors.border,
        paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
      }}>
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={isCompleted ? colors.success : colors.textMuted}
        />
        <AppText style={{ color: isCompleted ? colors.success : colors.textMuted, fontWeight: '600' }}>
          {isCompleted ? 'Fullført' : 'Ikke fullført'}
        </AppText>
      </Row>

      {fields.map((field) => {
        const allResponses = allFieldResponses[field.id] ?? [];
        const myResponses = allResponses.filter(r => r.participant_id === participantId);

        if (field.type === TaskFieldType.Checkbox) {
          return (
            <Stack key={field.id} space="xs">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              {field.options.map((opt) => {
                const checked = myResponses.some(r => r.option_id === opt.id && r.is_checked);
                return (
                  <Row key={opt.id} gap="sm" style={{
                    backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
                    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                  }}>
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={checked ? colors.primary : colors.textMuted}
                    />
                    <AppText variant="caption">{opt.label}</AppText>
                  </Row>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.Dropdown) {
          const selected = myResponses[0]?.option_id;
          return (
            <Stack key={field.id} space="xs">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              {field.options.map((opt) => {
                const active = selected === opt.id;
                return (
                  <Row key={opt.id} gap="sm" style={{
                    backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
                    borderRadius: radius.md, borderWidth: stroke.thin,
                    borderColor: active ? colors.primary : 'transparent',
                    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                  }}>
                    {active && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                    <AppText variant="caption" tone={active ? 'primary' : 'default'}>{opt.label}</AppText>
                  </Row>
                );
              })}
            </Stack>
          );
        }

        if (field.type === TaskFieldType.TextInput) {
          const value = myResponses[0]?.value;
          return (
            <Stack key={field.id} space="xs">
              <AppText variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {field.label}
              </AppText>
              <View style={{
                backgroundColor: colors.surfaceMuted, borderRadius: radius.md,
                borderLeftWidth: 3, borderLeftColor: colors.primary,
                paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
              }}>
                <AppText variant="caption">{value ?? '–'}</AppText>
              </View>
            </Stack>
          );
        }

        return null;
      })}

      {fields.length === 0 && (
        <AppText tone="muted">Ingen felt for denne oppgaven</AppText>
      )}
    </ScrollView>
  );
}

function OptionDetailList({ responses }: { responses: FieldResponseWithParticipant[] }) {
  const { theme: { colors, spacing, radius } } = useAppTheme();

  if (responses.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText tone="muted">Ingen har valgt dette</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.xs }}>
      {responses.map((r) => {
        const name = r.trip_participant?.profile?.user_name ?? 'Ukjent';
        const avatarUrl = r.trip_participant?.profile?.profile_picture_url;
        return (
          <Row key={r.id} gap="sm" style={{
            backgroundColor: colors.surface, borderRadius: radius.md,
            paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          }}>
            <Avatar name={name} size="sm" source={avatarUrl ? { uri: avatarUrl } : undefined} />
            <AppText>{name}</AppText>
          </Row>
        );
      })}
    </ScrollView>
  );
}
