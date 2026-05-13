import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Row } from '@/components/ui/row';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
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
  const { theme: { colors, radius, sizes, spacing, stroke, typography } } = useAppTheme();

  return (
    <Card
      variant="interactive"
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm + 2,
        backgroundColor: room.hasUnread ? colors.secondarySoft : colors.surface,
        borderWidth: room.hasUnread ? stroke.focus : 0,
        borderColor: room.hasUnread ? colors.primary : colors.transparent,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      }}>
      <Row align="center" gap="sm">
        <Avatar
          name={room.chat_name ?? 'C'}
          size="md"
          borderRadius={radius.md}
          source={room.imageUrl ? { uri: room.imageUrl } : undefined}
        />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <AppText style={[typography.label, { color: colors.text, fontSize: 17 }]} numberOfLines={1}>
            {room.chat_name ?? 'Chat'}
          </AppText>
          <AppText tone="muted" numberOfLines={1} style={{ fontSize: 13 }}>
            {room.lastActivityAt ? formatRelativeTime(room.lastActivityAt) : 'No messages yet'}
          </AppText>
        </View>
        {room.hasUnread ? <Badge label="New" variant="info" /> : null}
        <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.textMuted} />
      </Row>
    </Card>
  );
}
