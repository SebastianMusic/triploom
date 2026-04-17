import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <View style={[styles.container, isOwnMessage ? styles.containerOwn : styles.containerOther]}>
      {!isOwnMessage && (
        <Text style={styles.sender}>{message.senderName ?? 'Unknown'}</Text>
      )}
      <View style={[styles.bubble, isOwnMessage ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, isOwnMessage ? styles.contentOwn : styles.contentOther]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timeOther]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 15,
  },
  contentOwn: {
    color: '#fff',
  },
  contentOther: {
    color: '#111',
  },
  time: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  timeOwn: {
    textAlign: 'right',
  },
  timeOther: {
    textAlign: 'left',
  },
});
