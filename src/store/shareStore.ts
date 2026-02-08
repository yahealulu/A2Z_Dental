import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ShareLink {
  token: string;
  patientId: number;
  createdAt: string;
}

interface ShareState {
  links: ShareLink[];

  generateToken: () => string;
  addShare: (patientId: number) => string;
  getPatientIdByToken: (token: string) => number | null;
  getShareByPatientId: (patientId: number) => ShareLink | undefined;
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useShareStore = create<ShareState>()(
  persist(
    (set, get) => ({
      links: [],

      generateToken: () => generateUUID(),

      addShare: (patientId) => {
        const existing = get().links.find(l => l.patientId === patientId);
        if (existing) return existing.token;
        const token = get().generateToken();
        const link: ShareLink = {
          token,
          patientId,
          createdAt: new Date().toISOString()
        };
        set(state => ({ links: [...state.links, link] }));
        return token;
      },

      getPatientIdByToken: (token) => {
        const link = get().links.find(l => l.token === token);
        return link ? link.patientId : null;
      },

      getShareByPatientId: (patientId) =>
        get().links.find(l => l.patientId === patientId)
    }),
    { name: 'dental-share-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
