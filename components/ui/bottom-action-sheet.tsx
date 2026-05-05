import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
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
  const pendingDismissActionRef = useRef<{
    onPress: () => void;
    delayMs: number;
  } | null>(null);
  const {
    theme: { colors, opacity, radius, shadows, spacing, typography },
  } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => {
        const pendingAction = pendingDismissActionRef.current;
        if (!pendingAction) return;

        pendingDismissActionRef.current = null;
        if (pendingAction.delayMs > 0) {
          setTimeout(() => {
            pendingAction.onPress();
          }, pendingAction.delayMs);
          return;
        }

        pendingAction.onPress();
      }}>
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
                  const delay = item.closeDelayMs ?? 0;
                  const shouldWaitForDismiss = Platform.OS === 'ios' && !item.skipIosCloseDelay;

                  pendingDismissActionRef.current = null;
                  onClose();

                  if (shouldWaitForDismiss) {
                    pendingDismissActionRef.current = {
                      onPress: item.onPress,
                      delayMs: delay,
                    };
                    return;
                  }

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
