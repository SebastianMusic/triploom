import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, LayoutAnimation, Modal, Platform, StyleSheet, TextInput, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GeneralCamera from '@/components/camera/general-camera';
import { ImageThumbnailStrip } from '@/components/chat/image-thumbnail-strip';
import { BottomActionSheet } from '@/components/ui/bottom-action-sheet';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { pickImagesFromLibrary } from '@/lib/media-picker';
import type { MessageWithSender } from '@/types';

const MAX_IMAGES = 10;
const INPUT_LINE_HEIGHT = 25;
const INPUT_VERTICAL_PADDING = 18;
const INPUT_MIN_HEIGHT = INPUT_LINE_HEIGHT + INPUT_VERTICAL_PADDING;
const INPUT_MAX_HEIGHT = INPUT_LINE_HEIGHT * 5 + INPUT_VERTICAL_PADDING;

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

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
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    theme: { colors, radius, sizes, spacing, typography },
  } = useAppTheme();
  const useSharedAndroidInputMetrics = Platform.OS === 'android';

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content ?? '');
    } else {
      setText('');
    }
  }, [editingMessage]);

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
    const assets = await pickImagesFromLibrary({ selectionLimit: remaining });
    if (assets.length > 0) {
      const combined = [...pendingImages, ...assets];
      if (combined.length > MAX_IMAGES) {
        Alert.alert('Too many images', `You can attach at most ${MAX_IMAGES} images per message.`);
        onAddImages(combined.slice(0, MAX_IMAGES));
      } else {
        onAddImages(assets);
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

  function animateInputLayout() {
    LayoutAnimation.configureNext({
      duration: 170,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
        },
      ]}>
      <Modal visible={cameraVisible} animationType="slide" statusBarTranslucent onRequestClose={() => setCameraVisible(false)}>
        <GeneralCamera onPhotoTaken={handlePhotoTaken} onClose={() => setCameraVisible(false)} />
      </Modal>
      <BottomActionSheet
        visible={actionSheetVisible}
        title="Add to message"
        onClose={() => setActionSheetVisible(false)}
        items={[
          ...(onShareLocation ? [{
            key: 'location',
            label: 'Share location',
            icon: 'location-outline' as const,
            onPress: onShareLocation,
          }] : []),
          {
            key: 'camera',
            label: 'Take photo',
            icon: 'camera-outline',
            onPress: () => setCameraVisible(true),
          },
          {
            key: 'library',
            label: 'Choose from library',
            icon: 'images-outline',
            closeDelayMs: 120,
            onPress: () => { void handlePickImages(); },
          },
        ]}
      />
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
        {!isEditing ? (
          <View style={styles.topAlignedControl}>
          <IconButton
            icon={<Ionicons name="ellipsis-horizontal" size={22} color={isBusy ? colors.textMuted : colors.primary} />}
            variant="ghost"
            onPress={() => setActionSheetVisible(true)}
            disabled={isBusy || pendingImages.length >= MAX_IMAGES}
            accessibilityLabel="Add attachment"
          />
          </View>
        ) : null}
        <View style={styles.inputWrapper}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={isEditing ? 'Edit message...' : 'Type a message...'}
            placeholderTextColor={colors.textMuted}
            multiline
            scrollEnabled
            onFocus={animateInputLayout}
            onContentSizeChange={animateInputLayout}
            maxLength={2000}
            editable={!isBusy}
            textAlignVertical={useSharedAndroidInputMetrics ? 'center' : 'top'}
            style={{
              minHeight: useSharedAndroidInputMetrics ? sizes.input.md : INPUT_MIN_HEIGHT,
              maxHeight: INPUT_MAX_HEIGHT,
              borderRadius: radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
              paddingHorizontal: spacing.sm,
              paddingTop: useSharedAndroidInputMetrics ? 0 : 7,
              paddingBottom: useSharedAndroidInputMetrics ? 0 : 11,
              color: colors.text,
              includeFontPadding: false,
              fontFamily: typography.body.fontFamily,
              fontSize: useSharedAndroidInputMetrics ? typography.body.fontSize : 17,
              lineHeight: useSharedAndroidInputMetrics ? typography.body.lineHeight : INPUT_LINE_HEIGHT,
            }}
          />
        </View>
        <View style={styles.topAlignedControl}>
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
    alignItems: 'flex-start',
    gap: 8,
  },
  topAlignedControl: {
    marginTop: 0,
  },
  inputWrapper: {
    flex: 1,
  },
});
