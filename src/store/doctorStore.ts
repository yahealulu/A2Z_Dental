import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * أطباء مساعدون (بدون حسابات دخول) - للعلاجات وحسابات الأطباء
 */
export interface Doctor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  deactivatedAt?: string;
  deactivatedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
}

interface DoctorStore {
  doctors: Doctor[];

  addDoctor: (doctor: { name: string; phone?: string; email?: string }) => Promise<Doctor>;
  toggleDoctorStatus: (id: number, reason?: string) => Promise<void>;

  getDoctorById: (id: number) => Doctor | undefined;
  getActiveDoctors: () => Doctor[];
  getInactiveDoctors: () => Doctor[];
  getAllDoctors: () => Doctor[];
  searchDoctors: (query: string) => Doctor[];
  getDoctorStats: () => DoctorStats;
}

const validateDoctorData = (doctor: { name?: string; phone?: string; email?: string }): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!doctor.name || doctor.name.trim().length < 2) {
    errors.push('اسم الطبيب يجب أن يكون على الأقل حرفين');
  }
  if (doctor.phone && doctor.phone.trim() !== '' && !/^[\d\s+()-]{7,}$/.test(doctor.phone)) {
    errors.push('رقم الهاتف غير صحيح');
  }
  if (doctor.email && doctor.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }
  return { isValid: errors.length === 0, errors };
};

export const useDoctorStore = create<DoctorStore>()(
  persist(
    (set, get) => ({
      doctors: [],

      addDoctor: async (doctorData) => {
        const validation = validateDoctorData(doctorData);
        if (!validation.isValid) throw new Error(validation.errors.join(', '));

        const now = new Date().toISOString();
        const newDoctor: Doctor = {
          id: Date.now(),
          name: doctorData.name.trim(),
          phone: doctorData.phone?.trim() || undefined,
          email: doctorData.email?.trim() || undefined,
          isActive: true,
          createdAt: now,
          updatedAt: now
        };
        set(state => ({ doctors: [...state.doctors, newDoctor] }));
        return newDoctor;
      },

      toggleDoctorStatus: async (id, reason) => {
        const doctor = get().doctors.find(d => d.id === id);
        if (!doctor) throw new Error('الطبيب غير موجود');
        const now = new Date().toISOString();
        const newStatus = !doctor.isActive;
        set(state => ({
          doctors: state.doctors.map(d =>
            d.id === id
              ? {
                  ...d,
                  isActive: newStatus,
                  deactivatedAt: newStatus ? undefined : now,
                  deactivatedReason: newStatus ? undefined : reason,
                  updatedAt: now
                }
              : d
          )
        }));
      },

      getDoctorById: (id) => get().doctors.find(d => d.id === id),
      getActiveDoctors: () => get().doctors.filter(d => d.isActive),
      getInactiveDoctors: () => get().doctors.filter(d => !d.isActive),
      getAllDoctors: () => get().doctors,

      searchDoctors: (query) => {
        const q = query.toLowerCase();
        return get().doctors.filter(
          d =>
            d.name.toLowerCase().includes(q) ||
            d.phone?.includes(q) ||
            d.email?.toLowerCase().includes(q)
        );
      },

      getDoctorStats: () => {
        const all = get().doctors;
        const active = all.filter(d => d.isActive);
        return {
          totalDoctors: all.length,
          activeDoctors: active.length,
          inactiveDoctors: all.length - active.length
        };
      }
    }),
    {
      name: 'dental-doctors-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: any) => {
        if (!persisted?.doctors) return persisted;
        return {
          ...persisted,
          doctors: persisted.doctors.map((d: any) => ({
            id: d.id,
            name: d.name || 'طبيب',
            phone: d.phone,
            email: d.email,
            isActive: d.isActive !== false,
            deactivatedAt: d.deactivatedAt,
            deactivatedReason: d.deactivatedReason,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString()
          }))
        };
      }
    }
  )
);
