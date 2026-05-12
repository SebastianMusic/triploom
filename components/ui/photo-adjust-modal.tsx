import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type PhotoAdjustShape = 'circle' | 'landscape';

type PhotoAdjustModalProps = {
  visible: boolean;
  uri: string | null;
  title: string;
  shape: PhotoAdjustShape;
  onClose: () => void;
  onSave: (uri: string) => void;
};

type ImageSize = {
  width: number;
  height: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function shouldPrepareForManipulator(sourceUri: string) {
  return sourceUri.startsWith('content://') || sourceUri.startsWith('file://');
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function clampOffset(
  offsetX: number,
  offsetY: number,
  scaledWidth: number,
  scaledHeight: number,
  frameWidth: number,
  frameHeight: number,
) {
  'worklet';
  const maxX = Math.max(0, (scaledWidth - frameWidth) / 2);
  const maxY = Math.max(0, (scaledHeight - frameHeight) / 2);

  return {
    x: clamp(offsetX, -maxX, maxX),
    y: clamp(offsetY, -maxY, maxY),
  };
}

export function PhotoAdjustModal({
  visible,
  uri,
  title,
  shape,
  onClose,
  onSave,
}: PhotoAdjustModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const {
    theme: { colors, opacity, radius, spacing, typography },
  } = useAppTheme();

  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [workingUri, setWorkingUri] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const frameWidth = useMemo(() => {
    if (shape === 'circle') {
      return Math.min(windowWidth - spacing.lg, 336);
    }
    return Math.min(windowWidth - spacing.lg, 360);
  }, [shape, spacing.lg, windowWidth]);

  const frameHeight = shape === 'circle' ? frameWidth : frameWidth * (9 / 16);

  const zoom = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartZoom = useSharedValue(1);

  useEffect(() => {
    if (!visible || !uri) {
      setWorkingUri(null);
      return;
    }

    let cancelled = false;
    setIsLoadingImage(true);
    setImageSize(null);
    setWorkingUri(null);
    zoom.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    const sourceUri = uri;

    async function prepareImage() {
      try {
        const preparedUri = shouldPrepareForManipulator(sourceUri)
          ? (await manipulateAsync(sourceUri, [], { compress: 1, format: SaveFormat.JPEG })).uri
          : sourceUri;
        if (cancelled) return;

        setWorkingUri(preparedUri);
        Image.getSize(
          preparedUri,
          (width, height) => {
            if (cancelled) return;
            setImageSize({ width, height });
            setIsLoadingImage(false);
          },
          () => {
            if (cancelled) return;
            setIsLoadingImage(false);
          },
        );
      } catch {
        if (!cancelled) {
          setIsLoadingImage(false);
        }
      }
    }

    void prepareImage();

    return () => {
      cancelled = true;
    };
  }, [offsetX, offsetY, uri, visible, zoom]);

  const baseScale = useMemo(() => {
    if (!imageSize) return 1;
    return Math.max(frameWidth / imageSize.width, frameHeight / imageSize.height);
  }, [frameHeight, frameWidth, imageSize]);

  useEffect(() => {
    if (!imageSize) return;
    const scaledWidth = imageSize.width * baseScale * zoom.value;
    const scaledHeight = imageSize.height * baseScale * zoom.value;
    const clamped = clampOffset(offsetX.value, offsetY.value, scaledWidth, scaledHeight, frameWidth, frameHeight);
    offsetX.value = clamped.x;
    offsetY.value = clamped.y;
  }, [baseScale, frameHeight, frameWidth, imageSize, offsetX, offsetY, zoom]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      panStartX.value = offsetX.value;
      panStartY.value = offsetY.value;
    })
    .onUpdate((event) => {
      if (!imageSize) return;
      const scaledWidth = imageSize.width * baseScale * zoom.value;
      const scaledHeight = imageSize.height * baseScale * zoom.value;
      const clamped = clampOffset(
        panStartX.value + event.translationX,
        panStartY.value + event.translationY,
        scaledWidth,
        scaledHeight,
        frameWidth,
        frameHeight,
      );
      offsetX.value = clamped.x;
      offsetY.value = clamped.y;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchStartZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      if (!imageSize) return;
      const nextZoom = clamp(pinchStartZoom.value * event.scale, MIN_ZOOM, MAX_ZOOM);
      const scaledWidth = imageSize.width * baseScale * nextZoom;
      const scaledHeight = imageSize.height * baseScale * nextZoom;
      const clamped = clampOffset(offsetX.value, offsetY.value, scaledWidth, scaledHeight, frameWidth, frameHeight);
      zoom.value = nextZoom;
      offsetX.value = clamped.x;
      offsetY.value = clamped.y;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const imageStyle = useAnimatedStyle(() => {
    if (!imageSize) {
      return {};
    }

    const scaledWidth = imageSize.width * baseScale * zoom.value;
    const scaledHeight = imageSize.height * baseScale * zoom.value;

    return {
      position: 'absolute',
      width: scaledWidth,
      height: scaledHeight,
      left: (frameWidth - scaledWidth) / 2 + offsetX.value,
      top: (frameHeight - scaledHeight) / 2 + offsetY.value,
    };
  }, [baseScale, frameHeight, frameWidth, imageSize]);

  async function handleSave() {
    if (!workingUri || !imageSize || isSaving) return;

    setIsSaving(true);

    try {
      const displayScale = baseScale * zoom.value;
      const cropWidth = Math.max(1, Math.min(imageSize.width, Math.round(frameWidth / displayScale)));
      const cropHeight = Math.max(1, Math.min(imageSize.height, Math.round(frameHeight / displayScale)));
      const maxOriginX = Math.max(0, imageSize.width - cropWidth);
      const maxOriginY = Math.max(0, imageSize.height - cropHeight);
      const originX = Math.round(
        clamp(
          (imageSize.width - cropWidth) / 2 - offsetX.value / displayScale,
          0,
          maxOriginX,
        ),
      );
      const originY = Math.round(
        clamp(
          (imageSize.height - cropHeight) / 2 - offsetY.value / displayScale,
          0,
          maxOriginY,
        ),
      );

      const result = await manipulateAsync(
        workingUri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        },
      );

      onSave(result.uri);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#000000',
          justifyContent: 'center',
          paddingHorizontal: spacing.sm,
          paddingTop: spacing.xxl,
          paddingBottom: spacing.md,
        }}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }}>
          <AppText style={[typography.label, { color: colors.textOnPrimary }]}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textOnPrimary, textAlign: 'center' }}>
            Pinch to zoom and drag to reposition.
          </AppText>
        </View>

        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <GestureDetector gesture={composedGesture}>
            <View
              style={{
                width: frameWidth,
                height: frameHeight,
                borderRadius: shape === 'circle' ? frameWidth / 2 : radius.lg,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: colors.textOnPrimary,
                backgroundColor: colors.surfaceMuted,
              }}>
              {imageSize ? (
                <Animated.Image source={{ uri: workingUri ?? uri }} style={imageStyle} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {isLoadingImage ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      Could not load image.
                    </AppText>
                  )}
                </View>
              )}
            </View>
          </GestureDetector>
        </View>

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 52,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                opacity: isSaving ? opacity.disabled : pressed ? opacity.pressed : 1,
              })}>
              <AppText style={typography.label}>Cancel</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onLongPress={() => {
                zoom.value = 1;
                offsetX.value = 0;
                offsetY.value = 0;
              }}
              onPress={() => {
                void handleSave();
              }}
              disabled={!imageSize || isSaving}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 52,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                opacity: !imageSize || isSaving ? opacity.disabled : pressed ? opacity.pressed : 1,
              })}>
              {isSaving ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <AppText style={[typography.label, { color: colors.textOnPrimary }]}>
                  Save crop
                </AppText>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
