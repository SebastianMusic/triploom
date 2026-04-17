import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChatStore } from '@/store/chat.store';
import { useTripStore } from '@/store/trip.store';
import { ChatRoomListItem } from '@/components/chat-room-list-item';

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentTrip = useTripStore((s) => s.currentTrip);
  const { chatRooms, isLoading, getAllChatRooms } = useChatStore();
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!currentTrip) return;
    setError(null);
    try {
      await getAllChatRooms(currentTrip.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    }
  }

  useEffect(() => {
    load();
  }, [currentTrip?.id]);

  if (isLoading && chatRooms.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryButton} onPress={load}>
          Retry
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chatRooms}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: insets.top + 8 }}
      renderItem={({ item }) => (
        <ChatRoomListItem
          room={item}
          onPress={() => router.push(`/(app)/(trip)/chat/${item.id}`)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No chat rooms yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#cc0000', marginBottom: 12, textAlign: 'center' },
  retryButton: { color: '#007AFF', fontWeight: '600' },
  emptyText: { color: '#888' },
});
