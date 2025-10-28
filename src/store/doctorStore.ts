import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  experience?: number;
  workDays: string[];
  workHours: {
    start: string;
    end: string;
  };
  isActive: boolean;
  deactivatedAt?: string; // تاريخ إيقاف التفعيل
  deactivatedReason?: string; // سبب إيقاف التفعيل (اختياري)
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
  doctorsBySpecialization: Record<string, number>;
  averageExperience: number;
}

interface DoctorStore {
  doctors: Doctor[];

  // العمليات الأساسية
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => Promise<Doctor>;
  toggleDoctorStatus: (id: number, reason?: string) => Promise<void>; // تغيير الحالة فقط
  // تم إزالة updateDoctor و deleteDoctor لمنع التعديل والحذف

  // دوال الحصول على البيانات
  getDoctorById: (id: number) => Doctor | undefined;
  getActiveDoctors: () => Doctor[];
  getInactiveDoctors: () => Doctor[];
  getAllDoctors: () => Doctor[];
  getDoctorsBySpecialization: (specialization: string) => Doctor[];

  // البحث والتصفية
  searchDoctors: (query: string) => Doctor[];
  filterDoctors: (filters: {
    specialization?: string;
    isActive?: boolean;
    workDay?: string;
  }) => Doctor[];

  // الإحصائيات
  getDoctorStats: () => DoctorStats;
}

// وظائف مساعدة للتحقق من صحة البيانات
const validateDoctorData = (doctor: Partial<Doctor>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!doctor.name || doctor.name.trim().length < 2) {
    errors.push('اسم الطبيب يجب أن يكون على الأقل حرفين');
  }

  if (!doctor.specialization || doctor.specialization.trim().length < 2) {
    errors.push('التخصص مطلوب');
  }

  if (doctor.phone && doctor.phone.trim() !== '' && !/^(05|09)\d{8}$/.test(doctor.phone)) {
    errors.push('رقم الهاتف يجب أن يبدأ بـ 05 أو 09 ويتكون من 10 أرقام');
  }

  if (doctor.email && doctor.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const useDoctorStore = create<DoctorStore>()(
  persist(
    (set, get) => ({
      doctors: [],

      // إضافة طبيب جديد
      addDoctor: async (doctorData) => {
        try {
          const validation = validateDoctorData(doctorData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newDoctor: Doctor = {
            ...doctorData,
            id: Date.now(),
            isActive: true, // الحالة الافتراضية نشط
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            doctors: [...state.doctors, newDoctor]
          }));

          return newDoctor;
        } catch (error) {
          throw error;
        }
      },

      // تغيير حالة الطبيب (نشط/غير نشط) فقط
      toggleDoctorStatus: async (id, reason) => {
        try {
          const existingDoctor = get().doctors.find(d => d.id === id);
          if (!existingDoctor) {
            throw new Error('الطبيب غير موجود');
          }

          const now = new Date().toISOString();
          const newStatus = !existingDoctor.isActive;

          set((state) => ({
            doctors: state.doctors.map(doctor =>
              doctor.id === id
                ? {
                    ...doctor,
                    isActive: newStatus,
                    deactivatedAt: newStatus ? undefined : now,
                    deactivatedReason: newStatus ? undefined : reason,
                    updatedAt: now
                  }
                : doctor
            )
          }));
        } catch (error) {
          throw error;
        }
      },

      // الحصول على طبيب بالمعرف
      getDoctorById: (id) => {
        return get().doctors.find(doctor => doctor.id === id);
      },

      // الحصول على الأطباء النشطين
      getActiveDoctors: () => {
        return get().doctors.filter(doctor => doctor.isActive);
      },

      // الحصول على الأطباء غير النشطين
      getInactiveDoctors: () => {
        return get().doctors.filter(doctor => !doctor.isActive);
      },

      // الحصول على جميع الأطباء (للتقارير التاريخية)
      getAllDoctors: () => {
        return get().doctors;
      },

      // الحصول على الأطباء حسب التخصص
      getDoctorsBySpecialization: (specialization) => {
        return get().doctors.filter(doctor =>
          doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
        );
      },

      // البحث في الأطباء
      searchDoctors: (query) => {
        const searchTerm = query.toLowerCase();
        return get().doctors.filter(doctor =>
          doctor.name.toLowerCase().includes(searchTerm) ||
          doctor.specialization.toLowerCase().includes(searchTerm) ||
          doctor.phone.includes(searchTerm) ||
          doctor.email.toLowerCase().includes(searchTerm)
        );
      },

      // تصفية الأطباء
      filterDoctors: (filters) => {
        return get().doctors.filter(doctor => {
          if (filters.specialization && !doctor.specialization.toLowerCase().includes(filters.specialization.toLowerCase())) {
            return false;
          }
          if (filters.isActive !== undefined && doctor.isActive !== filters.isActive) {
            return false;
          }
          if (filters.workDay && !doctor.workDays.includes(filters.workDay)) {
            return false;
          }
          return true;
        });
      },

      // الحصول على إحصائيات الأطباء
      getDoctorStats: () => {
        const allDoctors = get().doctors;
        const activeDoctors = allDoctors.filter(d => d.isActive);

        const doctorsBySpecialization = allDoctors.reduce((acc, d) => {
          acc[d.specialization] = (acc[d.specialization] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const totalExperience = allDoctors
          .filter(d => d.experience)
          .reduce((sum, d) => sum + (d.experience || 0), 0);

        const doctorsWithExperience = allDoctors.filter(d => d.experience).length;

        return {
          totalDoctors: allDoctors.length,
          activeDoctors: activeDoctors.length,
          inactiveDoctors: allDoctors.length - activeDoctors.length,
          doctorsBySpecialization,
          averageExperience: doctorsWithExperience > 0 ? totalExperience / doctorsWithExperience : 0
        };
      }
    }),
    {
      name: 'dental-doctors-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            version: 1,
            doctors: persistedState.doctors?.map((doctor: any) => ({
              ...doctor,
              isActive: doctor.isActive !== false,
              createdAt: doctor.createdAt || new Date().toISOString(),
              updatedAt: doctor.updatedAt || new Date().toISOString()
            })) || []
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات الأطباء من localStorage
      }
    }
  )
);
