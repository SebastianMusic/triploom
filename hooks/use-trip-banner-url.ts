import { useEffect, useState } from 'react';
import { getTripBannerUrl } from '@/services/trip.service';

export function useTripBannerUrl(storedValue: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedValue) {
      setUrl(null);
      return;
    }
    if (storedValue.startsWith('http') || storedValue.startsWith('file://') || storedValue.startsWith('content://')) {
      setUrl(storedValue);
      return;
    }
    getTripBannerUrl(storedValue).then(setUrl).catch(() => setUrl(null));
  }, [storedValue]);

  return url;
}
