import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { EventWithCount } from '@/services/events.service';

type EventCardProps = {
  event: EventWithCount;
  onPress?: () => void;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventCard({ event, onPress }: EventCardProps) {
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  const participantCount = event.event_participation.length;

  return (
    <Card variant="interactive" onPress={onPress}>
      <AppText variant="subtitle" style={{ marginBottom: spacing.xs / 2 }}>
        {event.title}
      </AppText>

      {event.description ? (
        <AppText variant="body" tone="muted" numberOfLines={2} style={{ marginBottom: spacing.xs }}>
          {event.description}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.xs / 2 }}>
        {event.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">
              {event.location}
            </AppText>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            {formatDateTime(event.start_time)} – {formatDateTime(event.end_time)}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {event.price_range ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
              <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                {event.price_range}
              </AppText>
            </View>
          ) : <View />}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}
