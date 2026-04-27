import { act } from '@testing-library/react-native';
import * as groupService from '@/services/group.service';

import { useGroupStore } from '../group.store';

jest.mock('@/services/group.service', () => ({
  createTripGroups: jest.fn(),
  deleteGroup: jest.fn(),
  getTripGroupsWithMembers: jest.fn(),
  joinGroup: jest.fn(),
  leaveGroup: jest.fn(),
  updateGroup: jest.fn(),
}));

const mockGroups = [
  {
    id: 'group-1',
    trip_id: 'trip-1',
    name: 'Cabin 1',
    description: null,
    max_members: 4,
    created_at: '2026-01-01T00:00:00Z',
    group_membership: [],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  useGroupStore.setState({
    tripId: null,
    groups: [],
    isLoading: false,
    isMutating: false,
  });
});

describe('useGroupStore', () => {
  it('fetches groups and stores the active trip id', async () => {
    (groupService.getTripGroupsWithMembers as jest.Mock).mockResolvedValue(mockGroups);

    await act(async () => {
      await useGroupStore.getState().fetchGroups('trip-1');
    });

    expect(useGroupStore.getState().tripId).toBe('trip-1');
    expect(useGroupStore.getState().groups).toEqual(mockGroups);
    expect(useGroupStore.getState().isLoading).toBe(false);
  });

  it('refreshes groups after creating them', async () => {
    (groupService.createTripGroups as jest.Mock).mockResolvedValue([
      {
        id: 'group-1',
        trip_id: 'trip-1',
        name: 'Cabin 1',
        description: null,
        max_members: 4,
        created_at: '2026-01-01T00:00:00Z',
      },
    ]);
    (groupService.getTripGroupsWithMembers as jest.Mock).mockResolvedValue(mockGroups);

    await act(async () => {
      await useGroupStore.getState().createGroups({
        tripId: 'trip-1',
        baseName: 'Cabin',
        count: 1,
        maxMembers: 4,
      });
    });

    expect(groupService.createTripGroups).toHaveBeenCalledWith({
      tripId: 'trip-1',
      baseName: 'Cabin',
      count: 1,
      maxMembers: 4,
    });
    expect(useGroupStore.getState().groups).toEqual(mockGroups);
    expect(useGroupStore.getState().isMutating).toBe(false);
  });

  it('refreshes groups after joining and leaving a group', async () => {
    (groupService.getTripGroupsWithMembers as jest.Mock).mockResolvedValue(mockGroups);
    useGroupStore.setState({ tripId: 'trip-1' });

    await act(async () => {
      await useGroupStore.getState().joinGroup('group-1', 'participant-1');
      await useGroupStore.getState().leaveGroup('group-1', 'participant-1');
    });

    expect(groupService.joinGroup).toHaveBeenCalledWith('group-1', 'participant-1');
    expect(groupService.leaveGroup).toHaveBeenCalledWith('group-1', 'participant-1');
    expect(groupService.getTripGroupsWithMembers).toHaveBeenCalledTimes(2);
  });

  it('refreshes groups after updating and deleting a group', async () => {
    (groupService.updateGroup as jest.Mock).mockResolvedValue({
      id: 'group-1',
      trip_id: 'trip-1',
      name: 'Cabin Prime',
      description: null,
      max_members: 4,
      created_at: '2026-01-01T00:00:00Z',
    });
    (groupService.getTripGroupsWithMembers as jest.Mock).mockResolvedValue(mockGroups);
    useGroupStore.setState({ tripId: 'trip-1' });

    await act(async () => {
      await useGroupStore.getState().updateGroup('group-1', {
        name: 'Cabin Prime',
        max_members: 4,
      });
      await useGroupStore.getState().deleteGroup('group-1');
    });

    expect(groupService.updateGroup).toHaveBeenCalledWith('group-1', {
      name: 'Cabin Prime',
      max_members: 4,
    });
    expect(groupService.deleteGroup).toHaveBeenCalledWith('group-1');
    expect(groupService.getTripGroupsWithMembers).toHaveBeenCalledTimes(2);
  });
});
