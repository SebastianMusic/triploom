import { create } from 'zustand';

import {
  createTripGroups as createTripGroupsService,
  deleteGroup as deleteGroupService,
  getTripGroupsWithMembers as getTripGroupsWithMembersService,
  joinGroup as joinGroupService,
  leaveGroup as leaveGroupService,
  updateGroup as updateGroupService,
  type GroupWithMembers,
} from '@/services/group.service';
import type { CreateGroupsDTO, TripGroup, UpdateGroupDTO } from '@/types';

interface GroupState {
  tripId: string | null;
  groups: GroupWithMembers[];
  isLoading: boolean;
  isMutating: boolean;
  fetchGroups: (tripId: string) => Promise<void>;
  clearGroups: () => void;
  createGroups: (dto: CreateGroupsDTO) => Promise<TripGroup[]>;
  joinGroup: (groupId: string, participantId: string) => Promise<void>;
  leaveGroup: (groupId: string, participantId: string) => Promise<void>;
  updateGroup: (groupId: string, dto: UpdateGroupDTO) => Promise<TripGroup>;
  deleteGroup: (groupId: string) => Promise<void>;
}

async function reloadGroups(tripId: string, set: (partial: Partial<GroupState>) => void) {
  const groups = await getTripGroupsWithMembersService(tripId);
  set({ groups, tripId });
}

export const useGroupStore = create<GroupState>()((set, get) => ({
  tripId: null,
  groups: [],
  isLoading: false,
  isMutating: false,

  fetchGroups: async (tripId) => {
    set({ isLoading: true });
    try {
      await reloadGroups(tripId, set);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearGroups: () => {
    set({ tripId: null, groups: [] });
  },

  createGroups: async (dto) => {
    set({ isMutating: true });
    try {
      const createdGroups = await createTripGroupsService(dto);
      await reloadGroups(dto.tripId, set);
      set({ isMutating: false });
      return createdGroups;
    } catch (error) {
      set({ isMutating: false });
      throw error;
    }
  },

  joinGroup: async (groupId, participantId) => {
    set({ isMutating: true });
    try {
      await joinGroupService(groupId, participantId);
      const tripId = get().tripId;
      if (tripId) {
        await reloadGroups(tripId, set);
      }
      set({ isMutating: false });
    } catch (error) {
      set({ isMutating: false });
      throw error;
    }
  },

  leaveGroup: async (groupId, participantId) => {
    set({ isMutating: true });
    try {
      await leaveGroupService(groupId, participantId);
      const tripId = get().tripId;
      if (tripId) {
        await reloadGroups(tripId, set);
      }
      set({ isMutating: false });
    } catch (error) {
      set({ isMutating: false });
      throw error;
    }
  },

  updateGroup: async (groupId, dto) => {
    set({ isMutating: true });
    try {
      const updatedGroup = await updateGroupService(groupId, dto);
      const tripId = get().tripId;
      if (tripId) {
        await reloadGroups(tripId, set);
      }
      set({ isMutating: false });
      return updatedGroup;
    } catch (error) {
      set({ isMutating: false });
      throw error;
    }
  },

  deleteGroup: async (groupId) => {
    set({ isMutating: true });
    try {
      await deleteGroupService(groupId);
      const tripId = get().tripId;
      if (tripId) {
        await reloadGroups(tripId, set);
      }
      set({ isMutating: false });
    } catch (error) {
      set({ isMutating: false });
      throw error;
    }
  },
}));
