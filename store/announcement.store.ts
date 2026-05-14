import { create } from 'zustand';
import type { Announcement } from '@/types';
import type { CreateAnnouncementDTO, UpdateAnnouncementDTO } from '@/types/announcement.types';
import {
  getAnnouncements,
  createAnnouncement as createAnnouncementService,
  updateAnnouncement as updateAnnouncementService,
  deleteAnnouncement as deleteAnnouncementService,
  subscribeToAnnouncements as subscribeToAnnouncementsService,
} from '@/services/announcements.service';

let unsubscribeFromAnnouncementsRef: (() => void) | null = null;
let channelWasError = false;

function sortAnnouncements(announcements: Announcement[]) {
  return [...announcements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  fetchAnnouncements: (tripId: string) => Promise<void>;
  createAnnouncement: (tripId: string, dto: CreateAnnouncementDTO) => Promise<void>;
  updateAnnouncement: (tripId: string, announcementId: string, dto: UpdateAnnouncementDTO) => Promise<void>;
  deleteAnnouncement: (tripId: string, announcementId: string) => Promise<void>;
  subscribeToAnnouncements: (tripId: string) => void;
  unsubscribeFromAnnouncements: () => void;
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

  subscribeToAnnouncements: (tripId) => {
    if (unsubscribeFromAnnouncementsRef) {
      unsubscribeFromAnnouncementsRef();
      unsubscribeFromAnnouncementsRef = null;
    }

    channelWasError = false;
    unsubscribeFromAnnouncementsRef = subscribeToAnnouncementsService(
      tripId,
      (announcement) => {
        set((state) => {
          const exists = state.announcements.some((item) => item.id === announcement.id);
          const announcements = exists
            ? state.announcements.map((item) => (item.id === announcement.id ? announcement : item))
            : [announcement, ...state.announcements];
          return { announcements: sortAnnouncements(announcements) };
        });
      },
      (announcement) => {
        set((state) => ({
          announcements: sortAnnouncements(
            state.announcements.map((item) => (item.id === announcement.id ? announcement : item)),
          ),
        }));
      },
      (announcementId) => {
        set((state) => ({
          announcements: state.announcements.filter((item) => item.id !== announcementId),
        }));
      },
      (status) => {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          channelWasError = true;
        } else if (status === 'SUBSCRIBED' && channelWasError) {
          channelWasError = false;
          void getAnnouncements(tripId)
            .then((announcements) => set({ announcements }))
            .catch((err: any) => set({ error: err.message }));
        }
      },
    );
  },

  unsubscribeFromAnnouncements: () => {
    if (unsubscribeFromAnnouncementsRef) {
      unsubscribeFromAnnouncementsRef();
      unsubscribeFromAnnouncementsRef = null;
    }
    channelWasError = false;
  },
}));
