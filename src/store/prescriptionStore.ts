import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Prescription {
  id: number;
  patientId: number;
  medicineName: string;
  dosage: string;
  type: string; // e.g. tablet, syrup
  numberOfDays: number;
  note?: string;
  date: string;
  recordedBy?: string;
  createdAt: string;
}

interface PrescriptionState {
  prescriptions: Prescription[];
  lastId: number;

  addPrescription: (data: Omit<Prescription, 'id' | 'createdAt'>) => number;
  updatePrescription: (id: number, data: Partial<Omit<Prescription, 'id' | 'patientId' | 'createdAt'>>) => boolean;
  getPrescriptionById: (id: number) => Prescription | undefined;
  getPrescriptionsByPatientId: (patientId: number) => Prescription[];
}

export const usePrescriptionStore = create<PrescriptionState>()(
  persist(
    (set, get) => ({
      prescriptions: [],
      lastId: 0,

      addPrescription: (data) => {
        const newId = get().lastId + 1;
        const now = new Date().toISOString();
        const item: Prescription = {
          ...data,
          id: newId,
          createdAt: now
        };
        set(state => ({
          prescriptions: [...state.prescriptions, item],
          lastId: newId
        }));
        return newId;
      },

      updatePrescription: (id, data) => {
        const p = get().prescriptions.find(x => x.id === id);
        if (!p) return false;
        set(state => ({
          prescriptions: state.prescriptions.map(x =>
            x.id === id ? { ...x, ...data } : x
          )
        }));
        return true;
      },

      getPrescriptionById: (id) => get().prescriptions.find(x => x.id === id),
      getPrescriptionsByPatientId: (patientId) =>
        get().prescriptions.filter(x => x.patientId === patientId)
    }),
    { name: 'dental-prescription-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
