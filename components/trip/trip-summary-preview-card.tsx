import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ImageBackground, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type Props = {
  bannerUri?: string | null;
  dateLabel: string;
  title: string;
  highlight: string;
  meta?: string | null;
  roleLabel: 'Organizer' | 'Participant';
  disabled?: boolean;
  selecting?: boolean;
  onPress?: () => void;
};

function StatusPill({ label }: { label: 'Organizer' | 'Participant' }) {
  const {
    theme: { colors, radius },
  } = useAppTheme();

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        width: 36,
        height: 36,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons
        name={label === 'Organizer' ? 'construct-outline' : 'person-outline'}
        size={16}
        color={colors.primary}
      />
    </View>
  );
}

export function TripSummaryPreviewCard({
  bannerUri,
  dateLabel,
  title,
  highlight,
  meta,
  roleLabel,
  disabled = false,
  selecting = false,
  onPress,
}: Props) {
  const {
    theme: { colors, opacity, radius, spacing, typography },
  } = useAppTheme();

  return (
    <Pressable
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        opacity: disabled ? 0.65 : pressed ? opacity.pressed : 1,
      })}>
      <View
        style={{
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        }}>
        <View style={{ position: 'relative', aspectRatio: 3 / 2, backgroundColor: colors.primary }}>
          {bannerUri ? (
            <ImageBackground source={{ uri: bannerUri }} resizeMode="cover" style={{ flex: 1 }}>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: colors.overlayStrong,
                  opacity: 0.34,
                }}
              />
              <CardContent
                dateLabel={dateLabel}
                title={title}
                highlight={highlight}
                meta={meta}
                roleLabel={roleLabel}
              />
            </ImageBackground>
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                backgroundColor: colors.primary,
                overflow: 'hidden',
              }}>
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: colors.overlayStrong,
                  opacity: 0.28,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -42,
                  right: -28,
                  width: 142,
                  height: 142,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: colors.primarySoft,
                  opacity: 0.24,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: -20,
                  bottom: 34,
                  width: '72%',
                  height: 1,
                  backgroundColor: colors.primarySoft,
                  opacity: 0.28,
                  transform: [{ rotate: '-10deg' }],
                }}
              />
              <CardContent
                dateLabel={dateLabel}
                title={title}
                highlight={highlight}
                meta={meta}
                roleLabel={roleLabel}
              />
            </View>
          )}

          {selecting ? (
            <View
              style={{
                position: 'absolute',
                right: spacing.sm,
                bottom: spacing.sm,
              }}>
              <ActivityIndicator color={colors.textOnPrimary} />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  function CardContent({
    dateLabel: cardDateLabel,
    title: cardTitle,
    highlight: cardHighlight,
    meta: cardMeta,
    roleLabel: cardRoleLabel,
  }: {
    dateLabel: string;
    title: string;
    highlight: string;
    meta?: string | null;
    roleLabel: 'Organizer' | 'Participant';
  }) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing.md,
          justifyContent: 'space-between',
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: spacing.sm,
          }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText style={[typography.body, { color: colors.textOnPrimary, fontSize: 14, lineHeight: 18 }]}>
              {cardDateLabel}
            </AppText>
            <AppText
              numberOfLines={2}
              style={[
                typography.title,
                { color: colors.textOnPrimary, fontSize: 28, lineHeight: 30 },
              ]}>
              {cardTitle}
            </AppText>
          </View>
          <StatusPill label={cardRoleLabel} />
        </View>

        <View
          style={{
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.22)',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}>
          <View
            style={{
              flex: 1,
              paddingRight: spacing.md,
            }}>
            <AppText
              numberOfLines={2}
              style={[typography.subtitle, { color: colors.textOnPrimary, fontSize: 18, lineHeight: 22 }]}>
              {cardHighlight}
            </AppText>
          </View>
          {cardMeta ? (
            <AppText
              numberOfLines={2}
              style={[
                typography.caption,
                { color: colors.textOnPrimary, opacity: 0.84, textAlign: 'right', maxWidth: '42%' },
              ]}>
              {cardMeta}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  }
}
