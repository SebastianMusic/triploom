import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

interface Props {
  visible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}

export function MessageContextMenu({ visible, onEdit, onDelete, onCopy, onDismiss }: Props) {
  const { theme: { colors, radius, spacing } } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, paddingHorizontal: spacing.sm }]}
          onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={colors.text} />
          <AppText style={{ marginLeft: spacing.xs }}>Edit</AppText>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, paddingHorizontal: spacing.sm }]}
          onPress={onCopy}>
          <Ionicons name="copy-outline" size={20} color={colors.text} />
          <AppText style={{ marginLeft: spacing.xs }}>Copy</AppText>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, paddingHorizontal: spacing.sm }]}
          onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <AppText style={{ marginLeft: spacing.xs, color: colors.error }}>Delete</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});
