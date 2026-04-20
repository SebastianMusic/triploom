import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { Event } from '@/types';

type EventCardProps = {
  event: Event;
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

        {event.price_range ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">
              {event.price_range}
            </AppText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
