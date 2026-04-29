import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Stack } from '@/components/ui/stack';
import { AppText } from '@/components/ui/text';
import { useAppTheme } from '@/components/ui/theme-provider';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useProfileStore } from '@/store/profile.store';

type AnnouncementFormProps = {
  announcementId?: string;
  initialTitle?: string | null;
  initialDescription?: string | null;
  onPosted?: () => void;
};

export function AnnouncementForm({
  announcementId,
  initialTitle = '',
  initialDescription = '',
  onPosted,
}: AnnouncementFormProps) {
  const { selectedTrip } = useProfileStore();
  const { createAnnouncement, updateAnnouncement } = useAnnouncementStore();
  const {
    theme: { typography },
  } = useAppTheme();
  const [title, setTitle] = useState(initialTitle ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!selectedTrip) {
      setError('No trip selected.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dto = {
        title: title.trim(),
        description: description.trim() || null,
      };

      if (announcementId) {
        await updateAnnouncement(selectedTrip, announcementId, dto);
      } else {
        await createAnnouncement(selectedTrip, dto);
        setTitle('');
        setDescription('');
      }
      onPosted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card variant="elevated">
      <Stack space="sm">
        <AppText style={typography.label}>
          {announcementId ? 'Edit announcement' : 'New announcement'}
        </AppText>
        <Input
          label="Title"
          placeholder="What should everyone know?"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError(null);
          }}
          maxLength={100}
        />
        <Input
          label="Message"
          placeholder="Optional details"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
        {error ? (
          <AppText variant="caption" tone="error">
            {error}
          </AppText>
        ) : null}
        <Button
          label={isSubmitting ? 'Saving...' : announcementId ? 'Save announcement' : 'Post announcement'}
          loading={isSubmitting}
          onPress={handleSubmit}
          fullWidth
        />
      </Stack>
    </Card>
  );
}
