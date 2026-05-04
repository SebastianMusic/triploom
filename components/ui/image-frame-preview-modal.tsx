import { Image, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type FrameShape = 'circle' | 'landscape';

type ImageFramePreviewModalProps = {
  visible: boolean;
  uri: string | null;
  title: string;
  shape: FrameShape;
  onClose: () => void;
};

export function ImageFramePreviewModal({
  visible,
  uri,
  title,
  shape,
  onClose,
}: ImageFramePreviewModalProps) {
  const {
    theme: { colors, opacity, radius, spacing, typography },
  } = useAppTheme();

  if (!uri) return null;

  const frameStyle =
    shape === 'circle'
      ? {
          width: 240,
          height: 240,
          borderRadius: 120,
        }
      : {
          width: '86%' as const,
          aspectRatio: 16 / 9,
          borderRadius: radius.lg,
        };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlayStrong, justifyContent: 'center', alignItems: 'center' }}>
        <Image source={{ uri }} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlayStrong }} />
        <View style={{ position: 'absolute', top: spacing.xxxl, left: spacing.md, right: spacing.md, alignItems: 'center', gap: spacing.xs }}>
          <AppText style={[typography.label, { color: colors.textOnPrimary }]}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: colors.textOnPrimary }}>
            This frame shows how the photo will be visible.
          </AppText>
        </View>
        <View
          pointerEvents="none"
          style={[
            {
              borderWidth: 3,
              borderColor: colors.textOnPrimary,
              backgroundColor: 'transparent',
            },
            frameStyle,
          ]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => ({
            position: 'absolute',
            top: spacing.xl,
            right: spacing.md,
            width: 44,
            height: 44,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.overlay,
            opacity: pressed ? opacity.pressed : 1,
          })}>
          <Ionicons name="close" size={22} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </Modal>
  );
}
