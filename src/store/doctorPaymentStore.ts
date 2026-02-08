import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DoctorPayment {
  id: number;
  doctorId: number;
  doctorName: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

interface DoctorPaymentState {
  payments: DoctorPayment[];
  lastId: number;

  addPayment: (data: Omit<DoctorPayment, 'id' | 'createdAt'>) => number;
  getPaymentsByDoctorId: (doctorId: number) => DoctorPayment[];
  getTotalPaidToDoctors: () => number;
  getPaymentsByDate: (date: string) => DoctorPayment[];
  getMonthlyDoctorPayments: (year: number, month: number) => number;
}

export const useDoctorPaymentStore = create<DoctorPaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      lastId: 0,

      addPayment: (data) => {
        const newId = get().lastId + 1;
        const now = new Date().toISOString();
        const item: DoctorPayment = { ...data, id: newId, createdAt: now };
        set(state => ({ payments: [...state.payments, item], lastId: newId }));
        return newId;
      },

      getPaymentsByDoctorId: (doctorId) =>
        get().payments.filter(p => p.doctorId === doctorId),

      getTotalPaidToDoctors: () =>
        get().payments.reduce((sum, p) => sum + p.amount, 0),

      getPaymentsByDate: (date) =>
        get().payments.filter(p => p.date === date),

      getMonthlyDoctorPayments: (year, month) =>
        get().payments
          .filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === year && d.getMonth() === month - 1;
          })
          .reduce((sum, p) => sum + p.amount, 0)
    }),
    { name: 'dental-doctor-payments-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
