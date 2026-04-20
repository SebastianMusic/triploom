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
};

export function EventBannerPicker({ uri, onSelect }: EventBannerPickerProps) {
  const { theme: { colors, radius, spacing } } = useAppTheme();
  const [showCamera, setShowCamera] = useState(false);

  async function openGallery() {
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
        <AppText variant="caption">Banner image</AppText>

        {/* Preview area */}
        <View style={{
          width: '100%',
          aspectRatio: 16 / 9,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceMuted,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={40} color={colors.textMuted} />
          )}
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={() => setShowCamera(true)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs / 2,
              paddingVertical: spacing.sm - spacing.xs / 2,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}>
            <Ionicons name="camera-outline" size={18} color={colors.text} />
            <AppText>Camera</AppText>
          </Pressable>

          <Pressable
            onPress={() => { void openGallery(); }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs / 2,
              paddingVertical: spacing.sm - spacing.xs / 2,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}>
            <Ionicons name="images-outline" size={18} color={colors.text} />
            <AppText>Gallery</AppText>
          </Pressable>
        </View>
      </View>

      {/* Full-screen camera modal */}
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
