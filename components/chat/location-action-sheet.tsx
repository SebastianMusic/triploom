import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onCurrentLocation: () => void;
  onPickOnMap: () => void;
}

export function LocationActionSheet({ visible, onDismiss, onCurrentLocation, onPickOnMap }: Props) {
  const { theme: { colors, radius, spacing } } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlayStrong }]} onPress={onDismiss} />
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
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }]}
          onPress={() => { onDismiss(); onCurrentLocation(); }}>
          <Ionicons name="navigate" size={20} color={colors.primary} />
          <View style={styles.textGroup}>
            <AppText style={{ fontWeight: '600' }}>Min eksakte posisjon</AppText>
            <AppText variant="caption" tone="muted">Henter GPS-posisjonen din</AppText>
          </View>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: spacing.sm }]} />

        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }]}
          onPress={() => { onDismiss(); onPickOnMap(); }}>
          <Ionicons name="map-outline" size={20} color={colors.text} />
          <View style={styles.textGroup}>
            <AppText style={{ fontWeight: '600' }}>Velg på kart</AppText>
            <AppText variant="caption" tone="muted">Flytt pinen til ønsket posisjon</AppText>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
    gap: 12,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
