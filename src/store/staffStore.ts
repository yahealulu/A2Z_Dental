import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type StaffRole = 'owner' | 'nurse';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  permissions?: string[]; // for nurse: e.g. ['edit_patients', 'add_payments', 'view_invoices']
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffState {
  users: StaffUser[];
  currentUserId: string | null;

  getCurrentUser: () => StaffUser | null;
  setCurrentUser: (userId: string | null) => void;
  addNurse: (data: { name: string; permissions?: string[] }) => Promise<StaffUser>;
  updateNursePermissions: (userId: string, permissions: string[]) => Promise<boolean>;
  getStaffList: () => StaffUser[];
  getOwner: () => StaffUser | undefined;
  getNurses: () => StaffUser[];
  canDeleteUser: (userId: string) => boolean; // false if user has recorded activity
}

const DEFAULT_OWNER_ID = 'owner-1';

const defaultUsers: StaffUser[] = [
  {
    id: DEFAULT_OWNER_ID,
    name: 'طبيب العيادة',
    role: 'owner',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      currentUserId: DEFAULT_OWNER_ID,

      getCurrentUser: () => {
        const uid = get().currentUserId;
        if (!uid) return null;
        return get().users.find(u => u.id === uid) ?? null;
      },

      setCurrentUser: (userId) => set({ currentUserId: userId }),

      addNurse: async (data) => {
        const now = new Date().toISOString();
        const id = `nurse-${Date.now()}`;
        const nurse: StaffUser = {
          id,
          name: data.name.trim(),
          role: 'nurse',
          permissions: data.permissions ?? [],
          isActive: true,
          createdAt: now,
          updatedAt: now
        };
        set(state => ({ users: [...state.users, nurse] }));
        return nurse;
      },

      updateNursePermissions: async (userId, permissions) => {
        const user = get().users.find(u => u.id === userId);
        if (!user || user.role !== 'nurse') return false;
        const now = new Date().toISOString();
        set(state => ({
          users: state.users.map(u =>
            u.id === userId ? { ...u, permissions, updatedAt: now } : u
          )
        }));
        return true;
      },

      getStaffList: () => get().users.filter(u => u.isActive),
      getOwner: () => get().users.find(u => u.role === 'owner'),
      getNurses: () => get().users.filter(u => u.role === 'nurse' && u.isActive),

      canDeleteUser: () => false
    }),
    {
      name: 'dental-staff-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && (!state.users || state.users.length === 0)) {
          state.users = [
            {
              id: DEFAULT_OWNER_ID,
              name: 'طبيب العيادة',
              role: 'owner',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          state.currentUserId = DEFAULT_OWNER_ID;
        }
      }
    }
  )
);
