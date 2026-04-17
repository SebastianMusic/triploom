import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ChatRoomWithMeta } from '@/types';

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  room: ChatRoomWithMeta;
  onPress: () => void;
}

export function ChatRoomListItem({ room, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {room.chat_name ?? 'Chat'}
        </Text>
        {room.hasUnread && <View style={styles.unreadDot} />}
      </View>
      {room.lastActivityAt && (
        <Text style={styles.time}>{formatRelativeTime(room.lastActivityAt)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
