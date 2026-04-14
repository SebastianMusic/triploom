import { View, Text, StyleSheet } from 'react-native';
import type { Announcement } from '@/types';

type Props = {
  announcement: Announcement;
};

export function AnnouncementItem({ announcement }: Props) {
  const date = new Date(announcement.created_at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{announcement.title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {announcement.description ? (
        <Text style={styles.description}>{announcement.description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#999',
    flexShrink: 0,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
});
