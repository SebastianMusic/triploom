import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import EditProfileScreen from '@/components/profile/edit-profile-screen';
import { PassportCard, PassportCardBack } from '@/components/profile/passport-card';
import { usePassportPreviewMotion } from '@/components/profile/use-passport-preview-motion';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { BackButton } from '@/components/ui/back-button';
import { Container } from '@/components/ui/container';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import {
  getProfileBadge,
  getProfileBadgePalette,
} from '@/constants/profile-badges';
import { themeColorPresets, type ThemeColorPreset } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useTripChromeStore } from '@/store/trip-chrome.store';
import { type ThemePreference, useThemeStore } from '@/store/theme.store';

type ProfileActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  destructive?: boolean;
  loading?: boolean;
  onPress?: () => void;
};

type ProfileScreenProps = {
  showBackButton?: boolean;
  useTripChromeInsets?: boolean;
};

const themeOptions: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'native', label: 'Native', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const colorPresetOptions: { value: ThemeColorPreset; label: string }[] = [
  { value: 'ocean', label: themeColorPresets.ocean.label },
  { value: 'citrus', label: themeColorPresets.citrus.label },
  { value: 'forest', label: themeColorPresets.forest.label },
  { value: 'rose', label: themeColorPresets.rose.label },
];

export default function ProfileScreen({
  showBackButton = false,
  useTripChromeInsets: shouldUseTripChromeInsets = false,
}: ProfileScreenProps) {
  const { session, signOut } = useAuthStore();
  const {
    profile,
    displayAvatarUrl,
    participatedTripCount,
    participatedTripCountEmail,
    isLoading,
    fetchProfile,
    fetchParticipatedTripCount,
    saveProfileChanges,
  } = useProfileStore();
  const {
    mode,
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const colorPreset = useThemeStore((state) => state.colorPreset);
  const setColorPreset = useThemeStore((state) => state.setColorPreset);
  const setNavigationHidden = useTripChromeStore((state) => state.setNavigationHidden);
  const { headerContentOffset, safeAreaInsets } = useTripChromeInsets();
  const passportPreview = usePassportPreviewMotion();

  const [showEditScreen, setShowEditScreen] = useState(false);
  const [pendingLocalUri, setPendingLocalUri] = useState<string | null>(null);
  const [editableFullName, setEditableFullName] = useState('');
  const [editablePhoneNumber, setEditablePhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [appearanceWidth, setAppearanceWidth] = useState(0);
  const appearanceTranslateIndex = useRef(new Animated.Value(0)).current;
  const [colorPresetWidth, setColorPresetWidth] = useState(0);
  const colorPresetTranslateIndex = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!profile && session?.user) {
      fetchProfile().catch(() => undefined);
    }
  }, [fetchProfile, profile, session]);

  useEffect(() => {
    if (session?.user) {
      fetchParticipatedTripCount().catch(() => undefined);
    }
  }, [fetchParticipatedTripCount, session?.user]);

  const resolvedFullName =
    profile?.user_name ??
    session?.user.user_metadata?.full_name ??
    session?.user.user_metadata?.username ??
    'Not added yet';

  const email = session?.user.email ?? 'Not available';
  const resolvedMobileNumber =
    profile?.phonenumber ?? session?.user.phone ?? session?.user.user_metadata?.phone ?? 'Not added yet';
  const fullName = editableFullName.trim() || 'Not added yet';
  const mobileNumber = resolvedMobileNumber;
  const avatarSource = pendingLocalUri ?? displayAvatarUrl;
  const resolvedTripCount = participatedTripCount ?? 0;
  const badge = getProfileBadge(resolvedTripCount);
  const badgeColors = getProfileBadgePalette(mode, badge.level);
  const heroBackground = mode === 'dark' ? colors.primarySoft : colors.primary;
  const heroText = mode === 'dark' ? colors.text : colors.textOnPrimary;
  const heroMutedText = mode === 'dark' ? colors.secondary : colors.primarySoft;
  const passportLineColor = mode === 'dark' ? colors.focusRing : colors.primarySoft;
  const tripsUntilNextBadge = badge.nextAt === null ? 0 : badge.nextAt - resolvedTripCount;
  const badgeProgress =
    badge.nextAt === null
      ? 100
      : ((resolvedTripCount - badge.startAt) / (badge.nextAt - badge.startAt)) * 100;
  const activeAppearanceIndex = Math.max(
    themeOptions.findIndex((option) => option.value === themePreference),
    0,
  );
  const activeColorPresetIndex = Math.max(
    colorPresetOptions.findIndex((option) => option.value === colorPreset),
    0,
  );
  const appearanceSegmentWidth = appearanceWidth > 0 ? (appearanceWidth - 8) / themeOptions.length : 0;
  const colorPresetSegmentWidth =
    colorPresetWidth > 0 ? (colorPresetWidth - 8) / colorPresetOptions.length : 0;
  useEffect(() => {
    Animated.timing(appearanceTranslateIndex, {
      toValue: activeAppearanceIndex,
      duration: 260,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [activeAppearanceIndex, appearanceTranslateIndex]);

  useEffect(() => {
    Animated.timing(colorPresetTranslateIndex, {
      toValue: activeColorPresetIndex,
      duration: 260,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [activeColorPresetIndex, colorPresetTranslateIndex]);

  useEffect(() => {
    setNavigationHidden(passportPreview.isPreviewVisible);

    return () => {
      setNavigationHidden(false);
    };
  }, [passportPreview.isPreviewVisible, setNavigationHidden]);

  useEffect(() => {
    setEditableFullName(resolvedFullName === 'Not added yet' ? '' : resolvedFullName);
  }, [resolvedFullName]);

  useEffect(() => {
    setEditablePhoneNumber(profile?.phonenumber ?? '');
  }, [profile?.phonenumber]);

  const initials = useMemo(() => {
    const source = fullName !== 'Not added yet' ? fullName : email;
    return (
      source
        .split(/[\s@._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'U'
    );
  }, [email, fullName]);

  async function handleSaveChanges() {
    if (!session?.user) {
      setSaveError('You need to be signed in to update your profile.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await saveProfileChanges({
        localImageUri: pendingLocalUri ?? undefined,
        userName: editableFullName.trim() || null,
        phoneNumber: editablePhoneNumber.trim() || null,
      });

      setPendingLocalUri(null);
      setSaveSuccess('Profile updated.');
      setShowEditScreen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save your profile changes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await signOut();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  function ProfileActionRow({
    icon,
    label,
    value,
    destructive = false,
    loading = false,
    onPress,
  }: ProfileActionRowProps) {
    const toneColor = destructive ? colors.error : colors.text;
    const iconColor = destructive ? colors.error : colors.icon;

    return (
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress || loading}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 66,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.xs,
          opacity: pressed ? opacity.pressed : 1,
        })}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: destructive ? colors.surfaceMuted : colors.secondarySoft,
          }}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={[typography.label, { color: toneColor }]} numberOfLines={1}>
            {label}
          </AppText>
          {value ? (
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {value}
            </AppText>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.error} />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.icon} />
        ) : null}
      </Pressable>
    );
  }

  if (showEditScreen) {
    return (
      <EditProfileScreen
        avatarUrl={avatarSource}
        fullName={editableFullName}
        mobileNumber={editablePhoneNumber}
        onAvatarUrlChange={setPendingLocalUri}
        onFullNameChange={setEditableFullName}
        onMobileNumberChange={setEditablePhoneNumber}
        onBack={() => {
          setPendingLocalUri(null);
          setSaveError(null);
          setShowEditScreen(false);
        }}
        onSave={handleSaveChanges}
        isSaving={isSaving}
        errorMessage={saveError}
        useTripChromeInsets={shouldUseTripChromeInsets}
      />
    );
  }

  return (
    <>
      {passportPreview.isPreviewVisible ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={passportPreview.closePreview}>
          <Pressable
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: spacing.md,
              backgroundColor: colors.overlayStrong,
            }}
            onPress={passportPreview.closePreview}>
            <Pressable>
              <Animated.View
                {...passportPreview.panHandlers}
                style={{
                  width: '100%',
                  minHeight: 260,
                  transform: [
                    { perspective: 900 },
                    { rotateX: passportPreview.rotateX },
                    { rotateY: passportPreview.rotateY },
                    { scale: passportPreview.scale },
                  ],
                }}>
                <View style={{ minHeight: 260 }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: [{ rotateY: '180deg' }],
                    }}>
                    <PassportCardBack
                      large
                      badgeColors={badgeColors}
                      colors={colors}
                      heroBackground={heroBackground}
                      heroText={heroText}
                      lineColor={passportLineColor}
                      mode={mode}
                      radius={radius}
                      resolvedTripCount={resolvedTripCount}
                      shadows={shadows}
                      spacing={spacing}
                      typography={typography}
                    />
                  </View>
                  <PassportCard
                    large
                    avatarSource={avatarSource}
                    badgeColors={badgeColors}
                    badgeLevel={badge.level}
                    badgeIcon={badge.icon}
                    colors={colors}
                    email={email}
                    fullName={fullName}
                    heroBackground={heroBackground}
                    heroMutedText={heroMutedText}
                    heroText={heroText}
                    initials={initials}
                    lineColor={passportLineColor}
                    mode={mode}
                    radius={radius}
                    resolvedTripCount={resolvedTripCount}
                    shadows={shadows}
                    spacing={spacing}
                    typography={typography}
                  />
                </View>
              </Animated.View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: shouldUseTripChromeInsets ? headerContentOffset : safeAreaInsets.top + spacing.md,
          paddingBottom: Math.max(safeAreaInsets.bottom, spacing.md) + spacing.xl,
        }}>
        <Container>
        <Stack space="sm">
          {showBackButton ? <BackButton /> : null}

          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <AppText variant="subtitle" style={{ textAlign: 'center', color: colors.primary }}>
              Triploom Passport
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={passportPreview.openPreview}
            style={({ pressed }) => ({
              opacity: pressed ? opacity.pressed : 1,
            })}>
            <PassportCard
              avatarSource={avatarSource}
              badgeColors={badgeColors}
              badgeLevel={badge.level}
              badgeIcon={badge.icon}
              colors={colors}
              email={email}
              fullName={fullName}
              heroBackground={heroBackground}
              heroMutedText={heroMutedText}
              heroText={heroText}
              initials={initials}
              lineColor={passportLineColor}
              mode={mode}
              radius={radius}
              resolvedTripCount={resolvedTripCount}
              shadows={shadows}
              spacing={spacing}
              typography={typography}
            />
          </Pressable>

        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: badgeColors.soft,
            padding: spacing.md,
            gap: spacing.sm,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
              }}>
              <Ionicons name={badge.icon} size={24} color={badgeColors.background} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText
                style={[
                  typography.label,
                  { color: colors.text, fontSize: typography.label.fontSize + 1 },
                ]}
                numberOfLines={1}>
                {badge.title} Badge
              </AppText>
              {participatedTripCount === null ? (
                <AppText variant="caption" tone="muted">
                  Loading trip progress
                </AppText>
              ) : badge.nextAt === null ? (
                <AppText variant="caption" tone="muted">
                  Highest tier for {participatedTripCountEmail ?? email}
                </AppText>
              ) : (
                <AppText variant="caption" tone="muted">
                  {tripsUntilNextBadge} trips until next tier
                </AppText>
              )}
            </View>
            <View
              style={{
                minWidth: 58,
                borderRadius: radius.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                alignItems: 'center',
                backgroundColor: colors.surface,
              }}>
              {participatedTripCount === null ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <AppText style={[typography.subtitle, { color: colors.primary }]}>
                    {participatedTripCount}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    trips
                  </AppText>
                </>
              )}
            </View>
          </View>

          <View
            style={{
              height: 10,
              borderRadius: radius.full,
              overflow: 'hidden',
              backgroundColor: colors.surface,
            }}>
            <View
              style={{
                width: `${badgeProgress}%`,
                height: '100%',
                borderRadius: radius.full,
                backgroundColor: badgeColors.background,
              }}
            />
          </View>
        </View>

        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}>
          <ProfileActionRow
            icon="create-outline"
            label="Edit profile"
            onPress={() => {
              setSaveError(null);
              setSaveSuccess(null);
              setShowEditScreen(true);
            }}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <ProfileActionRow icon="person-outline" label="Name" value={fullName} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <ProfileActionRow icon="mail-outline" label="Email" value={email} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <ProfileActionRow icon="call-outline" label="Phone" value={mobileNumber} />
        </View>

        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.sm,
            gap: spacing.sm,
          }}>
          <View style={{ paddingHorizontal: spacing.xs }}>
            <AppText style={typography.label}>Personalization</AppText>
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={{ paddingHorizontal: spacing.xs }}>
              <AppText variant="caption" tone="muted">
                Theme mode
              </AppText>
            </View>
          <View
            onLayout={(event) => {
              setAppearanceWidth(event.nativeEvent.layout.width);
            }}
            style={{
              minHeight: 48,
              borderRadius: radius.full,
              padding: 4,
              flexDirection: 'row',
              backgroundColor: colors.surfaceMuted,
            }}>
            {appearanceSegmentWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    width: Math.max(appearanceSegmentWidth, 0),
                    height: 40,
                    borderRadius: radius.full,
                    backgroundColor: colors.surface,
                    transform: [
                      {
                        translateX: Animated.multiply(appearanceTranslateIndex, appearanceSegmentWidth),
                      },
                    ],
                  },
                  shadows.sm,
                ]}
              />
            ) : null}
            {themeOptions.map((option) => {
              const selected = themePreference === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setThemePreference(option.value)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 40,
                    borderRadius: radius.full,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                    backgroundColor: colors.transparent,
                    opacity: pressed ? opacity.pressed : 1,
                  })}>
                  <Ionicons
                    name={option.icon}
                    size={16}
                    color={selected ? colors.primary : colors.icon}
                  />
                  <AppText
                    variant="caption"
                    style={{
                      color: selected ? colors.primary : colors.textMuted,
                    }}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={{ paddingHorizontal: spacing.xs }}>
              <AppText variant="caption" tone="muted">
                Color palette
              </AppText>
            </View>
            <View
              onLayout={(event) => {
                setColorPresetWidth(event.nativeEvent.layout.width);
              }}
              style={{
                minHeight: 48,
                borderRadius: radius.full,
                padding: 4,
                flexDirection: 'row',
                backgroundColor: colors.surfaceMuted,
              }}>
              {colorPresetSegmentWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      width: Math.max(colorPresetSegmentWidth, 0),
                      height: 40,
                      borderRadius: radius.full,
                      backgroundColor: colors.surface,
                      transform: [
                        {
                          translateX: Animated.multiply(colorPresetTranslateIndex, colorPresetSegmentWidth),
                        },
                      ],
                    },
                    shadows.sm,
                  ]}
                />
              ) : null}
              {colorPresetOptions.map((option) => {
                const selected = colorPreset === option.value;
                const preset = themeColorPresets[option.value];

                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setColorPreset(option.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      minHeight: 40,
                      borderRadius: radius.full,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.xs,
                      backgroundColor: colors.transparent,
                      opacity: pressed ? opacity.pressed : 1,
                    })}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: radius.full,
                        backgroundColor: preset.swatch,
                      }}
                    />
                    <AppText
                      variant="caption"
                      style={{
                        color: selected ? colors.primary : colors.textMuted,
                      }}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View
          style={{
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}>
          <ProfileActionRow
            icon="log-out-outline"
            label="Sign Out"
            destructive
            loading={isSigningOut}
            onPress={() => {
              void handleSignOut();
            }}
          />
        </View>

        {saveSuccess ? (
          <AppText variant="caption" tone="success">
            {saveSuccess}
          </AppText>
        ) : null}
        {saveError ? (
          <AppText variant="caption" tone="error">
            {saveError}
          </AppText>
        ) : null}
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <AppText variant="caption" tone="muted">
              Loading profile...
            </AppText>
          </View>
        ) : null}
        </Stack>
        </Container>
      </ScrollView>
    </>
  );
}
