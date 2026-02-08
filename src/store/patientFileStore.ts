import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PatientFile {
  id: number;
  patientId: number;
  image: string; // base64 or data URL
  title: string;
  note?: string;
  date: string;
  createdAt: string;
}

interface PatientFileState {
  files: PatientFile[];
  lastId: number;

  addFile: (data: Omit<PatientFile, 'id' | 'createdAt'>) => number;
  getFilesByPatientId: (patientId: number) => PatientFile[];
  deleteFile: (id: number) => boolean;
}

export const usePatientFileStore = create<PatientFileState>()(
  persist(
    (set, get) => ({
      files: [],
      lastId: 0,

      addFile: (data) => {
        const newId = get().lastId + 1;
        const now = new Date().toISOString();
        const item: PatientFile = {
          ...data,
          id: newId,
          createdAt: now
        };
        set(state => ({
          files: [...state.files, item],
          lastId: newId
        }));
        return newId;
      },

      getFilesByPatientId: (patientId) =>
        get().files.filter(f => f.patientId === patientId),

      deleteFile: (id) => {
        const exists = get().files.some(f => f.id === id);
        if (!exists) return false;
        set(state => ({ files: state.files.filter(f => f.id !== id) }));
        return true;
      }
    }),
    { name: 'dental-patient-files-storage', storage: createJSONStorage(() => localStorage), version: 1 }
  )
);
