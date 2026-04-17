import { StyleSheet, View } from 'react-native';

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
}

export function MessageBubble({ message, isOwnMessage }: Props) {
  const {
    theme: { colors, radius, spacing },
  } = useAppTheme();

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
      <View
        style={[
          styles.bubble,
          {
            borderRadius: radius.md,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            backgroundColor: isOwnMessage ? colors.primary : colors.surfaceMuted,
          },
          isOwnMessage ? { borderBottomRightRadius: radius.sm / 2 } : { borderBottomLeftRadius: radius.sm / 2 },
        ]}>
        <AppText
          style={[styles.content, { color: isOwnMessage ? colors.textOnPrimary : colors.text }]}>
          {message.content}
        </AppText>
      </View>
      <AppText
        variant="caption"
        tone="muted"
        style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeOther]}>
        {formatTime(message.created_at)}
      </AppText>
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
