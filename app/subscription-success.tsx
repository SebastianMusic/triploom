import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SubscriptionSuccessScreen() {
  const router = useRouter();
  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(no-trip)');
    }
  }, []);
  return null;
}
