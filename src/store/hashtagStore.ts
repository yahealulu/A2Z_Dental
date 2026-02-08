import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Hashtag {
  id: number;
  label: string;
  order?: number;
}

const MAX_HASHTAGS = 10;

interface HashtagState {
  hashtags: Hashtag[];
  lastId: number;

  getHashtags: () => Hashtag[];
  addHashtag: (label: string) => Promise<number>;
  updateHashtag: (id: number, label: string) => Promise<boolean>;
  deleteHashtag: (id: number) => Promise<boolean>;
}

export const useHashtagStore = create<HashtagState>()(
  persist(
    (set, get) => ({
      hashtags: [],
      lastId: 0,

      getHashtags: () => get().hashtags.slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)),

      addHashtag: async (label) => {
        const trimmed = label.trim();
        if (!trimmed) throw new Error('التسمية مطلوبة');
        if (get().hashtags.length >= MAX_HASHTAGS) throw new Error(`الحد الأقصى ${MAX_HASHTAGS} وسوم`);
        const exists = get().hashtags.some(h => h.label.toLowerCase() === trimmed.toLowerCase());
        if (exists) throw new Error('الوسم موجود مسبقاً');
        const newId = get().lastId + 1;
        const item: Hashtag = { id: newId, label: trimmed, order: newId };
        set(state => ({ hashtags: [...state.hashtags, item], lastId: newId }));
        return newId;
      },

      updateHashtag: async (id, label) => {
        const trimmed = label.trim();
        if (!trimmed) return false;
        set(state => ({
          hashtags: state.hashtags.map(h => (h.id === id ? { ...h, label: trimmed } : h))
        }));
        return true;
      },

      deleteHashtag: async (id) => {
        set(state => ({ hashtags: state.hashtags.filter(h => h.id !== id) }));
        return true;
      }
    }),
    { name: 'dental-hashtag-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
