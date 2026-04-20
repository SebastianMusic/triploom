import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Row } from '@/components/ui/row';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { Task, TaskAssignment } from '@/types';

export function TaskCard({
  task,
  assignment,
  onPress,
}: {
  task: Task;
  assignment: TaskAssignment | null;
  onPress: () => void;
}) {
  const { theme: { colors, sizes } } = useAppTheme();
  const isCompleted = assignment?.is_completed ?? false;

  return (
    <Card onPress={onPress}>
      <Row align="center" gap="sm">
        <View style={{
          width: 24, height: 24, borderRadius: 6,
          borderWidth: 2,
          borderColor: isCompleted ? colors.success : colors.border,
          backgroundColor: isCompleted ? colors.success : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isCompleted ? <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} /> : null}
        </View>

        <View style={{ flex: 1, paddingVertical: 2 }}>
          <AppText
            style={{
              color: isCompleted ? colors.textMuted : colors.text,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            }}>
            {task.title}
          </AppText>
          {task.due_time ? (
            <AppText variant="caption" tone="muted">
              {new Date(task.due_time).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}
            </AppText>
          ) : null}
        </View>

        <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.textMuted} />
      </Row>
    </Card>
  );
}
