import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GroupWithMembers } from '@/services/group.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useGroupStore } from '@/store/group.store';
import { updateGroupSchema } from '@/types';

type Props = {
  visible: boolean;
  group: GroupWithMembers;
  onClose: () => void;
  onUpdated: () => void;
};

export function EditGroupModal({ visible, group, onClose, onUpdated }: Props) {
  const insets = useSafeAreaInsets();
  const { theme: { colors, spacing, stroke } } = useAppTheme();
  const updateGroup = useGroupStore((state) => state.updateGroup);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [maxMembersText, setMaxMembersText] = useState(group.max_members != null ? String(group.max_members) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description ?? '');
      setMaxMembersText(group.max_members != null ? String(group.max_members) : '');
      setErrors({});
    }
  }, [visible, group]);

  function handleClose() {
    onClose();
  }

  async function handleSave() {
    const maxMembers = maxMembersText.trim() ? Number.parseInt(maxMembersText, 10) : null;
    const parsed = updateGroupSchema.safeParse({
      name,
      description: description || undefined,
      max_members: maxMembers,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? '');
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateGroup(group.id, parsed.data);
      onUpdated();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Could not update group. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <AppText variant="subtitle">Edit Group</AppText>
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
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: '' })); }}
              error={errors.name}
            />

            <Input
              label="Description"
              placeholder="Optional description"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Input
              label="Max members"
              placeholder="No limit"
              value={maxMembersText}
              onChangeText={(t) => { setMaxMembersText(t); setErrors((e) => ({ ...e, maxMembers: '' })); }}
              keyboardType="numeric"
              error={errors.maxMembers ?? errors.max_members}
            />

            <Button
              label="Save changes"
              fullWidth
              loading={isSubmitting}
              onPress={() => { void handleSave(); }}
            />

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
