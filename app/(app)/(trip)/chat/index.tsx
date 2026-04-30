import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ChatRoomListItem } from '@/components/chat/chat-room-list-item';
import { useTripChromeInsets } from '@/components/layout/use-trip-chrome';
import { AppRefreshControl } from '@/components/ui/app-refresh-control';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Row } from '@/components/ui/row';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useChatStore } from '@/store/chat.store';
import { useTripStore } from '@/store/trip.store';

export default function ChatListScreen() {
  const router = useRouter();
  const { headerContentOffset, bottomOverlayOffset } = useTripChromeInsets();
  const {
    theme: { colors, radius, spacing, typography },
  } = useAppTheme();
  const currentTrip = useTripStore((s) => s.currentTrip);
  const participantsWithProfiles = useTripStore((s) => s.participantsWithProfiles);
  const fetchParticipants = useTripStore((s) => s.fetchParticipants);
  const { chatRooms, isLoading, getAllChatRooms } = useChatStore();
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentTrip) return;
    setError(null);
    try {
      await Promise.all([
        getAllChatRooms(currentTrip.id),
        fetchParticipants(currentTrip.id),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
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
    <FlatList
      data={chatRooms}
      keyExtractor={(item) => item.id}
      refreshControl={
        <AppRefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
        />
      }
      contentContainerStyle={{
        paddingTop: headerContentOffset,
        paddingBottom: bottomOverlayOffset,
        gap: spacing.sm,
      }}
      ListHeaderComponent={
        <Container>
          <Card style={{ padding: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <AppText variant="subtitle">{currentTrip?.name ?? 'Trip chat'}</AppText>
              <AppText tone="muted">All trip conversations in one place.</AppText>
            </View>
          </Card>
        </Container>
      }
      renderItem={({ item }) => (
        <Container>
          <ChatRoomListItem
            room={item}
            onPress={() => router.push(`/(app)/(trip)/chat/${item.id}`)}
          />
        </Container>
      )}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
            <AppText tone="muted">No chat rooms yet.</AppText>
          </View>
        }
      ListFooterComponent={
        <Container>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/(trip)/admin/people')}
            style={({ pressed }) => ({
              marginTop: spacing.sm,
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              padding: spacing.sm,
              opacity: pressed ? 0.9 : 1,
            })}>
            <Row justify="space-between" align="center" gap="sm">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.secondarySoft,
                  }}>
                  <Ionicons name="people-outline" size={22} color={colors.secondary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText style={typography.label}>People & groups</AppText>
                  <AppText variant="caption" tone="muted">
                    Open participants, contact details, and group memberships.
                  </AppText>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <AppText style={typography.label}>{participantsWithProfiles.length}</AppText>
                <AppText variant="caption" tone="muted">
                  {participantsWithProfiles.length === 1 ? 'person' : 'people'}
                </AppText>
              </View>
            </Row>
          </Pressable>
        </Container>
      }
      />
  );
}
