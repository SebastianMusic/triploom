import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { IconButton } from '@/components/ui/icon-button';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import type { MessageWithSender, SendMessageDTO } from '@/types';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const {
    messages, chatRooms, isLoading, isSending,
    editingMessage, isUpdating,
    openChatRoom, closeChatRoom, loadMoreMessages, sendMessage,
    updateMessage, deleteMessage, startEditingMessage, cancelEditingMessage,
  } = useChatStore();
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);

  const roomName = chatRooms.find((r) => r.id === roomId)?.chat_name ?? 'Chat';

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

  async function handleSubmitEdit(content: string) {
    if (!editingMessage) return;
    setSendError(null);
    try {
      await updateMessage({ id: editingMessage.id, content });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to update message');
    }
  }

  function handleDeleteMessage(message: MessageWithSender) {
    Alert.alert(
      'Delete message',
      'Are you sure you want to delete this message? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMessage(message.id);
            } catch {
              Alert.alert('Error', 'Could not delete the message. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View
        style={[
          styles.header,
          {
            paddingTop: spacing.xxl,
            paddingHorizontal: spacing.sm,
            paddingBottom: spacing.xs,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <IconButton
          icon={<Ionicons name="arrow-back" size={22} color={colors.text} />}
          variant="ghost"
          onPress={() => router.push('/(app)/(trip)/chat')}
          accessibilityLabel="Back to chat list"
        />
        <AppText variant="subtitle" style={styles.headerTitle} numberOfLines={1}>
          {roomName}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      {error ? (
        <View style={styles.centered}>
          <AppText tone="error" style={{ marginBottom: spacing.xs, textAlign: 'center' }}>
            {error}
          </AppText>
          <AppText
            tone="primary"
            onPress={() => {
              setError(null);
              openChatRoom(roomId!).catch((err) => {
                const msg = err?.message ?? err?.error_description ?? JSON.stringify(err);
                setError(msg || 'Failed to open chat');
              });
            }}>
            Retry
          </AppText>
        </View>
      ) : isLoading && messages.length === 0 ? (
        <View style={styles.centered} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing.xs }}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.user_id === currentUserId}
              onEdit={item.user_id === currentUserId ? () => startEditingMessage(item) : undefined}
              onDelete={item.user_id === currentUserId ? () => handleDeleteMessage(item) : undefined}
            />
          )}
          inverted
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText tone="muted" style={{ textAlign: 'center' }}>
                No messages yet — be the first to say something!
              </AppText>
            </View>
          }
        />
      )}

      {sendError && (
        <View
          style={[
            styles.sendErrorBar,
            { backgroundColor: colors.primarySoft, borderTopColor: colors.border },
          ]}>
          <AppText tone="error" style={{ flex: 1, fontSize: 13 }}>
            {sendError}
          </AppText>
          <AppText
            tone="primary"
            onPress={() => {
              if (pendingText) handleSubmit(pendingText);
            }}>
            Retry
          </AppText>
        </View>
      )}

      <MessageInput
        onSubmit={(text) => {
          setSendError(null);
          handleSubmit(text);
        }}
        isSending={isSending}
        editingMessage={editingMessage}
        onCancelEdit={cancelEditingMessage}
        isUpdating={isUpdating}
        onSubmitEdit={handleSubmitEdit}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  sendErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
