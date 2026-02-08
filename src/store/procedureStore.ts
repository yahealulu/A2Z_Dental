import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ProcedureEffect = 'Tooth' | 'Jaw' | 'Jaws' | 'None';

export interface ProcedureGroup {
  id: number;
  name: string;
  code: string;
  effect: ProcedureEffect;
  editableName: boolean;
  order?: number;
}

export interface ProcedureItem {
  id: number;
  groupId: number;
  name: string;
  price: number;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_GROUPS: Omit<ProcedureGroup, 'id'>[] = [
  { name: 'Restoration', code: 'RE', effect: 'Tooth', editableName: false },
  { name: 'Root Canal Treatment', code: 'RC', effect: 'Tooth', editableName: false },
  { name: 'Implant', code: 'IM', effect: 'Tooth', editableName: false },
  { name: 'Cosmetic', code: 'CO', effect: 'Tooth', editableName: false },
  { name: 'Crowns', code: 'CR', effect: 'Tooth', editableName: false },
  { name: 'Orthodontics', code: 'OR', effect: 'Jaws', editableName: false },
  { name: 'Surgery', code: 'SU', effect: 'Tooth', editableName: false },
  { name: 'Periodontics', code: 'PE', effect: 'Jaw', editableName: false },
  { name: 'Prosthodontics', code: 'PR', effect: 'Jaw', editableName: false },
  { name: 'Pediatrics', code: 'PD', effect: 'Tooth', editableName: false },
  { name: 'Other Tooth Treatments', code: 'OT', effect: 'Tooth', editableName: true },
  { name: 'Other Jaw Treatments', code: 'OJ', effect: 'Jaw', editableName: true },
  { name: 'Other Jaws Treatments', code: 'OJ2', effect: 'Jaws', editableName: true }
];

const initialGroups: ProcedureGroup[] = DEFAULT_GROUPS.map((g, i) => ({
  ...g,
  id: i + 1,
  order: i + 1
}));

interface ProcedureState {
  groups: ProcedureGroup[];
  procedures: ProcedureItem[];
  lastGroupId: number;
  lastProcedureId: number;

  getGroups: () => ProcedureGroup[];
  getProceduresByGroup: (groupId: number) => ProcedureItem[];
  getProcedureById: (id: number) => ProcedureItem | undefined;
  getGroupById: (id: number) => ProcedureGroup | undefined;
  addProcedure: (data: { groupId: number; name: string; price: number }) => Promise<ProcedureItem>;
  updateProcedure: (id: number, data: Partial<Pick<ProcedureItem, 'name' | 'price'>>) => Promise<boolean>;
  deleteProcedure: (id: number) => Promise<boolean>;
  getNextCodeForGroup: (groupId: number) => string;
  getActiveProceduresByGroup: (groupId: number) => ProcedureItem[];
}

export const useProcedureStore = create<ProcedureState>()(
  persist(
    (set, get) => ({
      groups: initialGroups,
      procedures: [],
      lastGroupId: initialGroups.length,
      lastProcedureId: 0,

      getGroups: () => {
        const g = get().groups;
        return g.length ? g.slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id)) : initialGroups.slice();
      },
      getGroupById: (id) => get().groups.find(g => g.id === id) ?? initialGroups.find(g => g.id === id),
      getProceduresByGroup: (groupId) =>
        get().procedures.filter(p => p.groupId === groupId && p.isActive !== false),
      getActiveProceduresByGroup: (groupId) =>
        get().procedures.filter(p => p.groupId === groupId && p.isActive !== false),
      getProcedureById: (id) => get().procedures.find(p => p.id === id),

      getNextCodeForGroup: (groupId) => {
        const group = get().getGroupById(groupId);
        if (!group) return 'XX1';
        const inGroup = get().procedures.filter(p => p.groupId === groupId);
        const nextNum = inGroup.length + 1;
        return `${group.code}${nextNum}`;
      },

      addProcedure: async (data) => {
        const { groupId, name, price } = data;
        const group = get().getGroupById(groupId);
        if (!group) throw new Error('المجموعة غير موجودة');
        const nextCode = get().getNextCodeForGroup(groupId);
        const now = new Date().toISOString();
        const newId = get().lastProcedureId + 1;
        const item: ProcedureItem = {
          id: newId,
          groupId,
          name: name.trim(),
          price: Number(price) >= 0 ? Number(price) : 0,
          code: nextCode,
          isActive: true,
          createdAt: now,
          updatedAt: now
        };
        set(state => ({
          procedures: [...state.procedures, item],
          lastProcedureId: newId
        }));
        return item;
      },

      updateProcedure: async (id, data) => {
        const proc = get().procedures.find(p => p.id === id);
        if (!proc) return false;
        const now = new Date().toISOString();
        set(state => ({
          procedures: state.procedures.map(p =>
            p.id === id
              ? {
                  ...p,
                  ...(data.name !== undefined && { name: data.name.trim() }),
                  ...(data.price !== undefined && { price: Number(data.price) >= 0 ? Number(data.price) : p.price }),
                  updatedAt: now
                }
              : p
          )
        }));
        return true;
      },

      deleteProcedure: async (id) => {
        const proc = get().procedures.find(p => p.id === id);
        if (!proc) return false;
        const now = new Date().toISOString();
        set(state => ({
          procedures: state.procedures.map(p =>
            p.id === id ? { ...p, isActive: false, updatedAt: now } : p
          )
        }));
        return true;
      }
    }),
    {
      name: 'dental-procedure-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persisted: any) => {
        if (!persisted) return undefined as any;
        const s = persisted as ProcedureState;
        if (!Array.isArray(s.groups) || s.groups.length === 0) {
          return { ...s, groups: initialGroups, lastGroupId: initialGroups.length };
        }
        return persisted;
      }
    }
  )
);
