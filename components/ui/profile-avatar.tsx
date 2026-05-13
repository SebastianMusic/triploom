import { useEffect, useMemo, useState } from 'react';

import { Avatar, type AvatarProps } from '@/components/ui/avatar';
import { useProfileStore } from '@/store/profile.store';

type ProfileAvatarProps = Omit<AvatarProps, 'source'> & {
  userId?: string | null;
  imageId?: string | null;
};

function isDirectImageUri(value: string) {
  return value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('content://');
}

export function ProfileAvatar({ userId, imageId, ...avatarProps }: ProfileAvatarProps) {
  const getProfileImageUrlByPath = useProfileStore((state) => state.getProfileImageUrlByPath);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const directUri = useMemo(() => {
    if (!imageId) return null;
    return isDirectImageUri(imageId) ? imageId : null;
  }, [imageId]);

  useEffect(() => {
    if (!imageId || directUri) {
      setResolvedUrl(null);
      return;
    }

    if (!userId) {
      setResolvedUrl(null);
      return;
    }

    let cancelled = false;
    getProfileImageUrlByPath(userId, imageId)
      .then((url) => {
        if (!cancelled) setResolvedUrl(url);
      })
      .catch(() => {
        if (!cancelled) setResolvedUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [directUri, getProfileImageUrlByPath, imageId, userId]);

  const sourceUri = directUri ?? resolvedUrl;

  return (
    <Avatar
      {...avatarProps}
      source={sourceUri ? { uri: sourceUri } : undefined}
    />
  );
}
