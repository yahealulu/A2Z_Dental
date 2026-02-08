import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LabPayment {
  id: number;
  labId: number;
  labName: string;
  amount: number;
  date: string;
  note?: string;
  orderId?: number; // optional link to lab request
  createdAt: string;
}

interface LabPaymentState {
  payments: LabPayment[];
  lastId: number;

  addPayment: (data: Omit<LabPayment, 'id' | 'createdAt'>) => number;
  getPaymentsByLabId: (labId: number) => LabPayment[];
  getTotalPaidToLabs: () => number;
  getPaymentsByDate: (date: string) => LabPayment[];
  getMonthlyLabPayments: (year: number, month: number) => number;
}

export const useLabPaymentStore = create<LabPaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      lastId: 0,

      addPayment: (data) => {
        const newId = get().lastId + 1;
        const now = new Date().toISOString();
        const item: LabPayment = { ...data, id: newId, createdAt: now };
        set(state => ({ payments: [...state.payments, item], lastId: newId }));
        return newId;
      },

      getPaymentsByLabId: (labId) =>
        get().payments.filter(p => p.labId === labId),

      getTotalPaidToLabs: () =>
        get().payments.reduce((sum, p) => sum + p.amount, 0),

      getPaymentsByDate: (date) =>
        get().payments.filter(p => p.date === date),

      getMonthlyLabPayments: (year, month) =>
        get().payments
          .filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === year && d.getMonth() === month - 1;
          })
          .reduce((sum, p) => sum + p.amount, 0)
    }),
    { name: 'dental-lab-payments-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
