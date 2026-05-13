import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Row } from '@/components/ui/row';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { Task, TaskAssignment } from '@/types';

function formatTaskTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskCard({
  task,
  assignment,
  eventName,
  isOrganizer,
  compact = false,
  onPress,
  onExportPress,
}: {
  task: Task;
  assignment: TaskAssignment | null;
  eventName?: string | null;
  isOrganizer?: boolean;
  compact?: boolean;
  onPress: () => void;
  onExportPress?: () => void;
}) {
  const { theme: { colors, sizes, spacing, typography } } = useAppTheme();
  const isMandatory = task.is_mandatory ?? false;
  const isCompleted = assignment?.is_completed ?? false;
  const taskTime = formatTaskTime(task.due_time);
  const signalColor = isMandatory && !isCompleted ? colors.secondary : colors.primary;

  if (compact) {
    return (
      <Card
        variant="interactive"
        onPress={onPress}
        style={{
          padding: spacing.sm,
          backgroundColor: isMandatory && !isCompleted ? colors.secondarySoft : colors.surface,
          borderLeftWidth: isMandatory && !isCompleted ? 4 : 0,
          borderLeftColor: isMandatory && !isCompleted ? colors.warning : colors.transparent,
        }}>
        <Row gap="sm" align="center">
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={34} color={colors.success} />
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {isMandatory && !isCompleted ? <MandatoryPill /> : null}
            <AppText numberOfLines={1} style={[typography.label, { color: isCompleted ? colors.textMuted : colors.text }]}>
              {task.title ?? 'Untitled task'}
            </AppText>
            {taskTime ? (
              <Row gap="xs" align="center">
                <Ionicons name="time-outline" size={13} color={signalColor} />
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {taskTime}
                </AppText>
              </Row>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={sizes.icon.sm} color={signalColor} />
        </Row>
      </Card>
    );
  }

  return (
    <Card
      variant="interactive"
      onPress={onPress}
      style={{
        padding: spacing.md,
        backgroundColor: isMandatory && !isCompleted ? colors.secondarySoft : colors.surface,
        borderLeftWidth: isMandatory && !isCompleted ? 4 : 0,
        borderLeftColor: isMandatory && !isCompleted ? colors.warning : colors.transparent,
      }}>
      <Row align="center" gap="sm">
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={34} color={colors.success} />
        ) : null}

        <View style={{ flex: 1, gap: spacing.xs }}>
          {isMandatory && !isCompleted ? <MandatoryPill /> : null}

          <Row align="flex-start" gap="sm">
            <View style={{ flex: 1, gap: 4 }}>
              <AppText
              numberOfLines={2}
              style={{
                ...typography.subtitle,
                color: isCompleted ? colors.textMuted : colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                flexShrink: 1,
                }}>
                {task.title}
              </AppText>
            </View>

            {isOrganizer && onExportPress ? (
              <Pressable
                onPress={onExportPress}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                <Ionicons name="download-outline" size={sizes.icon.sm} color={colors.textMuted} />
              </Pressable>
            ) : null}

            <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.textMuted} />
          </Row>

          <View style={{ gap: 3 }}>
            {taskTime || eventName ? (
              <Row gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
                {taskTime ? (
                  <Row gap="xs" align="center">
                    <Ionicons name="time-outline" size={15} color={signalColor} />
                    <AppText variant="caption" tone="muted">
                      {taskTime}
                    </AppText>
                  </Row>
                ) : null}
                {eventName ? (
                  <Row gap="xs" align="center" style={{ flexShrink: 1 }}>
                    <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                    <AppText variant="caption" tone="primary" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {eventName}
                    </AppText>
                  </Row>
                ) : null}
              </Row>
            ) : null}

            {task.description ? (
              <AppText tone="muted" numberOfLines={2}>
                {task.description}
              </AppText>
            ) : null}
          </View>
        </View>
      </Row>
    </Card>
  );

  function MandatoryPill() {
    return (
      <View
        style={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          backgroundColor: colors.warning,
          paddingHorizontal: spacing.xs,
          paddingVertical: 3,
        }}>
        <AppText variant="caption" style={{ color: colors.textOnPrimary, fontWeight: '700' }}>
          Mandatory
        </AppText>
      </View>
    );
  }
}
