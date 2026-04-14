import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

export interface GeneralCameraProps {
  onPhotoTaken: (uri: string) => void;
  onClose: () => void;
}

export default function GeneralCamera({ onPhotoTaken, onClose }: GeneralCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isTaking, setIsTaking] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.permissionText}>
          Camera access is required to take photos.
        </ThemedText>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || isTaking) return;

    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
      }
    } finally {
      setIsTaking(false);
    }
  }

  function handleFlip() {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }

  /* ── Photo preview / confirmation ── */
  if (previewUri) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <ThemedText style={styles.previewTitle}>Use this photo?</ThemedText>
        </View>

        <View style={styles.viewfinder}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={styles.retakeButton}
            onPress={() => setPreviewUri(null)}
          >
            <ThemedText style={styles.retakeText}>Retake</ThemedText>
          </Pressable>

          <Pressable
            style={styles.useButton}
            onPress={() => onPhotoTaken(previewUri)}
          >
            <ThemedText style={styles.useText}>Use Photo</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ── Live camera ── */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={12}>
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </Pressable>
      </View>

      <View style={styles.viewfinder}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          ratio={Platform.OS === 'android' ? '4:3' : undefined}
        />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sideSlot} />

        <Pressable
          style={[styles.shutterButton, isTaking && styles.shutterButtonDisabled]}
          onPress={handleCapture}
          disabled={isTaking}
        >
          {isTaking ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        <View style={styles.sideSlot}>
          <Pressable style={styles.flipButton} onPress={handleFlip} hitSlop={12}>
            <ThemedText style={styles.flipText}>⟳</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },

  /* Top bar */
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 17,
    alignSelf: 'flex-start',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

  /* Viewfinder / preview image */
  viewfinder: {
    width: '100%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },

  /* Bottom controls */
  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  sideSlot: {
    width: 48,
    alignItems: 'center',
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterButtonDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: {
    color: '#fff',
    fontSize: 22,
  },

  /* Confirmation buttons */
  retakeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  retakeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  useButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  useText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Permission / loading screens */
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 16,
    padding: 24,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#9ca3af',
  },
});
