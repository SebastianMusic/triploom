import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { Stack } from '@/components/ui/stack';
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
  useTripChromeInsets?: boolean;
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
  useTripChromeInsets: shouldUseTripChromeInsets = false,
}: EditProfileScreenProps) {
  const [activeModal, setActiveModal] = useState<AvatarModal>('none');
  const insets = useSafeAreaInsets();
  const {
    mode,
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const { headerContentOffset } = useTripChromeInsets();

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
        <View
          style={{
            flex: 1,
            backgroundColor: mode === 'dark' ? colors.background : colors.text,
            justifyContent: 'center',
          }}>
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

      <KeyboardScreenView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: shouldUseTripChromeInsets ? headerContentOffset : insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        }}>
        <Container>
          <Stack space="sm">
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <AppText variant="subtitle" style={{ textAlign: 'center' }}>
                Edit Profile
              </AppText>
            </View>

            <View
              style={[
                {
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  padding: spacing.sm,
                  gap: spacing.sm,
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
              </View>

              <Input
                label="Full name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={onFullNameChange}
                returnKeyType="next"
              />

              <Input
                label="Mobile number"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChangeText={onMobileNumberChange}
                keyboardType="phone-pad"
              />

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
              <View style={{ flex: 1 }}>
                <Button
                  label="Back"
                  variant="secondary"
                  fullWidth
                  disabled={isSaving}
                  onPress={onBack}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Save Changes"
                  fullWidth
                  loading={isSaving}
                  onPress={onSave}
                />
              </View>
            </View>
          </Stack>
        </Container>
      </KeyboardScreenView>

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
