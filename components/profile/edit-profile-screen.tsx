import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';

type EditProfileScreenProps = {
  avatarUrl: string;
  fullName: string;
  mobileNumber: string;
  onAvatarUrlChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onMobileNumberChange: (value: string) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
};

type AvatarModal = 'none' | 'menu' | 'camera' | 'view';

export default function EditProfileScreen({
  avatarUrl,
  fullName,
  mobileNumber,
  onAvatarUrlChange,
  onFullNameChange,
  onMobileNumberChange,
  onBack,
  onSave,
  isSaving = false,
  errorMessage,
}: EditProfileScreenProps) {
  const [activeModal, setActiveModal] = useState<AvatarModal>('none');
  const insets = useSafeAreaInsets();
  const {
    theme: { colors, layout, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const { bottomOverlayOffset, headerContentOffset } = useTripChromeInsets();

  const initials =
    fullName
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  function handlePhotoTaken(uri: string) {
    onAvatarUrlChange(uri);
    setActiveModal('none');
  }

  async function handlePickFromLibrary() {
    setActiveModal('none');

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onAvatarUrlChange(result.assets[0].uri);
    }
  }

  const inputStyle = {
    minHeight: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    ...typography.body,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Modal
        visible={activeModal === 'camera'}
        animationType="slide"
        onRequestClose={() => setActiveModal('none')}>
        <GeneralCamera
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setActiveModal('none')}
        />
      </Modal>

      <Modal
        visible={activeModal === 'view'}
        animationType="fade"
        onRequestClose={() => setActiveModal('none')}>
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center' }}>
          <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          <Pressable
            style={({ pressed }) => ({
              position: 'absolute',
              top: insets.top + spacing.sm,
              right: spacing.md,
              width: 44,
              height: 44,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.overlay,
              opacity: pressed ? opacity.pressed : 1,
            })}
            onPress={() => setActiveModal('none')}
            hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: headerContentOffset,
          paddingBottom: bottomOverlayOffset,
          paddingHorizontal: layout.screenPadding,
          gap: spacing.md,
        }}>
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <AppText variant="subtitle" style={{ textAlign: 'center' }}>
            Edit Profile
          </AppText>
          <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>
            Keep your profile details ready for every trip.
          </AppText>
        </View>

        <View
          style={[
            {
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.md,
            },
            shadows.sm,
          ]}>
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveModal('menu')}
              style={({ pressed }) => ({
                position: 'relative',
                opacity: pressed ? opacity.pressed : 1,
              })}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: radius.full,
                    backgroundColor: colors.surfaceMuted,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primarySoft,
                  }}>
                  <AppText style={[typography.subtitle, { color: colors.primary }]}>
                    {initials}
                  </AppText>
                </View>
              )}
              <View
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  width: 34,
                  height: 34,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}>
                <Ionicons name="camera" size={17} color={colors.textOnPrimary} />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveModal('menu')}
              style={({ pressed }) => ({
                minHeight: 36,
                borderRadius: radius.full,
                paddingHorizontal: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: colors.secondarySoft,
                opacity: pressed ? opacity.pressed : 1,
              })}>
              <Ionicons name="image-outline" size={16} color={colors.secondary} />
              <AppText variant="caption" tone="secondary">
                Change photo
              </AppText>
            </Pressable>
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText style={typography.label}>Full name</AppText>
            <TextInput
              style={inputStyle}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={onFullNameChange}
              returnKeyType="next"
            />
          </View>

          <View style={{ gap: spacing.xs }}>
            <AppText style={typography.label}>Mobile number</AppText>
            <TextInput
              style={inputStyle}
              placeholder="Enter your mobile number"
              placeholderTextColor={colors.textMuted}
              value={mobileNumber}
              onChangeText={onMobileNumberChange}
              keyboardType="phone-pad"
            />
          </View>

          {errorMessage ? (
            <View
              style={{
                borderRadius: radius.md,
                backgroundColor: colors.surfaceMuted,
                padding: spacing.sm,
              }}>
              <AppText variant="caption" tone="error">
                {errorMessage}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            disabled={isSaving}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 54,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: isSaving ? opacity.disabled : pressed ? opacity.pressed : 1,
            })}>
            <AppText style={typography.label}>Back</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            disabled={isSaving}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 54,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              opacity: isSaving ? opacity.disabled : pressed ? opacity.pressed : 1,
              ...shadows.sm,
            })}>
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <AppText style={[typography.label, { color: colors.textOnPrimary }]}>
                Save Changes
              </AppText>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {activeModal === 'menu' && (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
            onPress={() => setActiveModal('none')}
          />
          <View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                backgroundColor: colors.surface,
                paddingTop: spacing.sm,
                paddingBottom: insets.bottom + spacing.xs,
              },
              shadows.lg,
            ]}>
            <View
              style={{
                alignSelf: 'center',
                width: 38,
                height: 4,
                borderRadius: radius.full,
                backgroundColor: colors.borderStrong,
                marginBottom: spacing.sm,
              }}
            />

            <AppText style={[typography.label, { textAlign: 'center', paddingBottom: spacing.xs }]}>
              Profile photo
            </AppText>

            {avatarUrl ? (
              <SheetOption icon="eye-outline" label="View profile picture" onPress={() => setActiveModal('view')} />
            ) : null}
            <SheetOption icon="camera-outline" label="Take photo" onPress={() => setActiveModal('camera')} />
            <SheetOption icon="images-outline" label="Choose from library" onPress={handlePickFromLibrary} />
            <SheetOption icon="close-outline" label="Cancel" muted onPress={() => setActiveModal('none')} />
          </View>
        </>
      )}
    </View>
  );

  function SheetOption({
    icon,
    label,
    muted = false,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    muted?: boolean;
    onPress: () => void;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 56,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          opacity: pressed ? opacity.pressed : 1,
        })}>
        <Ionicons name={icon} size={20} color={muted ? colors.textMuted : colors.icon} />
        <AppText style={[typography.label, { color: muted ? colors.textMuted : colors.text }]}>
          {label}
        </AppText>
      </Pressable>
    );
  }
}
