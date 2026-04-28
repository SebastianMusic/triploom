import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/text';
import { Row } from '@/components/ui/row';
import { useAppTheme } from '@/components/ui/theme-provider';

export function PageSheetModal({
  visible,
  title,
  onClose,
  onBack,
  onEdit,
  onDelete,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** When set, shows a back arrow on the left and moves the close button to the right. */
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}) {
  const { theme: { colors, spacing, stroke } } = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onBack ?? onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: stroke.thin, borderBottomColor: colors.border,
        }}>
          {onBack ? (
            <Pressable onPress={onBack} style={{ padding: spacing.xs / 2 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          )}
          <AppText variant="subtitle" style={{ flex: 1, textAlign: 'center' }}>{title}</AppText>
          <Row gap="xs">
            {!onBack && onEdit && (
              <Pressable onPress={onEdit} style={{ padding: spacing.xs / 2 }}>
                <Ionicons name="pencil-outline" size={20} color={colors.textMuted} />
              </Pressable>
            )}
            {!onBack && onDelete && (
              <Pressable onPress={onDelete} style={{ padding: spacing.xs / 2 }}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            )}
            {onBack && (
              <Pressable onPress={onClose} style={{ padding: spacing.xs / 2 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            )}
          </Row>
        </View>
        {children}
      </View>
    </Modal>
  );
}
