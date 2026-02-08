import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { usePaymentStore } from './paymentStore';

export type DiscountType = 'percent' | 'amount';

export interface Invoice {
  id: number;
  invoiceNumber: number; // sequential per clinic
  patientId: number;
  treatmentId?: number; // optional, set when created from Start Treatment
  date: string; // YYYY-MM-DD
  subtotal: number; // procedure/base price
  diagnosticFeeOrExtra: number;
  discountValue: number;
  discountType: DiscountType;
  totalAfterDiscount: number;
  doctorId?: number;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceState {
  invoices: Invoice[];
  lastId: number;
  lastInvoiceNumber: number;

  addInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => number;
  updateInvoice: (id: number, data: Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'patientId' | 'treatmentId' | 'createdAt'>>) => boolean;
  getInvoiceById: (id: number) => Invoice | undefined;
  getInvoiceByNumber: (invoiceNumber: number) => Invoice | undefined;
  getInvoicesByPatientId: (patientId: number) => Invoice[];
  getInvoicesByTreatmentId: (treatmentId: number) => Invoice | undefined;
  getInvoicesByDate: (date: string) => Invoice[];
  getTotalPaidForInvoice: (invoiceId: number) => number; // from payment store - will be wired
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: [],
      lastId: 0,
      lastInvoiceNumber: 0,

      addInvoice: (data) => {
        const nextId = get().lastId + 1;
        const nextNum = get().lastInvoiceNumber + 1;
        const now = new Date().toISOString();
        const invoice: Invoice = {
          ...data,
          id: nextId,
          invoiceNumber: nextNum,
          createdAt: now,
          updatedAt: now
        };
        set(state => ({
          invoices: [...state.invoices, invoice],
          lastId: nextId,
          lastInvoiceNumber: nextNum
        }));
        return nextId;
      },

      updateInvoice: (id, data) => {
        const inv = get().invoices.find(i => i.id === id);
        if (!inv) return false;
        const now = new Date().toISOString();
        set(state => ({
          invoices: state.invoices.map(i =>
            i.id === id ? { ...i, ...data, updatedAt: now } : i
          )
        }));
        return true;
      },

      getInvoiceById: (id) => get().invoices.find(i => i.id === id),
      getInvoiceByNumber: (num) => get().invoices.find(i => i.invoiceNumber === num),
      getInvoicesByPatientId: (patientId) =>
        get().invoices.filter(i => i.patientId === patientId),
      getInvoicesByTreatmentId: (treatmentId) =>
        get().invoices.find(i => i.treatmentId === treatmentId),
      getInvoicesByDate: (date) =>
        get().invoices.filter(i => i.date === date),

      getTotalPaidForInvoice: (invoiceId) =>
        usePaymentStore.getState().getTotalPaidByInvoiceId(invoiceId)
    }),
    {
      name: 'dental-invoice-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
);
