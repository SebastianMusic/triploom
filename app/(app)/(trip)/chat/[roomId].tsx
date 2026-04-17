import { useEffect, useRef, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '@/store/chat.store';
import { MessageBubble } from '@/components/message-bubble';
import { MessageInput } from '@/components/message-input';
import type { SendMessageDTO } from '@/types';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, isLoading, isSending, openChatRoom, closeChatRoom, loadMoreMessages, sendMessage } =
    useChatStore();
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    setError(null);
    openChatRoom(roomId).catch((err) => {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
      setError(msg || 'Failed to open chat');
    });
    return () => {
      closeChatRoom();
    };
  }, [roomId]);

  async function handleLoadMore() {
    if (!roomId || isLoading || messages.length === 0) return;
    try {
      await loadMoreMessages(roomId);
    } catch {
      // Silently ignore load-more errors — not critical
    }
  }

  async function handleSubmit(text: string) {
    if (!roomId) return;
    setSendError(null);
    setPendingText(text);
    const dto: SendMessageDTO = { content: text, group_chat_id: roomId };
    try {
      await sendMessage(dto);
      setPendingText(null);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            openChatRoom(roomId!).catch((err) => {
              const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
              setError(msg || 'Failed to open chat');
            });
          }}
        >
          Retry
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      {isLoading && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No messages yet — be the first to say something!
              </Text>
            </View>
          }
        />
      )}

      {sendError && (
        <View style={styles.sendErrorBar}>
          <Text style={styles.sendErrorText}>{sendError}</Text>
          <Text
            style={styles.retryButton}
            onPress={() => {
              if (pendingText) handleSubmit(pendingText);
            }}
          >
            Retry
          </Text>
        </View>
      )}

      <MessageInput
        onSubmit={(text) => {
          setSendError(null);
          handleSubmit(text);
        }}
        isSending={isSending}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  backButton: { padding: 16 },
  backButtonText: { color: '#007AFF', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyText: { color: '#888', textAlign: 'center' },
  errorText: { color: '#cc0000', marginBottom: 12, textAlign: 'center' },
  retryButton: { color: '#007AFF', fontWeight: '600' },
  sendErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3f3',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ffcccc',
  },
  sendErrorText: { flex: 1, color: '#cc0000', fontSize: 13 },
});
