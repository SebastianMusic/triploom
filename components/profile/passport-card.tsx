import { Ionicons } from '@expo/vector-icons';
import { Image, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/text';
import { ProfileBadgeFrame } from '@/components/ui/profile-badge-frame';
import type { ProfileBadgePalette } from '@/constants/profile-badges';
import type { ProfileBadgeLevel } from '@/constants/profile-badges';
import type { AppTheme, ThemeMode } from '@/constants/theme';

export type PassportCardProps = {
  avatarSource: string;
  badgeColors: ProfileBadgePalette;
  badgeLevel: ProfileBadgeLevel;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  colors: AppTheme['colors'];
  email: string;
  fullName: string;
  heroBackground: string;
  heroMutedText: string;
  heroText: string;
  initials: string;
  large?: boolean;
  lineColor: string;
  mode: ThemeMode;
  radius: AppTheme['radius'];
  resolvedTripCount: number;
  shadows: AppTheme['shadows'];
  spacing: AppTheme['spacing'];
  typography: AppTheme['typography'];
};

export function PassportCard({
  avatarSource,
  badgeColors,
  badgeLevel,
  badgeIcon,
  colors,
  email,
  fullName,
  heroBackground,
  heroMutedText,
  heroText,
  initials,
  large = false,
  lineColor,
  mode,
  radius,
  resolvedTripCount,
  shadows,
  spacing,
  typography,
}: PassportCardProps) {
  const avatarDimension = large ? 104 : 86;
  const source: ImageSourcePropType | undefined = avatarSource ? { uri: avatarSource } : undefined;

  return (
    <View
      style={[
        {
          position: 'relative',
          minHeight: large ? 260 : undefined,
          borderRadius: radius.lg,
          backgroundColor: heroBackground,
          borderWidth: 1,
          borderColor: colors.primary,
          padding: large ? spacing.lg : spacing.md,
          gap: spacing.md,
          overflow: 'hidden',
          backfaceVisibility: 'hidden',
        },
        shadows.lg,
      ]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -44,
          right: -34,
          width: large ? 190 : 154,
          height: large ? 190 : 154,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: lineColor,
          opacity: mode === 'dark' ? 0.42 : 0.28,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: large ? 2 : -14,
          right: large ? 22 : 8,
          width: large ? 120 : 96,
          height: large ? 120 : 96,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: lineColor,
          opacity: mode === 'dark' ? 0.48 : 0.36,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -16,
          bottom: large ? 36 : 22,
          width: '72%',
          height: 1,
          backgroundColor: lineColor,
          opacity: mode === 'dark' ? 0.58 : 0.42,
          transform: [{ rotate: '-10deg' }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: large ? 58 : 36,
          bottom: large ? 70 : 48,
          width: '58%',
          height: 1,
          backgroundColor: lineColor,
          opacity: mode === 'dark' ? 0.46 : 0.3,
          transform: [{ rotate: '-10deg' }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: large ? spacing.lg : spacing.md,
          top: large ? spacing.lg : spacing.md,
          opacity: mode === 'dark' ? 0.68 : 0.76,
          transform: [{ rotate: '-18deg' }],
        }}>
        <Ionicons
          name="airplane"
          size={large ? 58 : 42}
          color={mode === 'dark' ? colors.focusRing : colors.textOnPrimary}
        />
      </View>

      <View
        style={{
          alignSelf: 'flex-start',
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.accent,
        }}>
        <Ionicons name="globe-outline" size={14} color={colors.text} />
        <AppText variant="caption" style={{ color: colors.text }}>
          Triploom
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View>
          <ProfileBadgeFrame level={badgeLevel} size={avatarDimension}>
            {source ? (
              <Image
                source={source}
                style={{
                  width: avatarDimension,
                  height: avatarDimension,
                  borderRadius: radius.full,
                  backgroundColor: colors.surfaceMuted,
                }}
              />
            ) : (
              <View
                style={{
                  width: avatarDimension,
                  height: avatarDimension,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}>
                <AppText style={[typography.subtitle, { color: badgeColors.background }]}>
                  {initials}
                </AppText>
              </View>
            )}
          </ProfileBadgeFrame>
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: large ? 36 : 30,
              height: large ? 36 : 30,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: badgeColors.background,
              borderWidth: 2,
              borderColor: heroBackground,
            }}>
            <Ionicons name={badgeIcon} size={large ? 19 : 16} color={badgeColors.text} />
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <AppText variant="subtitle" style={{ color: heroText }} numberOfLines={2}>
            {fullName}
          </AppText>
          <AppText variant="caption" style={{ color: heroMutedText }} numberOfLines={1}>
            {email}
          </AppText>
          <View
            style={{
              alignSelf: 'flex-start',
              minHeight: 38,
              borderRadius: radius.full,
              paddingHorizontal: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.surface,
            }}>
            <Ionicons name="airplane-outline" size={16} color={colors.primary} />
            <AppText style={[typography.label, { color: colors.primary }]}>
              {resolvedTripCount} trips
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

export function PassportCardBack({
  badgeColors,
  colors,
  heroBackground,
  heroText,
  large = false,
  lineColor,
  mode,
  radius,
  resolvedTripCount,
  shadows,
  spacing,
  typography,
}: Pick<
  PassportCardProps,
  | 'badgeColors'
  | 'colors'
  | 'heroBackground'
  | 'heroText'
  | 'large'
  | 'lineColor'
  | 'mode'
  | 'radius'
  | 'resolvedTripCount'
  | 'shadows'
  | 'spacing'
  | 'typography'
>) {
  return (
    <View
      style={[
        {
          minHeight: large ? 260 : undefined,
          borderRadius: radius.lg,
          backgroundColor: heroBackground,
          borderWidth: 1,
          borderColor: colors.primary,
          padding: large ? spacing.lg : spacing.md,
          justifyContent: 'space-between',
          overflow: 'hidden',
          backfaceVisibility: 'hidden',
        },
        shadows.lg,
      ]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -24,
          right: -24,
          top: large ? 52 : 44,
          height: large ? 52 : 42,
          backgroundColor: colors.surface,
          opacity: mode === 'dark' ? 0.2 : 0.32,
          transform: [{ rotate: '-8deg' }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -30,
          bottom: -30,
          width: large ? 170 : 132,
          height: large ? 170 : 132,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: lineColor,
          opacity: mode === 'dark' ? 0.42 : 0.34,
        }}
      />

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" style={{ color: heroText }}>
          TRIPLOOM
        </AppText>
        <View
          style={{
            width: '100%',
            height: large ? 46 : 38,
            borderRadius: radius.sm,
            backgroundColor: colors.surface,
            opacity: mode === 'dark' ? 0.16 : 0.28,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText style={[typography.label, { color: heroText }]}>VALID TRIPS</AppText>
          <AppText style={[typography.subtitle, { color: heroText }]}>
            {resolvedTripCount}
          </AppText>
        </View>
        <View
          style={{
            minWidth: 82,
            borderRadius: radius.full,
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            alignItems: 'center',
            backgroundColor: badgeColors.background,
          }}>
          <AppText variant="caption" style={{ color: badgeColors.text }}>
            VERIFIED
          </AppText>
        </View>
      </View>
    </View>
  );
}
