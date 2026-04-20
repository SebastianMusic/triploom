import { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useAnnouncementStore } from '@/store/announcement.store';
import { useProfileStore } from '@/store/profile.store';
import { AnnouncementItem } from './AnnouncementItem';

export function AnnouncementList() {
  const { selectedTrip } = useProfileStore();
  const { announcements, isLoading, fetchAnnouncements } = useAnnouncementStore();

  useEffect(() => {
    if (selectedTrip) {
      fetchAnnouncements(selectedTrip);
    }
  }, [selectedTrip]);

  return (
    <View style={styles.container}>
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
