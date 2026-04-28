import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChatLocationMapPicker, type PickedLocation } from '@/components/chat/chat-location-picker';
import { LocationActionSheet } from '@/components/chat/location-action-sheet';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { getCurrentLocation } from '@/hooks/use-location';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/store/chat.store';
import type { MessageWithSender, SendMessageDTO, SendLocationMessageDTO } from '@/types';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { headerContentOffset } = useTripChromeInsets();
  const {
    theme: { colors, spacing },
  } = useAppTheme();
  const {
    messages, chatRooms, isLoading, isSending,
    editingMessage, isUpdating,
    openChatRoom, closeChatRoom, loadMoreMessages, sendMessage, sendLocationMessage,
    updateMessage, deleteMessage, startEditingMessage, cancelEditingMessage,
  } = useChatStore();
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

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
  }, [closeChatRoom, openChatRoom, roomId]);

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

  async function handleCurrentLocation() {
    if (!roomId) return;
    setSendError(null);
    try {
      const coords = await getCurrentLocation();
      if (!coords) return;
      await sendLocationMessage({
        group_chat_id: roomId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: null,
      });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Kunne ikke sende posisjon');
    }
  }

  async function handleLocationSelected(location: PickedLocation) {
    if (!roomId) return;
    setSendError(null);
    const dto: SendLocationMessageDTO = {
      group_chat_id: roomId,
      latitude: location.lat,
      longitude: location.lng,
      label: location.label,
    };
    try {
      await sendLocationMessage(dto);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send location');
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
      {error ? (
        <View style={[styles.centered, { padding: spacing.md, paddingTop: headerContentOffset }]}>
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
        <View style={[styles.centered, { padding: spacing.md }]} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: headerContentOffset, paddingBottom: spacing.xs }}
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
            <View style={[styles.emptyContainer, { padding: spacing.xxl }]}>
              <AppText tone="muted" style={{ textAlign: 'center' }}>
                {`No messages in ${roomName} yet - be the first to say something!`}
              </AppText>
            </View>
          }
        />
      )}

      {sendError && (
        <View
          style={[
            styles.sendErrorBar,
            {
              backgroundColor: colors.primarySoft,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              gap: spacing.xs,
            },
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
        onShareLocation={() => setActionSheetVisible(true)}
        isSending={isSending}
        editingMessage={editingMessage}
        onCancelEdit={cancelEditingMessage}
        isUpdating={isUpdating}
        onSubmitEdit={handleSubmitEdit}
      />

      <LocationActionSheet
        visible={actionSheetVisible}
        onDismiss={() => setActionSheetVisible(false)}
        onCurrentLocation={handleCurrentLocation}
        onPickOnMap={() => setLocationPickerVisible(true)}
      />

      <ChatLocationMapPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelectLocation={(loc) => {
          setLocationPickerVisible(false);
          handleLocationSelected(loc);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sendErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
