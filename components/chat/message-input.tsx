import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';

import GeneralCamera from '@/components/camera/general-camera';
import { ImageThumbnailStrip } from '@/components/chat/image-thumbnail-strip';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { MessageWithSender } from '@/types';

const MAX_IMAGES = 10;

interface Props {
  onSubmit: (text: string, images: ImagePicker.ImagePickerAsset[]) => void;
  onShareLocation?: () => void;
  isSending: boolean;
  isUploadingImages: boolean;
  uploadProgress: number;
  pendingImages: ImagePicker.ImagePickerAsset[];
  onAddImages: (assets: ImagePicker.ImagePickerAsset[]) => void;
  onRemoveImage: (index: number) => void;
  editingMessage?: MessageWithSender | null;
  onCancelEdit?: () => void;
  isUpdating?: boolean;
  onSubmitEdit?: (content: string) => void;
}

export function MessageInput({
  onSubmit,
  onShareLocation,
  isSending,
  isUploadingImages,
  uploadProgress,
  pendingImages,
  onAddImages,
  onRemoveImage,
  editingMessage,
  onCancelEdit,
  isUpdating,
  onSubmitEdit,
}: Props) {
  const [text, setText] = useState('');
  const [cameraVisible, setCameraVisible] = useState(false);
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content ?? '');
    } else {
      setText('');
    }
  }, [editingMessage?.id]);

  const isEditing = !!editingMessage;
  const isBusy = isEditing ? !!isUpdating : (isSending || isUploadingImages);
  const canSend = !isBusy && (text.trim().length > 0 || pendingImages.length > 0);

  async function handlePickImages() {
    if (isBusy) return;
    const remaining = MAX_IMAGES - pendingImages.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can attach at most ${MAX_IMAGES} images per message.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const combined = [...pendingImages, ...result.assets];
      if (combined.length > MAX_IMAGES) {
        Alert.alert('Too many images', `You can attach at most ${MAX_IMAGES} images per message.`);
        onAddImages(combined.slice(0, MAX_IMAGES));
      } else {
        onAddImages(result.assets);
      }
    }
  }

  function handlePhotoTaken(uri: string) {
    setCameraVisible(false);
    if (pendingImages.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can attach at most ${MAX_IMAGES} images per message.`);
      return;
    }
    onAddImages([{ uri, width: 0, height: 0, type: 'image' } as ImagePicker.ImagePickerAsset]);
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!canSend) return;
    if (isEditing && onSubmitEdit) {
      onSubmitEdit(trimmed);
    } else {
      onSubmit(trimmed, pendingImages);
      setText('');
    }
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
      <Modal visible={cameraVisible} animationType="slide" statusBarTranslucent onRequestClose={() => setCameraVisible(false)}>
        <GeneralCamera onPhotoTaken={handlePhotoTaken} onClose={() => setCameraVisible(false)} />
      </Modal>
      {isEditing && (
        <View
          style={[
            styles.editBar,
            { borderTopColor: colors.border, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm },
          ]}>
          <AppText variant="caption" tone="primary" style={{ flex: 1 }}>
            Editing message
          </AppText>
          <IconButton
            icon={<Ionicons name="close" size={16} color={colors.textMuted} />}
            variant="ghost"
            onPress={() => { setText(''); onCancelEdit?.(); }}
            accessibilityLabel="Cancel edit"
          />
        </View>
      )}
      {isUploadingImages && (
        <View style={[styles.uploadBar, { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm }]}>
          <AppText variant="caption" tone="primary">
            Uploading {uploadProgress}/{pendingImages.length}…
          </AppText>
        </View>
      )}
      {pendingImages.length > 0 && (
        <ImageThumbnailStrip
          assets={pendingImages}
          onRemove={onRemoveImage}
          disabled={isBusy}
        />
      )}
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderTopColor: colors.border,
          },
        ]}>
        {!isEditing && (
          <>
            {onShareLocation && (
              <IconButton
                icon={<Ionicons name="location-outline" size={20} color={colors.textMuted} />}
                variant="ghost"
                onPress={onShareLocation}
                disabled={isBusy}
                accessibilityLabel="Share location"
              />
            )}
            <IconButton
              icon={<Ionicons name="camera-outline" size={22} color={isBusy ? colors.textMuted : colors.primary} />}
              variant="ghost"
              onPress={() => setCameraVisible(true)}
              disabled={isBusy || pendingImages.length >= MAX_IMAGES}
              accessibilityLabel="Take photo"
            />
            <IconButton
              icon={<Ionicons name="image-outline" size={22} color={isBusy ? colors.textMuted : colors.primary} />}
              variant="ghost"
              onPress={handlePickImages}
              disabled={isBusy || pendingImages.length >= MAX_IMAGES}
              accessibilityLabel="Add images"
            />
          </>
        )}
        <View style={styles.inputWrapper}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder={isEditing ? 'Edit message...' : 'Type a message...'}
            multiline
            maxLength={2000}
            editable={!isBusy}
          />
        </View>
        <IconButton
          icon={
            <Ionicons
              name={isEditing ? 'checkmark' : 'send'}
              size={20}
              color={canSend ? colors.primary : colors.textMuted}
            />
          }
          variant="ghost"
          onPress={handleSubmit}
          disabled={!canSend}
          loading={isBusy}
          accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  uploadBar: {
    paddingVertical: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
  },
});
