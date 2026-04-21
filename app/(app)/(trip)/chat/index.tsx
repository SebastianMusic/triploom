import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ChatRoomListItem } from '@/components/chat/chat-room-list-item';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
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
  const { chatRooms, isLoading, getAllChatRooms } = useChatStore();
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentTrip) return;
    setError(null);
    try {
      await getAllChatRooms(currentTrip.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    }
  }, [currentTrip?.id]);

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
    <FlatList
      data={chatRooms}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: bottomOverlayOffset,
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
      }}
      renderItem={({ item }) => (
        <ChatRoomListItem
          room={item}
          onPress={() => router.push(`/(app)/(trip)/chat/${item.id}`)}
        />
      )}
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
          <AppText tone="muted">No chat rooms yet.</AppText>
        </View>
      }
    />
  );
}
