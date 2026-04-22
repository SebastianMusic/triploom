import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { MessageContextMenu } from '@/components/chat/message-context-menu';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import type { MessageWithSender } from '@/types';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

interface Props {
  message: MessageWithSender;
  isOwnMessage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MessageBubble({ message, isOwnMessage, onEdit, onDelete }: Props) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();
  const [copied, setCopied] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const isDeleted = !!message.deleted_at;
  const isEdited = !isDeleted && !!message.updated_at;

  async function handleCopy() {
    if (!message.content) return;
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setMenuVisible(false);
  }

  function handleLongPress() {
    if (isDeleted) return;
    if (isOwnMessage && onEdit && onDelete) {
      setMenuVisible(true);
    } else {
      handleCopy();
    }
  }

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
        isOwnMessage ? styles.containerOwn : styles.containerOther,
      ]}>
      {!isOwnMessage && (
        <AppText variant="caption" tone="muted" style={styles.sender}>
          {message.senderName ?? 'Unknown'}
        </AppText>
      )}
      <Pressable onLongPress={handleLongPress} delayLongPress={400}>
        <View
          style={[
            styles.bubble,
            {
              borderRadius: radius.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              backgroundColor: isDeleted
                ? colors.surfaceMuted
                : isOwnMessage ? colors.primary : colors.surfaceMuted,
            },
            isOwnMessage ? { borderBottomRightRadius: radius.sm / 2 } : { borderBottomLeftRadius: radius.sm / 2 },
          ]}>
          <AppText
            style={[
              styles.content,
              isDeleted
                ? { color: colors.textMuted, fontStyle: 'italic' }
                : { color: isOwnMessage ? colors.textOnPrimary : colors.text },
            ]}>
            {isDeleted ? 'This message was deleted' : message.content}
          </AppText>
        </View>
      </Pressable>
      <AppText
        variant="caption"
        tone="muted"
        style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeOther]}>
        {copied ? 'Copied' : `${formatTime(message.created_at)}${isEdited ? ' · edited' : ''}`}
      </AppText>

      {isOwnMessage && onEdit && onDelete && !isDeleted && (
        <MessageContextMenu
          visible={menuVisible}
          onEdit={() => { setMenuVisible(false); onEdit(); }}
          onDelete={() => { setMenuVisible(false); onDelete(); }}
          onCopy={handleCopy}
          onDismiss={() => setMenuVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '75%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  sender: {
    marginBottom: 2,
  },
  bubble: {},
  content: {
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    marginTop: 2,
  },
  timeOwn: {
    textAlign: 'right',
  },
  timeOther: {
    textAlign: 'left',
  },
});
