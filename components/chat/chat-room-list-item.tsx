import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ListItem } from '@/components/ui/list-item';
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
    <ListItem
      title={room.chat_name ?? 'Chat'}
      subtitle={room.lastActivityAt ? formatRelativeTime(room.lastActivityAt) : undefined}
      leading={<Avatar name={room.chat_name ?? 'C'} size="md" />}
      trailing={room.hasUnread ? <Badge label="New" variant="info" /> : undefined}
      onPress={onPress}
    />
  );
}
