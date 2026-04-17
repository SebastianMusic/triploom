import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useAppTheme } from '@/components/ui/theme-provider';

interface Props {
  onSubmit: (text: string) => void;
  isSending: boolean;
}

export function MessageInput({ onSubmit, isSending }: Props) {
  const [text, setText] = useState('');
  const {
    theme: { colors, spacing },
  } = useAppTheme();

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSubmit(trimmed);
    setText('');
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}>
      <View style={styles.inputWrapper}>
        <Input
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          maxLength={2000}
          editable={!isSending}
        />
      </View>
      <IconButton
        icon={<Ionicons name="send" size={20} color={colors.primary} />}
        variant="ghost"
        onPress={handleSubmit}
        disabled={isSending || !text.trim()}
        loading={isSending}
        accessibilityLabel="Send message"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
  },
});
