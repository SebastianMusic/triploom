import { ImageBackground, Pressable, View, type PressableProps } from 'react-native';

import { getShadow } from '@/components/ui/shadow';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/hooks/use-app-theme';

export type EventCardProps = PressableProps & {
  title: string;
  location: string;
  startsAt: string;
  host: string;
  attendees: number;
  imageUrl: string;
  featured?: boolean;
};

export function EventCard({
  title,
  location,
  startsAt,
  host,
  attendees,
  imageUrl,
  featured = false,
  ...props
}: EventCardProps) {
  const {
    theme: { colors, spacing, radius, typography },
  } = useAppTheme();
  const imageHeight = featured ? spacing.xl * 4 : spacing.xl * 3;

  return (
    <Pressable
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.995 : 1 }],
      })}
      {...props}>
        <View
          style={{
            borderRadius: radius.l,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            ...getShadow('lg', colors.shadow),
          }}>
        <ImageBackground
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: imageHeight,
            justifyContent: 'flex-end',
          }}
          imageStyle={{ borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.imageOverlayStrong,
            }}
          />
          <View style={{ paddingHorizontal: spacing.m, paddingBottom: spacing.m, gap: spacing.s / 3 }}>
            <AppText
              variant="subtitle"
              style={{
                color: colors.textOnImage,
                lineHeight: typography.subtitle.lineHeight,
                fontSize: featured ? typography.subtitle.fontSize + 2 : typography.subtitle.fontSize,
              }}>
              {title}
            </AppText>
            <AppText tone="muted" style={{ color: colors.textOnImageMuted }}>
              {startsAt} · {location}
            </AppText>
          </View>
        </ImageBackground>
        <View style={{ paddingHorizontal: spacing.m, paddingVertical: spacing.s + spacing.s / 2 }}>
          <AppText tone="muted">
            Hosted by {host} · {attendees} attending
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
