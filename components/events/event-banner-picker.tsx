import { useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';

import GeneralCamera from '@/components/camera/general-camera';
import { BottomActionSheet } from '@/components/ui/bottom-action-sheet';
import { PhotoAdjustModal } from '@/components/ui/photo-adjust-modal';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { pickSingleImageFromLibrary } from '@/lib/media-picker';

type EventBannerPickerProps = {
  uri: string | null;
  onSelect: (uri: string) => void;
  onRemove?: () => void;
};

export function EventBannerPicker({ uri, onSelect, onRemove }: EventBannerPickerProps) {
  const { theme: { colors, radius, spacing } } = useAppTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showAdjustPreview, setShowAdjustPreview] = useState(false);

  async function openGallery() {
    const selectedUri = await pickSingleImageFromLibrary({ aspect: [16, 9] });
    if (selectedUri) {
      onSelect(selectedUri);
      setShowAdjustPreview(true);
    }
  }

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption">Banner image</AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowActions(true)}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceMuted,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <AppText tone="muted">Tap to add banner</AppText>
          )}
        </Pressable>
      </View>

      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <GeneralCamera
          onPhotoTaken={(photoUri) => {
            onSelect(photoUri);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
          adjustShape="landscape"
        />
      </Modal>
      <BottomActionSheet
        visible={showActions}
        title="Banner photo"
        onClose={() => setShowActions(false)}
        items={[
          {
            key: 'camera',
            label: 'Take photo',
            icon: 'camera-outline',
            onPress: () => setShowCamera(true),
          },
          {
            key: 'library',
            label: 'Choose from library',
            icon: 'images-outline',
            closeDelayMs: 120,
            onPress: () => { void openGallery(); },
          },
          ...(uri ? [{
            key: 'adjust',
            label: 'Adjust photo',
            icon: 'scan-outline' as const,
            onPress: () => setShowAdjustPreview(true),
          }] : []),
          ...(uri && onRemove ? [{
            key: 'delete',
            label: 'Delete photo',
            icon: 'trash-outline' as const,
            destructive: true,
            onPress: onRemove,
          }] : []),
        ]}
      />
      <PhotoAdjustModal
        visible={showAdjustPreview}
        uri={uri}
        title="Adjust banner photo"
        shape="landscape"
        onSave={onSelect}
        onClose={() => setShowAdjustPreview(false)}
      />
    </>
  );
}
