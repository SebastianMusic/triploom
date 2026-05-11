import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSheetModal } from '@/components/ui/page-sheet-modal';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskFieldType } from '@/types/tasks.types';
import type { Task, TaskAssignment, TaskFieldResponse } from '@/types';
import type { TaskFieldWithOptions } from '@/services/tasks.service';

export type PendingResponseMap = Record<string, { option_id?: string | null; is_checked?: boolean | null; value?: string | null }[]>;

export function TaskDetailModal({
  task,
  fields,
  assignment,
  myFieldResponses,
  onClose,
  onMarkComplete,
  onUndoComplete,
  onEdit,
  onDelete,
}: {
  task: Task | null;
  fields: TaskFieldWithOptions[];
  assignment: TaskAssignment | null;
  myFieldResponses: Record<string, TaskFieldResponse[]>;
  onClose: () => void;
  onMarkComplete: (pending: PendingResponseMap) => Promise<void>;
  onUndoComplete: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { theme: { colors, spacing, sizes, radius } } = useAppTheme();
  const [pending, setPending] = useState<PendingResponseMap>({});
  const [completing, setCompleting] = useState(false);
  const isCompleted = assignment?.is_completed ?? false;

  useEffect(() => { setPending({}); }, [task?.id]);

  if (!task) return null;

  function getResponses(fieldId: string) {
    if (isCompleted) return myFieldResponses[fieldId] ?? [];
    return pending[fieldId] ?? [];
  }

  function handleToggleCheckbox(fieldId: string) {
    setPending((prev) => {
      const current = prev[fieldId]?.[0]?.is_checked ?? false;
      return { ...prev, [fieldId]: [{ option_id: null, is_checked: !current }] };
    });
  }

  function handleSelectSingleChoice(fieldId: string, optionId: string) {
    setPending((prev) => ({ ...prev, [fieldId]: [{ option_id: optionId, is_checked: null, value: null }] }));
  }

  function handleChangeText(fieldId: string, value: string) {
    setPending((prev) => ({ ...prev, [fieldId]: [{ option_id: null, is_checked: null, value }] }));
  }

  function handleClose() {
    const hasPending = !isCompleted && Object.values(pending).some((r) => r.length > 0);
    if (!hasPending) { onClose(); return; }
    Alert.alert(
      'Unsaved responses',
      'Your responses will not be saved if you close now.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Close anyway', style: 'destructive', onPress: onClose },
      ]
    );
  }

  async function handleMarkComplete() {
    setCompleting(true);
    try {
      await onMarkComplete(pending);
      setPending({});
    } finally {
      setCompleting(false);
    }
  }

  return (
    <PageSheetModal
      visible={!!task}
      title={task.title ?? ''}
      onClose={handleClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          {task.description ? <AppText tone="muted">{task.description}</AppText> : null}

          {task.due_time ? (
            <Row gap="xs">
              <Ionicons name="calendar-outline" size={sizes.icon.sm} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                {new Date(task.due_time).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}
                {new Date(task.due_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </Row>
          ) : null}

          {fields.length > 0 && isCompleted && (
            <Row gap="xs">
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">Undo completion to edit your responses</AppText>
            </Row>
          )}

          {/* Fields */}
          {fields.map((field) => {
            const responses = getResponses(field.id);

            if (field.type === TaskFieldType.Checkbox) {
              const checked = responses[0]?.is_checked ?? false;
              return (
                <Pressable
                  key={field.id}
                  disabled={isCompleted}
                  onPress={() => handleToggleCheckbox(field.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: isCompleted ? 0.6 : 1 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                    borderColor: checked ? colors.primary : colors.border,
                    backgroundColor: checked ? colors.primary : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
                  </View>
                  <AppText>{field.label}</AppText>
                </Pressable>
              );
            }

            if (field.type === TaskFieldType.SingleChoice) {
              const selected = responses[0]?.option_id ?? null;
              return (
                <Stack key={field.id} space="xs" style={{ opacity: isCompleted ? 0.6 : 1 }}>
                  <AppText variant="caption" tone="muted">{field.label}</AppText>
                  {field.options.map((opt) => {
                    const active = selected === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        disabled={isCompleted}
                        onPress={() => handleSelectSingleChoice(field.id, opt.id)}
                        style={{
                          borderRadius: radius.md, borderWidth: 1.5,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primarySoft : colors.surface,
                          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                        }}>
                        <AppText tone={active ? 'primary' : 'default'}>{opt.label}</AppText>
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
                  <AppText variant="caption" tone="muted">{field.label}</AppText>
                  <TextResponseInput
                    initialValue={value}
                    editable={!isCompleted}
                    onSave={(text) => handleChangeText(field.id, text)}
                  />
                </Stack>
              );
            }

            return null;
          })}


          {/* Complete toggle */}
          {isCompleted ? (
            <Pressable
              onPress={() => {
                const prefilled: PendingResponseMap = {};
                for (const [fieldId, responses] of Object.entries(myFieldResponses)) {
                  if (responses.length > 0) {
                    prefilled[fieldId] = responses.map((r) => ({
                      option_id: r.option_id,
                      is_checked: r.is_checked,
                      value: r.value,
                    }));
                  }
                }
                setPending(prefilled);
                onUndoComplete();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.success,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Row gap="xs">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText style={{ color: colors.success, fontWeight: '600' }}>Completed</AppText>
              </Row>
              <AppText variant="caption" tone="muted">Tap to undo</AppText>
            </Pressable>
          ) : (
            <Button
              label="Mark as done"
              fullWidth
              onPress={handleMarkComplete}
              disabled={completing}
            />
          )}
        </ScrollView>
    </PageSheetModal>
  );
}

function TextResponseInput({
  initialValue,
  editable,
  onSave,
}: {
  initialValue: string;
  editable: boolean;
  onSave: (value: string) => void;
}) {
  const { theme: { colors } } = useAppTheme();
  const [localValue, setLocalValue] = useState(initialValue);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setLocalValue(initialValue);
  }, [initialValue]);

  return (
    <Input
      value={localValue}
      onChangeText={setLocalValue}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; onSave(localValue); }}
      editable={editable}
      placeholder="Type here..."
      multiline
      style={{ opacity: editable ? 1 : 0.6, color: editable ? colors.text : colors.textMuted }}
    />
  );
}
