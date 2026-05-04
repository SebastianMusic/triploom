import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useProfileStore } from '@/store/profile.store';

export function useNotificationNavigation() {
  const { selectedTrip, setSelectedTrip } = useProfileStore();
  const handledNotificationId = useRef<string | null>(null);
  const pendingChatNav = useRef<{ tripId: string; roomId: string } | null>(null);
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Capture notification tap; switch trip only if needed
  useEffect(() => {
    if (!lastNotificationResponse) return;
    const notifId = lastNotificationResponse.notification.request.identifier;
    if (handledNotificationId.current === notifId) return;
    handledNotificationId.current = notifId;

    const data = lastNotificationResponse.notification.request.content.data;
    const roomId = data?.group_chat_id as string | undefined;
    const tripId = data?.trip_id as string | undefined;
    if (!roomId || !tripId) return;

    if (selectedTrip === tripId) {
      router.push(`/(app)/(trip)/chat/${roomId}`);
    } else {
      pendingChatNav.current = { tripId, roomId };
      setSelectedTrip(tripId);
    }
  }, [lastNotificationResponse]);

  // Navigate once selectedTrip has updated to the target trip
  useEffect(() => {
    if (!pendingChatNav.current || !selectedTrip) return;
    if (selectedTrip !== pendingChatNav.current.tripId) return;
    const { roomId } = pendingChatNav.current;
    pendingChatNav.current = null;
    router.push(`/(app)/(trip)/chat/${roomId}`);
  }, [selectedTrip]);
}
