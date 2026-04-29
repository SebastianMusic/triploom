import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { savePushToken } from '@/services/profile.service';

export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    registerAndSaveToken(userId);
  }, [userId]);
}

async function registerAndSaveToken(userId: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted.');
    return;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

  if (!projectId) {
    console.error('EAS project ID not found — cannot get push token.');
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  await savePushToken(userId, token);
}
