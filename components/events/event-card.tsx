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
  const isMandatory = event.is_optional === false;
  const creatorName = event.creator?.profile?.user_name ?? null;

  return (
    <Card
      variant="interactive"
      onPress={onPress}
      style={isMandatory ? { borderLeftWidth: 3, borderLeftColor: colors.warning } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2, marginBottom: spacing.xs / 2 }}>
        {isMandatory ? (
          <View style={{ backgroundColor: colors.warning, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <AppText variant="caption" style={{ color: '#fff', fontSize: 11 }}>Mandatory</AppText>
          </View>
        ) : null}
        <AppText variant="subtitle">{event.title}</AppText>
      </View>

      {event.description ? (
        <AppText variant="body" tone="muted" numberOfLines={2} style={{ marginBottom: spacing.xs }}>
          {event.description}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.xs / 2 }}>
        {event.location_label ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">
              {event.location_label}
            </AppText>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            {formatDateTime(event.start_time)} – {formatDateTime(event.end_time)}
          </AppText>
        </View>

        {creatorName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs / 2 }}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <AppText variant="caption" tone="muted">{creatorName}</AppText>
          </View>
        ) : null}

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
