import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

export type BottomActionSheetItem = {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  muted?: boolean;
  skipIosCloseDelay?: boolean;
  closeDelayMs?: number;
  onPress: () => void;
};

type BottomActionSheetProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  items: BottomActionSheetItem[];
};

export function BottomActionSheet({
  visible,
  title,
  onClose,
  items,
}: BottomActionSheetProps) {
  const {
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlayStrong }}
          onPress={onClose}
        />
        <View
          style={[
            {
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              backgroundColor: colors.surface,
              paddingTop: spacing.sm,
              paddingBottom: insets.bottom + spacing.sm,
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
          {title ? (
            <AppText style={[typography.label, { textAlign: 'center', paddingBottom: spacing.xs }]}>
              {title}
            </AppText>
          ) : null}
          {items.map((item) => {
            const foreground = item.destructive
              ? colors.error
              : item.muted
                ? colors.textMuted
                : colors.text;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  const delay = item.closeDelayMs ?? (Platform.OS === 'ios' && !item.skipIosCloseDelay ? 220 : 0);
                  if (delay > 0) {
                    setTimeout(() => {
                      item.onPress();
                    }, delay);
                    return;
                  }
                  item.onPress();
                }}
                style={({ pressed }) => ({
                  minHeight: 56,
                  paddingHorizontal: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  opacity: pressed ? opacity.pressed : 1,
                })}>
                {item.icon ? <Ionicons name={item.icon} size={20} color={foreground} /> : null}
                <AppText style={[typography.label, { color: foreground }]}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
