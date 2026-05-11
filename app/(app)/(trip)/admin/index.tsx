import { useEffect } from 'react';

import { PeopleGroupsScreen } from '@/components/trip/people-groups-screen';
import { useTripStore } from '@/store/trip.store';
import { TripRole } from '@/types';

export default function PeopleGroupsTabScreen() {
  const currentTrip = useTripStore((state) => state.currentTrip);
  const currentParticipant = useTripStore((state) => state.currentParticipant);
  const participantsWithProfiles = useTripStore((state) => state.participantsWithProfiles);
  const fetchParticipants = useTripStore((state) => state.fetchParticipants);

  useEffect(() => {
    if (currentTrip?.id) {
      fetchParticipants(currentTrip.id).catch(() => undefined);
    }
  }, [currentTrip?.id, fetchParticipants]);

  const canManage =
    currentParticipant?.role === TripRole.Organizer ||
    currentParticipant?.role === TripRole.CoOrganizer;

  return (
    <PeopleGroupsScreen
      tripId={currentTrip?.id ?? null}
      currentParticipantId={currentParticipant?.id ?? null}
      participants={participantsWithProfiles}
      canManage={canManage}
      actorUserId={currentParticipant?.user_id ?? null}
      actorRole={currentParticipant?.role ?? null}
    />
  );
}
