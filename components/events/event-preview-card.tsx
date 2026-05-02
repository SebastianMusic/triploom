import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Row } from '@/components/ui/row';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { getEventBannerUrl, type EventWithCount } from '@/services/events.service';

type EventPreviewCardProps = {
  event: EventWithCount;
  fallbackBannerUri?: string | null;
  onPress?: () => void;
};

function formatFullDay(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatEventTime(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return 'No time set';
  const startText = `${formatFullDay(start)} ${formatTime(start)}`;
  if (!end) return startText;
  return `${startText} - ${formatTime(end)}`;
}

export function EventPreviewCard({ event, fallbackBannerUri, onPress }: EventPreviewCardProps) {
  const {
    theme: { colors, radius, shadows, spacing },
  } = useAppTheme();
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const isMandatory = event.is_optional === false;
  const imageUri = bannerUri ?? fallbackBannerUri ?? null;
  const cardBackground = isMandatory ? colors.secondarySoft : colors.surface;
  const signalColor = isMandatory ? colors.secondary : colors.primary;

  useEffect(() => {
    if (!event.banner_image_url) {
      setBannerUri(null);
      return;
    }

    let cancelled = false;
    getEventBannerUrl(event.banner_image_url)
      .then((url) => {
        if (!cancelled) setBannerUri(url);
      })
      .catch(() => {
        if (!cancelled) setBannerUri(null);
      });

    return () => {
      cancelled = true;
    };
  }, [event.banner_image_url]);

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: cardBackground,
        opacity: pressed ? 0.82 : 1,
        ...shadows.sm,
      })}>
      <View>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            resizeMode="cover"
            style={{ width: '100%', height: 186, backgroundColor: colors.surfaceMuted }}
          />
        ) : (
          <View
            style={{
              height: 186,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isMandatory ? colors.surface : colors.primarySoft,
            }}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={signalColor}
            />
          </View>
        )}
        {isMandatory ? (
          <View
            style={{
              position: 'absolute',
              top: spacing.sm,
              left: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: colors.warning,
              paddingHorizontal: spacing.xs,
              paddingVertical: 4,
            }}>
            <AppText variant="caption" style={{ color: colors.textOnPrimary }}>
              Mandatory
            </AppText>
          </View>
        ) : null}
      </View>

      <Stack space="sm" style={{ padding: spacing.md }}>
        <Row justify="space-between" align="flex-start" gap="sm">
          <View style={{ flex: 1, gap: 6 }}>
            <AppText variant="subtitle" numberOfLines={2}>
              {event.title ?? 'Untitled event'}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Row>

        <EventMeta icon="time-outline" value={formatEventTime(event.start_time, event.end_time)} />
        {event.location ? <EventMeta icon="location-outline" value={event.location} /> : null}
        {event.price_range ? <EventMeta icon="cash-outline" value={event.price_range} /> : null}

        {event.description ? (
          <AppText tone="muted" numberOfLines={3}>
            {event.description}
          </AppText>
        ) : null}
      </Stack>
    </Pressable>
  );

  function EventMeta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
    if (!value) return null;
    return (
      <Row gap="xs" align="center" style={{ maxWidth: '100%' }}>
        <Ionicons name={icon} size={15} color={signalColor} />
        <AppText variant="caption" tone="muted" numberOfLines={2} style={{ flexShrink: 1, lineHeight: 17 }}>
          {value}
        </AppText>
      </Row>
    );
  }
}

export function CompactEventCard({ event, onPress }: Omit<EventPreviewCardProps, 'fallbackBannerUri'>) {
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const isMandatory = event.is_optional === false;
  const signalColor = isMandatory ? colors.secondary : colors.primary;

  useEffect(() => {
    if (!event.banner_image_url) {
      setBannerUri(null);
      return;
    }

    let cancelled = false;
    getEventBannerUrl(event.banner_image_url)
      .then((url) => {
        if (!cancelled) setBannerUri(url);
      })
      .catch(() => {
        if (!cancelled) setBannerUri(null);
      });

    return () => {
      cancelled = true;
    };
  }, [event.banner_image_url]);

  return (
    <Card
      variant="interactive"
      onPress={onPress}
      style={{
        padding: spacing.sm,
        backgroundColor: isMandatory ? colors.secondarySoft : colors.surface,
      }}>
      <Row gap="sm" align="center">
        {bannerUri ? (
          <Image
            source={{ uri: bannerUri }}
            resizeMode="cover"
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceMuted,
            }}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.md,
              backgroundColor: isMandatory ? colors.surface : colors.primarySoft,
            }}
          />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <AppText numberOfLines={1} style={typography.label}>
            {event.title ?? 'Untitled event'}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {formatEventTime(event.start_time, event.end_time)}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={signalColor} />
      </Row>
    </Card>
  );
}
