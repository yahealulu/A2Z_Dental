import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

// تعريف نموذج البيانات للموعد
export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId?: number;
  doctorName: string;
  time: string;
  date: string; // التاريخ بتنسيق yyyy-MM-dd
  treatment: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  isNewPatient?: boolean;
  phone?: string;
  notes?: string;
  // خصائص إضافية للتعديل
  day?: string;
  month?: string;
  year?: string;
  hour?: string;
  minute?: string;
  period?: string;
}

// تعريف حالة المتجر
interface AppointmentState {
  appointments: Appointment[];
  lastId: number;

  // الأفعال
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: number, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: number) => void;
  getAppointmentsByDate: (date: string) => Appointment[];
  getAppointmentsByPatientId: (patientId: number) => Appointment[];
  getTodayAppointments: () => Appointment[];
}

// إنشاء المتجر مع استخدام middleware للحفظ في localStorage
export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: [],
      lastId: 0,

      // إضافة موعد جديد
      addAppointment: (appointment) => set(state => {
        const newId = state.lastId + 1;
        const newAppointment = {
          ...appointment,
          id: newId,
          date: appointment.date || format(new Date(), 'yyyy-MM-dd'),
        };

        // تنظيف cache Dashboard عند إضافة موعد جديد
        setTimeout(() => {
          try {
            import('../utils/dashboardOptimization').then(({ dashboardOptimizer }) => {
              dashboardOptimizer.invalidateCache('appointments');
            });
          } catch (error) {
            console.warn('Could not invalidate dashboard cache:', error);
          }
        }, 0);

        return {
          appointments: [...state.appointments, newAppointment],
          lastId: newId
        };
      }),

      // تحديث موعد موجود
      updateAppointment: (id, updatedFields) => set(state => {
        // تنظيف cache Dashboard عند تحديث موعد
        setTimeout(() => {
          try {
            import('../utils/dashboardOptimization').then(({ dashboardOptimizer }) => {
              dashboardOptimizer.invalidateCache('appointments');
            });
          } catch (error) {
            console.warn('Could not invalidate dashboard cache:', error);
          }
        }, 0);

        const updatedAppointments = state.appointments.map(appointment =>
          appointment.id === id
            ? {
                ...appointment,
                ...updatedFields
              }
            : appointment
        );

        return { appointments: updatedAppointments };
      }),

      // حذف موعد
      deleteAppointment: (id) => set(state => {
        // تنظيف cache Dashboard عند حذف موعد
        setTimeout(() => {
          try {
            import('../utils/dashboardOptimization').then(({ dashboardOptimizer }) => {
              dashboardOptimizer.invalidateCache('appointments');
            });
          } catch (error) {
            console.warn('Could not invalidate dashboard cache:', error);
          }
        }, 0);

        return {
          appointments: state.appointments.filter(appointment => appointment.id !== id)
        };
      }),

      // الحصول على المواعيد حسب التاريخ
      getAppointmentsByDate: (date) => {
        return get().appointments.filter(appointment => appointment.date === date);
      },

      // الحصول على مواعيد مريض معين
      getAppointmentsByPatientId: (patientId) => {
        return get().appointments.filter(appointment => appointment.patientId === patientId);
      },

      // الحصول على مواعيد اليوم
      getTodayAppointments: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().appointments.filter(appointment => appointment.date === today);
      }
    }),
    {
      name: 'dental-appointments-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            version: 1,
            appointments: persistedState.appointments?.map((appointment: any) => ({
              ...appointment,
              createdAt: appointment.createdAt || new Date().toISOString(),
              updatedAt: appointment.updatedAt || new Date().toISOString()
            })) || []
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات المواعيد من localStorage
      }
    }
  )
);
