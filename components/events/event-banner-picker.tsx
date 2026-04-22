import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';

import GeneralCamera from '@/components/camera/general-camera';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type EventBannerPickerProps = {
  uri: string | null;
  onSelect: (uri: string) => void;
  onRemove?: () => void;
  label?: string;
};

export function EventBannerPicker({ uri, onSelect, onRemove, label = 'Banner image' }: EventBannerPickerProps) {
  const { theme: { colors, opacity, radius, spacing, stroke } } = useAppTheme();
  const [showCamera, setShowCamera] = useState(false);

  async function openGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onSelect(result.assets[0].uri);
    }
  }

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption">{label}</AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCamera(true)}
          style={({ pressed }) => ({
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: radius.lg,
            backgroundColor: colors.primarySoft,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: stroke.none,
            opacity: pressed ? opacity.pressed : 1,
          })}>
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}>
                <Ionicons name="image-outline" size={28} color={colors.primary} />
              </View>
              <AppText variant="caption" tone="primary">Add image</AppText>
            </View>
          )}

          <View
            style={{
              position: 'absolute',
              right: spacing.xs,
              bottom: spacing.xs,
              width: 40,
              height: 40,
              borderRadius: radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              borderWidth: stroke.focus,
              borderColor: colors.surface,
            }}>
            <Ionicons name="camera" size={18} color={colors.textOnPrimary} />
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowCamera(true)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 46,
              borderRadius: radius.full,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: spacing.xs,
              opacity: pressed ? opacity.pressed : 1,
            })}>
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <AppText variant="caption" tone="primary">Camera</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => { void openGallery(); }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 46,
              borderRadius: radius.full,
              backgroundColor: colors.secondarySoft,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: spacing.xs,
              opacity: pressed ? opacity.pressed : 1,
            })}>
            <Ionicons name="images-outline" size={18} color={colors.secondary} />
            <AppText variant="caption" tone="secondary">Library</AppText>
          </Pressable>

          {uri && onRemove ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRemove}
              style={({ pressed }) => ({
                width: 46,
                minHeight: 46,
                borderRadius: radius.full,
                backgroundColor: colors.secondarySoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? opacity.pressed : 1,
              })}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <GeneralCamera
          onPhotoTaken={(photoUri) => {
            onSelect(photoUri);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </>
  );
}
