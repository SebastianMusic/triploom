import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { useAppTheme } from '@/components/ui/theme-provider';
import { TaskFieldType } from '@/types/tasks.types';
import type { Task, TaskAssignment, TaskFieldResponse } from '@/types';
import type { TaskFieldWithOptions } from '@/services/tasks.service';

export type PendingResponseMap = Record<string, { option_id?: string | null; is_checked?: boolean | null; value?: string | null }[]>;

type ResponseLike = { option_id?: string | null; is_checked?: boolean | null; value?: string | null };

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
  const { theme: { colors, spacing, sizes, radius, stroke } } = useAppTheme();
  const [pending, setPending] = useState<PendingResponseMap>({});
  const [completing, setCompleting] = useState(false);
  const isCompleted = assignment?.is_completed ?? false;

  useEffect(() => {
    setPending({});
  }, [task?.id]);

  if (!task) return null;

  function getResponses(fieldId: string): ResponseLike[] {
    if (isCompleted) return myFieldResponses[fieldId] ?? [];
    return pending[fieldId] ?? [];
  }

  function handleToggleCheckbox(fieldId: string, optionId: string) {
    setPending((prev) => {
      const existing = prev[fieldId] ?? [];
      const found = existing.find((r) => r.option_id === optionId);
      if (found) {
        return { ...prev, [fieldId]: existing.map((r) => r.option_id === optionId ? { ...r, is_checked: !r.is_checked } : r) };
      }
      return { ...prev, [fieldId]: [...existing, { option_id: optionId, is_checked: true }] };
    });
  }

  function handleSelectDropdown(fieldId: string, optionId: string) {
    setPending((prev) => ({ ...prev, [fieldId]: [{ option_id: optionId, is_checked: null, value: null }] }));
  }

  function handleChangeText(fieldId: string, value: string) {
    setPending((prev) => ({ ...prev, [fieldId]: [{ option_id: null, is_checked: null, value }] }));
  }

  async function handleMarkComplete() {
    setCompleting(true);
    try {
      await onMarkComplete(pending);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <Modal visible={!!task} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
        }}>
          <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <AppText variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>{task.title}</AppText>
          <Row gap="xs">
            {onEdit && (
              <Pressable onPress={onEdit} style={{ padding: spacing.xs / 2 }}>
                <Ionicons name="pencil-outline" size={20} color={colors.textMuted} />
              </Pressable>
            )}
            {onDelete && (
              <Pressable onPress={onDelete} style={{ padding: spacing.xs / 2 }}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            )}
          </Row>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} keyboardShouldPersistTaps="handled">
          {task.description ? <AppText tone="muted">{task.description}</AppText> : null}

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

          {fields.length > 0 && isCompleted && (
            <Row gap="xs">
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">Angre fullføring for å redigere svarene dine</AppText>
            </Row>
          )}

          {/* Fields */}
          {fields.map((field) => {
            const responses = getResponses(field.id);

            if (field.type === TaskFieldType.Checkbox) {
              return (
                <Stack key={field.id} space="xs" style={{ opacity: isCompleted ? 0.6 : 1 }}>
                  <AppText variant="caption" tone="muted">{field.label}</AppText>
                  {field.options.map((opt) => {
                    const checked = responses.some((r) => r.option_id === opt.id && r.is_checked);
                    return (
                      <Pressable
                        key={opt.id}
                        disabled={isCompleted}
                        onPress={() => handleToggleCheckbox(field.id, opt.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                          borderColor: checked ? colors.primary : colors.border,
                          backgroundColor: checked ? colors.primary : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checked ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
                        </View>
                        <AppText>{opt.label}</AppText>
                      </Pressable>
                    );
                  })}
                </Stack>
              );
            }

            if (field.type === TaskFieldType.Dropdown) {
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
                        onPress={() => handleSelectDropdown(field.id, opt.id)}
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
              onPress={onUndoComplete}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.success,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Row gap="xs">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText style={{ color: colors.success, fontWeight: '600' }}>Fullført</AppText>
              </Row>
              <AppText variant="caption" tone="muted">Trykk for å angre</AppText>
            </Pressable>
          ) : (
            <Button
              label={completing ? 'Lagrer...' : 'Marker som ferdig'}
              fullWidth
              loading={completing}
              onPress={handleMarkComplete}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
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
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();
  const [localValue, setLocalValue] = useState(initialValue);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setLocalValue(initialValue);
  }, [initialValue]);

  return (
    <TextInput
      value={localValue}
      onChangeText={setLocalValue}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; onSave(localValue); }}
      editable={editable}
      placeholder="Skriv her..."
      multiline
      placeholderTextColor={colors.textMuted}
      style={{
        minHeight: 80, borderRadius: radius.md, borderWidth: stroke.thin,
        borderColor: colors.border,
        backgroundColor: editable ? colors.surface : colors.surfaceMuted,
        paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
        color: editable ? colors.text : colors.textMuted,
        opacity: editable ? 1 : 0.6,
      }}
    />
  );
}
