import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ChatRoomListItem } from '@/components/chat/chat-room-list-item';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Container } from '@/components/ui/container';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useChatStore } from '@/store/chat.store';
import { useTripStore } from '@/store/trip.store';

export default function ChatListScreen() {
  const router = useRouter();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const currentTrip = useTripStore((s) => s.currentTrip);
  const fetchParticipants = useTripStore((s) => s.fetchParticipants);
  const { chatRooms, isLoading, getAllChatRooms } = useChatStore();
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sortedRooms = [...chatRooms].sort((a, b) => {
    if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
    return new Date(b.lastActivityAt ?? b.created_at).getTime() - new Date(a.lastActivityAt ?? a.created_at).getTime();
  });

  const load = useCallback(async () => {
    if (!currentTrip) return;
    setError(null);
    try {
      await Promise.all([
        getAllChatRooms(currentTrip.id),
        fetchParticipants(currentTrip.id),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    }
  }, [currentTrip, fetchParticipants, getAllChatRooms]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function refresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  if (isLoading && chatRooms.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
        <AppText tone="error" style={{ marginBottom: spacing.xs, textAlign: 'center' }}>
          {error}
        </AppText>
        <AppText tone="primary" onPress={load}>
          Retry
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <AppRefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          progressViewOffset={headerContentOffset}
        />
      }
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: bottomOverlayOffset,
      }}>
      <Container>
        <Stack space="md">
          <Stack space="xs">
            {sortedRooms.length === 0 ? (
              <View style={{ paddingVertical: spacing.sm }}>
                <AppText tone="muted">No chats yet.</AppText>
              </View>
            ) : (
              sortedRooms.map((room) => (
                <ChatRoomListItem
                  key={room.id}
                  room={room}
                  onPress={() => router.push(`/(app)/(trip)/chat/${room.id}`)}
                />
              ))
            )}
          </Stack>

        </Stack>
      </Container>
    </ScrollView>
  );
}
