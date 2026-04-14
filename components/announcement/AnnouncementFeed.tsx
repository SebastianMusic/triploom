import { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useTripStore } from '@/store/trip.store';
import { useProfileStore } from '@/store/profile.store';
import { TripRole } from '@/types/trip.types';
import { AnnouncementItem } from './AnnouncementItem';
import { AnnouncementForm } from './AnnouncementForm';
import type { CreateAnnouncementDTO } from '@/types/announcement.types';

const CAN_POST_ROLES: (string | null)[] = [TripRole.Organizer, TripRole.CoOrganizer];

export function AnnouncementFeed() {
  const { selectedTrip } = useProfileStore();
  const { currentParticipant } = useTripStore();
  const { announcements, isLoading, fetchAnnouncements, createAnnouncement } =
    useAnnouncementStore();

  useEffect(() => {
    if (selectedTrip) fetchAnnouncements(selectedTrip);
  }, [selectedTrip]);

  async function handleCreate(dto: CreateAnnouncementDTO) {
    if (!selectedTrip) return;
    await createAnnouncement(selectedTrip, dto);
  }

  const canPost = CAN_POST_ROLES.includes(currentParticipant?.role ?? null);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Announcements</Text>

      {canPost && (
        <AnnouncementForm onSubmit={handleCreate} />
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : announcements.length === 0 ? (
        <Text style={styles.empty}>No announcements yet.</Text>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AnnouncementItem announcement={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 16,
  },
  empty: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  separator: {
    height: 10,
  },
});
