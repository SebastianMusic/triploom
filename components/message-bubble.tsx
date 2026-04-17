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
}

export function MessageBubble({ message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sender}>{message.senderName ?? 'Unknown'}</Text>
      <Text style={styles.content}>{message.content}</Text>
      <Text style={styles.time}>{formatTime(message.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  content: {
    fontSize: 15,
    color: '#111',
  },
  time: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
});
