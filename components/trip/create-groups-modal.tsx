import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createTripGroups } from '@/services/group.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';

type Props = {
  visible: boolean;
  tripId: string;
  onClose: () => void;
  onCreated: () => void;
};

function buildPreview(baseName: string, count: number): string {
  const name = baseName.trim();
  if (!name) return '';
  if (count === 1) return name;
  if (count === 2) return `${name} 1, ${name} 2`;
  if (count <= 4) return Array.from({ length: count }, (_, i) => `${name} ${i + 1}`).join(', ');
  return `${name} 1, ${name} 2 … ${name} ${count}`;
}

export function CreateGroupsModal({ visible, tripId, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, radius, stroke } } = useAppTheme();

  const [baseName, setBaseName] = useState('');
  const [description, setDescription] = useState('');
  const [countText, setCountText] = useState('1');
  const [maxMembersText, setMaxMembersText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setBaseName('');
    setDescription('');
    setCountText('1');
    setMaxMembersText('');
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    const newErrors: Record<string, string> = {};

    if (!baseName.trim()) {
      newErrors.baseName = 'Group name is required';
    }

    const count = parseInt(countText, 10);
    if (isNaN(count) || count < 1) {
      newErrors.count = 'Must be at least 1';
    } else if (count > 200) {
      newErrors.count = 'Maximum 200 groups at once';
    }

    const maxMembers = maxMembersText.trim() ? parseInt(maxMembersText, 10) : undefined;
    if (maxMembersText.trim() && (isNaN(maxMembers!) || maxMembers! < 1)) {
      newErrors.maxMembers = 'Must be a positive number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await createTripGroups({
        tripId,
        baseName: baseName.trim(),
        count,
        description: description.trim() || undefined,
        maxMembers,
      });
      reset();
      onCreated();
    } catch {
      Alert.alert('Error', 'Could not create groups. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const count = parseInt(countText, 10);
  const preview = buildPreview(baseName, isNaN(count) || count < 1 ? 1 : count);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>

          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + spacing.sm,
              paddingBottom: spacing.sm,
              paddingHorizontal: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surface,
              borderBottomWidth: stroke.thin,
              borderBottomColor: colors.border,
            }}>
            <Pressable onPress={handleClose} style={{ padding: spacing.xs / 2 }} accessibilityLabel="Cancel">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
            <AppText variant="subtitle">Create Groups</AppText>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingTop: spacing.md,
              paddingBottom: insets.bottom + spacing.xl,
              gap: spacing.md,
            }}>

            <Input
              label="Group name *"
              placeholder="e.g. Bus, Cabin, Team"
              value={baseName}
              onChangeText={(t) => { setBaseName(t); setErrors((e) => ({ ...e, baseName: '' })); }}
              error={errors.baseName}
            />

            <Input
              label="Description"
              placeholder="Optional description for all groups"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Input
              label="Number of groups"
              placeholder="1"
              value={countText}
              onChangeText={(t) => { setCountText(t); setErrors((e) => ({ ...e, count: '' })); }}
              keyboardType="numeric"
              error={errors.count}
            />

            <Input
              label="Max members per group"
              placeholder="No limit"
              value={maxMembersText}
              onChangeText={(t) => { setMaxMembersText(t); setErrors((e) => ({ ...e, maxMembers: '' })); }}
              keyboardType="numeric"
              error={errors.maxMembers}
            />

            {/* Preview */}
            {preview ? (
              <View
                style={{
                  padding: spacing.sm,
                  borderRadius: radius.md,
                  borderWidth: stroke.thin,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceMuted,
                  gap: spacing.xs / 2,
                }}>
                <AppText variant="caption" tone="muted">Preview</AppText>
                <AppText style={{ fontStyle: 'italic' }}>{preview}</AppText>
              </View>
            ) : null}

            <Button
              label={count > 1 ? `Create ${isNaN(count) ? '' : count} groups` : 'Create group'}
              fullWidth
              loading={isSubmitting}
              onPress={() => { void handleCreate(); }}
            />

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
