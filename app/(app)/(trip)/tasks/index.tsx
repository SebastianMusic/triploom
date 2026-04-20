import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTripChromeInsets } from '@/components/layout';
import { AppText } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTasksStore } from '@/store/tasks.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { TaskType, TASK_TYPE_LABELS, createTaskSchema } from '@/types/tasks.types';
import { TripRole } from '@/types/trip.types';
import type { Task } from '@/types';
import type { CreateTaskDTO } from '@/types/tasks.types';

const TASK_TYPE_OPTIONS = Object.values(TaskType);

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { theme: { colors, spacing, sizes } } = useAppTheme();
  const typeLabel = TASK_TYPE_LABELS[task.type as TaskType] ?? task.type;
  const options = Array.isArray(task.options) ? (task.options as string[]) : null;
  const dueDate = task.due_time
    ? new Date(task.due_time).toLocaleDateString('nb-NO', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null;

  return (
    <Card variant={onEdit ? 'interactive' : 'default'} onPress={onEdit}>
      <Stack space="xs">
        <Row justify="space-between" align="flex-start">
          <AppText style={{ flex: 1, fontWeight: '600' }}>{task.title}</AppText>
          <Row gap="xs">
            <Badge label={typeLabel} />
            {onDelete && (
              <IconButton
                variant="ghost"
                size="md"
                icon={<Ionicons name="trash-outline" size={sizes.icon.sm} color={colors.error} />}
                onPress={onDelete}
              />
            )}
          </Row>
        </Row>

        {task.description ? (
          <AppText tone="muted" variant="caption">{task.description}</AppText>
        ) : null}

        {options && options.length > 0 ? (
          <Row gap="xs" style={{ flexWrap: 'wrap' }}>
            {options.map((opt, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: 999,
                  paddingHorizontal: spacing.xs + 4,
                  paddingVertical: 3,
                }}>
                <AppText variant="caption" tone="muted">{opt}</AppText>
              </View>
            ))}
          </Row>
        ) : null}

        <Row gap="lg">
          {dueDate ? (
            <Row gap="xs">
              <Ionicons name="calendar-outline" size={sizes.icon.sm} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">{dueDate}</AppText>
            </Row>
          ) : null}
          {task.allow_note ? (
            <Row gap="xs">
              <Ionicons name="create-outline" size={sizes.icon.sm} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">Notat tillatt</AppText>
            </Row>
          ) : null}
        </Row>
      </Stack>
    </Card>
  );
}

export default function TasksScreen() {
  const { theme: { colors, spacing, radius, sizes } } = useAppTheme();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask } = useTasksStore();
  const { currentParticipant } = useTripStore();
  const { selectedTrip } = useProfileStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType>(TaskType.Checkbox);
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState('');
  const [allowNote, setAllowNote] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState('');

  const isOrganizer =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  useEffect(() => {
    if (selectedTrip) fetchTasks(selectedTrip);
  }, [selectedTrip]);

  function resetForm() {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSelectedType(TaskType.Checkbox);
    setOptions([]);
    setOptionInput('');
    setAllowNote(false);
    setDueDate(null);
    setShowDatePicker(false);
    setTitleError('');
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    setSelectedType((task.type as TaskType) ?? TaskType.Checkbox);
    setOptions(Array.isArray(task.options) ? (task.options as string[]) : []);
    setAllowNote(task.allow_note ?? false);
    setDueDate(task.due_time ? new Date(task.due_time) : null);
    setTitleError('');
    setModalVisible(true);
  }

  function addOption() {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    setOptions((prev) => [...prev, trimmed]);
    setOptionInput('');
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDelete(task: Task) {
    Alert.alert('Slett oppgave', `Er du sikker på at du vil slette "${task.title}"?`, [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
          } catch {
            Alert.alert('Feil', 'Kunne ikke slette oppgaven.');
          }
        },
      },
    ]);
  }

  async function handleSave() {
    const dto: CreateTaskDTO = {
      title,
      description: description || null,
      type: selectedType,
      options: selectedType === TaskType.Dropdown && options.length > 0 ? options : null,
      allow_note: allowNote,
      due_time: dueDate ? dueDate.toISOString() : null,
    };

    const result = createTaskSchema.safeParse(dto);
    if (!result.success) {
      setTitleError(result.error.issues[0].message);
      return;
    }

    if (selectedType === TaskType.Dropdown && options.length < 2) {
      Alert.alert('Mangler valg', 'Legg til minst 2 valg for dropdown-oppgaven.');
      return;
    }

    if (!selectedTrip) return;

    setSaving(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, result.data);
      } else {
        await createTask(selectedTrip, result.data);
      }
      setModalVisible(false);
      resetForm();
    } catch {
      Alert.alert('Feil', 'Kunne ikke lagre oppgaven. Prøv igjen.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerContentOffset,
          paddingBottom: Math.max(spacing.xxxl, bottomOverlayOffset),
        }}
        showsVerticalScrollIndicator={false}>
        <Container>
          {tasks.length === 0 && !isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.xs }}>
              <AppText variant="subtitle">Ingen oppgaver ennå</AppText>
              {isOrganizer && (
                <AppText tone="muted">Trykk + for å legge til en oppgave</AppText>
              )}
            </View>
          ) : (
            <Stack space="sm">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={isOrganizer ? () => openEdit(task) : undefined}
                  onDelete={isOrganizer ? () => handleDelete(task) : undefined}
                />
              ))}
            </Stack>
          )}
        </Container>
      </ScrollView>

      {isOrganizer && (
        <Pressable
          onPress={() => { resetForm(); setModalVisible(true); }}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: bottomOverlayOffset - spacing.xl,
            right: spacing.md,
            width: sizes.iconButton.lg,
            height: sizes.iconButton.lg,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
          })}>
          <Ionicons name="add" size={sizes.icon.lg} color={colors.textOnPrimary} />
        </Pressable>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Button label="Avbryt" variant="ghost" size="sm" onPress={() => { setModalVisible(false); resetForm(); }} />
            <AppText variant="body" style={{ fontWeight: '600' }}>
              {editingTask ? 'Rediger oppgave' : 'Ny oppgave'}
            </AppText>
            <Button label={saving ? 'Lagrer...' : 'Lagre'} size="sm" loading={saving} onPress={handleSave} />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.sm, gap: spacing.sm }}
            keyboardShouldPersistTaps="handled">
            <Stack space="sm">
              <Input
                label="Tittel *"
                placeholder="Hva skal gjøres?"
                value={title}
                onChangeText={(t) => { setTitle(t); setTitleError(''); }}
                error={titleError || undefined}
              />

              <Input
                label="Beskrivelse"
                placeholder="Valgfri beskrivelse"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Stack space="xs">
                <AppText variant="caption">Type</AppText>
                <Row gap="xs" style={{ flexWrap: 'wrap' }}>
                  {TASK_TYPE_OPTIONS.map((type) => {
                    const active = selectedType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setSelectedType(type)}
                        style={{
                          borderRadius: radius.full,
                          borderWidth: 1.5,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primarySoft : colors.surface,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                        }}>
                        <AppText
                          variant="caption"
                          tone={active ? 'primary' : 'muted'}>
                          {TASK_TYPE_LABELS[type]}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </Row>
              </Stack>

              {selectedType === TaskType.Dropdown && (
                <Stack space="xs">
                  <AppText variant="caption">Valg</AppText>
                  {options.map((opt, i) => (
                    <Row key={i} justify="space-between" style={{
                      backgroundColor: colors.surfaceMuted,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                    }}>
                      <AppText style={{ flex: 1 }}>{opt}</AppText>
                      <IconButton
                        variant="ghost"
                        size="md"
                        icon={<Ionicons name="close" size={sizes.icon.sm} color={colors.textMuted} />}
                        onPress={() => removeOption(i)}
                      />
                    </Row>
                  ))}
                  <Row gap="xs">
                    <Input
                      placeholder="Legg til valg..."
                      value={optionInput}
                      onChangeText={setOptionInput}
                      onSubmitEditing={addOption}
                      returnKeyType="done"
                      containerStyle={{ flex: 1 }}
                    />
                    <IconButton
                      size="md"
                      icon={<Ionicons name="add" size={sizes.icon.md} color={colors.textOnPrimary} />}
                      onPress={addOption}
                      style={{ backgroundColor: colors.primary }}
                    />
                  </Row>
                </Stack>
              )}

              <Row justify="space-between" style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              }}>
                <AppText>Tillat mini-notat</AppText>
                <Switch
                  value={allowNote}
                  onValueChange={setAllowNote}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </Row>

              <Stack space="xs">
                <AppText variant="caption">Frist</AppText>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs + 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    opacity: pressed ? 0.7 : 1,
                  })}>
                  <Ionicons name="calendar-outline" size={sizes.icon.sm} color={colors.textMuted} />
                  <AppText tone={dueDate ? 'default' : 'muted'}>
                    {dueDate
                      ? dueDate.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Velg dato'}
                  </AppText>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    onChange={(_: DateTimePickerEvent, date?: Date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setDueDate(date);
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <Button label="Bekreft dato" onPress={() => setShowDatePicker(false)} fullWidth />
                )}
              </Stack>
            </Stack>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
