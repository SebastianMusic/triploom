import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { MessageWithSender } from '@/types';

interface Props {
  onSubmit: (text: string) => void;
  onShareLocation?: () => void;
  isSending: boolean;
  editingMessage?: MessageWithSender | null;
  onCancelEdit?: () => void;
  isUpdating?: boolean;
  onSubmitEdit?: (content: string) => void;
}

export function MessageInput({
  onSubmit,
  onShareLocation,
  isSending,
  editingMessage,
  onCancelEdit,
  isUpdating,
  onSubmitEdit,
}: Props) {
  const [text, setText] = useState('');
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content ?? '');
    } else {
      setText('');
    }
  }, [editingMessage?.id]);

  const isEditing = !!editingMessage;
  const isBusy = isEditing ? !!isUpdating : isSending;

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    if (isEditing && onSubmitEdit) {
      onSubmitEdit(trimmed);
    } else {
      onSubmit(trimmed);
      setText('');
    }
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
      {isEditing && (
        <View
          style={[
            styles.editBar,
            { borderTopColor: colors.border, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.sm },
          ]}>
          <AppText variant="caption" tone="primary" style={{ flex: 1 }}>
            Editing message
          </AppText>
          <IconButton
            icon={<Ionicons name="close" size={16} color={colors.textMuted} />}
            variant="ghost"
            onPress={() => { setText(''); onCancelEdit?.(); }}
            accessibilityLabel="Cancel edit"
          />
        </View>
      )}
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderTopColor: colors.border,
          },
        ]}>
        {!isEditing && onShareLocation && (
          <IconButton
            icon={<Ionicons name="location-outline" size={20} color={colors.textMuted} />}
            variant="ghost"
            onPress={onShareLocation}
            disabled={isBusy}
            accessibilityLabel="Del posisjon"
          />
        )}
        <View style={styles.inputWrapper}>
          <Input
            value={text}
            onChangeText={setText}
            placeholder={isEditing ? 'Edit message...' : 'Type a message...'}
            multiline
            maxLength={2000}
            editable={!isBusy}
          />
        </View>
        <IconButton
          icon={
            <Ionicons
              name={isEditing ? 'checkmark' : 'send'}
              size={20}
              color={colors.primary}
            />
          }
          variant="ghost"
          onPress={handleSubmit}
          disabled={isBusy || !text.trim()}
          loading={isBusy}
          accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
  },
});
