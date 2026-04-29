import { create } from 'zustand';
import type { Announcement } from '@/types';
import type { CreateAnnouncementDTO, UpdateAnnouncementDTO } from '@/types/announcement.types';
import {
  getAnnouncements,
  createAnnouncement as createAnnouncementService,
  updateAnnouncement as updateAnnouncementService,
  deleteAnnouncement as deleteAnnouncementService,
} from '@/services/announcements.service';

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  fetchAnnouncements: (tripId: string) => Promise<void>;
  createAnnouncement: (tripId: string, dto: CreateAnnouncementDTO) => Promise<void>;
  updateAnnouncement: (tripId: string, announcementId: string, dto: UpdateAnnouncementDTO) => Promise<void>;
  deleteAnnouncement: (tripId: string, announcementId: string) => Promise<void>;
}

export const useAnnouncementStore = create<AnnouncementState>()((set) => ({
  announcements: [],
  isLoading: false,
  error: null,

  fetchAnnouncements: async (tripId) => {
    set({ isLoading: true, error: null });
    try {
      const announcements = await getAnnouncements(tripId);
      set({ announcements, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  createAnnouncement: async (tripId, dto) => {
    try {
      const announcement = await createAnnouncementService(tripId, dto);
      set((state) => ({ announcements: [announcement, ...state.announcements] }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateAnnouncement: async (tripId, announcementId, dto) => {
    try {
      const announcement = await updateAnnouncementService(tripId, announcementId, dto);
      set((state) => ({
        announcements: state.announcements.map((item) =>
          item.id === announcement.id ? announcement : item,
        ),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteAnnouncement: async (tripId, announcementId) => {
    try {
      await deleteAnnouncementService(tripId, announcementId);
      set((state) => ({
        announcements: state.announcements.filter((item) => item.id !== announcementId),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
