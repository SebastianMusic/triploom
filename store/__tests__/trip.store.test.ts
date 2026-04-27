import { act } from '@testing-library/react-native';

import { useTripStore } from '../trip.store';
import { TripRole } from '@/types';

jest.mock('@/services/trip.service', () => ({
  getTrips: jest.fn(),
  createTrip: jest.fn(),
  deleteTrip: jest.fn(),
  getTripParticipant: jest.fn(),
  getTripParticipantsWithProfiles: jest.fn(),
  kickParticipant: jest.fn(),
  leaveTrip: jest.fn(),
  updateParticipantRole: jest.fn(),
  updateTrip: jest.fn(),
}));

jest.mock('@/services/invite.service', () => ({
  generateInviteLink: jest.fn(),
  redeemInviteLink: jest.fn(),
}));

jest.mock('@/services/events.service', () => ({
  getUpcomingEventsForTrips: jest.fn(),
}));

jest.mock('@/services/tasks.service', () => ({
  getUpcomingTasksForTrips: jest.fn(),
}));

import * as tripService from '@/services/trip.service';
import * as eventsService from '@/services/events.service';
import * as tasksService from '@/services/tasks.service';

const mockTrip = {
  id: 'trip-1',
  organizer_id: 'user-1',
  name: 'Oslo',
  description: null,
  start_date: null,
  end_date: null,
  banner_image_url: null,
  event_permission: null,
  created_at: '2026-01-01T00:00:00Z',
  userRole: TripRole.Organizer,
};

beforeEach(() => {
  jest.clearAllMocks();
  useTripStore.setState({
    currentTrip: null,
    currentParticipant: null,
    trips: [],
    tripNextActions: {},
    participants: [],
    participantsWithProfiles: [],
    isLoadingParticipants: false,
    isLoading: false,
    inviteUrl: null,
    isGeneratingInvite: false,
    isRedeemingInvite: false,
    inviteError: null,
  });
});

describe('fetchTripNextActions', () => {
  it('picks the nearest upcoming action across events and tasks per trip', async () => {
    (eventsService.getUpcomingEventsForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'event-1',
        trip_id: 'trip-1',
        title: 'Dinner',
        start_time: '2026-06-10T18:00:00Z',
        end_time: '2026-06-10T20:00:00Z',
      },
    ]);
    (tasksService.getUpcomingTasksForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        trip_id: 'trip-1',
        title: 'Pack passport',
        due_time: '2026-06-08T08:00:00Z',
      },
    ]);

    await act(async () => {
      await useTripStore.getState().fetchTripNextActions(['trip-1']);
    });

    expect(useTripStore.getState().tripNextActions['trip-1']).toEqual({
      type: 'task',
      tripId: 'trip-1',
      title: 'Pack passport',
      at: '2026-06-08T08:00:00Z',
      priority: 0,
    });
  });

  it('prioritizes tasks ahead of events even when the event starts sooner', async () => {
    (eventsService.getUpcomingEventsForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'event-1',
        trip_id: 'trip-1',
        title: 'Check-in',
        start_time: '2026-06-08T07:00:00Z',
        end_time: '2026-06-08T08:00:00Z',
        is_optional: false,
      },
    ]);
    (tasksService.getUpcomingTasksForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'task-1',
        trip_id: 'trip-1',
        title: 'Upload passport copy',
        due_time: '2026-06-08T09:00:00Z',
      },
    ]);

    await act(async () => {
      await useTripStore.getState().fetchTripNextActions(['trip-1']);
    });

    expect(useTripStore.getState().tripNextActions['trip-1']).toEqual({
      type: 'task',
      tripId: 'trip-1',
      title: 'Upload passport copy',
      at: '2026-06-08T09:00:00Z',
      priority: 0,
    });
  });

  it('prioritizes non-optional events ahead of optional events', async () => {
    (eventsService.getUpcomingEventsForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'event-1',
        trip_id: 'trip-1',
        title: 'Sunset cruise',
        start_time: '2026-06-08T07:00:00Z',
        end_time: '2026-06-08T08:00:00Z',
        is_optional: true,
      },
      {
        id: 'event-2',
        trip_id: 'trip-1',
        title: 'Flight boarding',
        start_time: '2026-06-08T10:00:00Z',
        end_time: '2026-06-08T11:00:00Z',
        is_optional: false,
      },
    ]);
    (tasksService.getUpcomingTasksForTrips as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await useTripStore.getState().fetchTripNextActions(['trip-1']);
    });

    expect(useTripStore.getState().tripNextActions['trip-1']).toEqual({
      type: 'event',
      tripId: 'trip-1',
      title: 'Flight boarding',
      at: '2026-06-08T10:00:00Z',
      priority: 1,
    });
  });
});

describe('fetchTrips', () => {
  it('loads trips and next actions together', async () => {
    (tripService.getTrips as jest.Mock).mockResolvedValue([mockTrip]);
    (eventsService.getUpcomingEventsForTrips as jest.Mock).mockResolvedValue([
      {
        id: 'event-1',
        trip_id: 'trip-1',
        title: 'Boat tour',
        start_time: '2026-06-09T10:00:00Z',
        end_time: '2026-06-09T12:00:00Z',
      },
    ]);
    (tasksService.getUpcomingTasksForTrips as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await useTripStore.getState().fetchTrips();
    });

    expect(useTripStore.getState().trips).toEqual([mockTrip]);
    expect(useTripStore.getState().tripNextActions['trip-1']).toEqual({
      type: 'event',
      tripId: 'trip-1',
      title: 'Boat tour',
      at: '2026-06-09T10:00:00Z',
      priority: 2,
    });
    expect(useTripStore.getState().isLoading).toBe(false);
  });
});
