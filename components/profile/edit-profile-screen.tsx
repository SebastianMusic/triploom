import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { BottomActionSheet } from '@/components/ui/bottom-action-sheet';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyboardScreenView } from '@/components/ui/keyboard-screen-view';
import { PhotoAdjustModal } from '@/components/ui/photo-adjust-modal';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { pickSingleImageFromLibrary } from '@/lib/media-picker';

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

type AvatarModal = 'none' | 'menu' | 'camera' | 'adjust';

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
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const { headerContentOffset } = useTripChromeInsets();
  const canAdjustProfilePhoto = Platform.OS !== 'android';

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
    const uri = await pickSingleImageFromLibrary({ aspect: [1, 1] });
    if (uri) {
      onAvatarUrlChange(uri);
      setActiveModal(canAdjustProfilePhoto ? 'adjust' : 'none');
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
          adjustShape={canAdjustProfilePhoto ? 'circle' : undefined}
        />
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

      <BottomActionSheet
        visible={activeModal === 'menu'}
        title="Profile photo"
        onClose={() => setActiveModal('none')}
        items={[
          {
            key: 'camera',
            label: 'Take photo',
            icon: 'camera-outline',
            onPress: () => setActiveModal('camera'),
          },
          {
            key: 'library',
            label: 'Choose from library',
            icon: 'images-outline',
            closeDelayMs: 120,
            onPress: handlePickFromLibrary,
          },
          ...(avatarUrl && canAdjustProfilePhoto ? [{
            key: 'adjust',
            label: 'Adjust photo',
            icon: 'scan-outline' as const,
            onPress: () => setActiveModal('adjust'),
          }] : []),
          ...(avatarUrl ? [{
            key: 'delete',
            label: 'Delete photo',
            icon: 'trash-outline' as const,
            destructive: true,
            onPress: () => onAvatarUrlChange(''),
          }] : []),
        ]}
      />
      <PhotoAdjustModal
        visible={canAdjustProfilePhoto && activeModal === 'adjust'}
        uri={avatarUrl}
        title="Adjust profile photo"
        shape="circle"
        onSave={onAvatarUrlChange}
        onClose={() => setActiveModal('none')}
      />
    </View>
  );
}
