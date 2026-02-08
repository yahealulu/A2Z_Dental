import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { validatePhoneNational } from '../utils/phoneValidation';

// تعريف نموذج بيانات المريض المحسن
export interface Patient {
  id: number;
  name: string;
  phone: string; // للعرض (يمكن أن يكون countryCode + مسافة + phoneNational)
  email?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  address?: string;
  notes?: string;
  medicalHistory?: string;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  accountClosures?: AccountClosure[];
  // حقول إضافية حسب المتطلبات
  internalClinicId?: number; // رقم تسلسلي داخل العيادة (بدون فجوات)
  countryCode?: string; // رمز الدولة مثل +963
  phoneNational?: string; // الأرقام فقط بعد رمز الدولة
  distinctiveMark?: string; // علامة مميزة اختيارية
  hashtagIds?: number[]; // وسوم للتصفية (VIP، صديق قديم، إلخ)
  registeredBy?: string; // الحساب الذي سجّل المريض
}

// تعريف نموذج تسكير الحساب
export interface AccountClosure {
  id: number;
  patientId: number;
  closureDate: string; // تاريخ تسكير الحساب
  totalCost: number; // إجمالي التكلفة المسكرة
  totalPaid: number; // إجمالي المدفوع المسكر
  remainingAmount: number; // المبلغ المتبقي وقت التسكير
  notes?: string; // ملاحظات التسكير
  createdAt: string;
}

// تعريف نموذج البحث والتصفية
export interface PatientFilters {
  searchQuery?: string;
  gender?: 'male' | 'female' | 'all';
  ageRange?: { min: number; max: number };
  hasMedicalHistory?: boolean;
  isActive?: boolean;
}

// تعريف نموذج الإحصائيات
export interface PatientStats {
  total: number;
  male: number;
  female: number;
  withMedicalHistory: number;
  recentlyAdded: number;
}

// واجهة حالة المتجر المحسنة
interface PatientState {
  patients: Patient[];
  lastId: number;
  lastInternalClinicId: number; // للتسلسل الداخلي بدون فجوات
  version: number;

  addPatient: (patient: Omit<Patient, 'id' | 'internalClinicId' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updatePatient: (id: number, patient: Partial<Patient>) => Promise<boolean>;
  deletePatient: (id: number) => Promise<boolean>;
  softDeletePatient: (id: number) => Promise<boolean>;
  restorePatient: (id: number) => Promise<boolean>;

  // البحث والتصفية
  getPatientById: (id: number) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  filterPatients: (filters: PatientFilters) => Patient[];
  getActivePatients: () => Patient[];
  getDeletedPatients: () => Patient[];

  // الإحصائيات
  getPatientStats: () => PatientStats;
  getPatientsByGender: (gender: 'male' | 'female') => Patient[];
  getPatientsWithMedicalHistory: () => Patient[];
  getRecentPatients: (days?: number) => Patient[];

  // التحقق من صحة البيانات
  validatePatient: (patient: Partial<Patient>) => { isValid: boolean; errors: string[] };

  // إدارة تسكير الحساب
  closePatientAccount: (patientId: number, closureData: Omit<AccountClosure, 'id' | 'patientId' | 'createdAt'>) => Promise<number>;
  getPatientAccountClosures: (patientId: number) => AccountClosure[];
  getLastAccountClosure: (patientId: number) => AccountClosure | undefined;
  hasActiveAccountClosure: (patientId: number) => boolean;

  // النسخ الاحتياطي والاستعادة
  exportPatients: () => string;
  importPatients: (data: string) => Promise<{ success: boolean; imported: number; errors: string[] }>;
  clearAllPatients: () => Promise<boolean>;
}

// وظائف مساعدة للتحقق من صحة البيانات
const validatePatientData = (patient: Partial<Patient>, existingPatients: Patient[] = [], excludeId?: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!patient.name || patient.name.trim().length < 2) {
    errors.push('اسم المريض يجب أن يكون على الأقل حرفين');
  }

  // التحقق من عدم تكرار الاسم
  if (patient.name && patient.name.trim()) {
    const duplicateName = existingPatients.find(p =>
      p.name.trim().toLowerCase() === patient.name!.trim().toLowerCase() &&
      p.id !== excludeId
    );
    if (duplicateName) {
      errors.push('اسم المريض موجود مسبقاً، يرجى اختيار اسم آخر');
    }
  }

  // التحقق من الهاتف: إن وُجد countryCode و phoneNational نتحقق من الطول حسب الدولة
  if (patient.countryCode != null && patient.phoneNational != null) {
    const result = validatePhoneNational(patient.countryCode, patient.phoneNational);
    if (!result.valid && result.error) errors.push(result.error);
  } else if (patient.phone && patient.phone.trim() !== '' && !/^\d{7,}$/.test(patient.phone.replace(/\D/g, ''))) {
    errors.push('رقم الهاتف يجب أن يتكون من 7 خانات على الأقل (أو استخدم رمز الدولة والرقم)');
  }

  if (patient.email && patient.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
    errors.push('البريد الإلكتروني غير صحيح (أو اتركه فارغاً)');
  }

  if (patient.birthDate && new Date(patient.birthDate) > new Date()) {
    errors.push('تاريخ الميلاد لا يمكن أن يكون في المستقبل');
  }

  if (patient.medicalHistory === undefined || patient.medicalHistory === null) {
    // default "None" can be set on add
  } else if (typeof patient.medicalHistory !== 'string') {
    errors.push('السجل الطبي يجب أن يكون نصاً');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// وظائف مساعدة للحسابات
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

// إنشاء المتجر المحسن
export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: [],
      lastId: 0,
      lastInternalClinicId: 0,
      version: 1,

      addPatient: async (patientData) => {
        try {
          const validation = validatePatientData(patientData, get().patients);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastId + 1;
          const nextInternalId = get().lastInternalClinicId + 1;
          const now = new Date().toISOString();
          const medicalHistory = patientData.medicalHistory != null && patientData.medicalHistory !== ''
            ? patientData.medicalHistory
            : 'None';

          const newPatient: Patient = {
            ...patientData,
            id: newId,
            internalClinicId: nextInternalId,
            medicalHistory,
            createdAt: now,
            updatedAt: now,
            isActive: true
          };

          set(state => ({
            patients: [...state.patients, newPatient],
            lastId: newId,
            lastInternalClinicId: nextInternalId
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      // تحديث بيانات مريض موجود
      updatePatient: async (id, updatedFields) => {
        try {
          const validation = validatePatientData(updatedFields, get().patients, id);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const patient = get().patients.find(p => p.id === id);
          if (!patient) {
            throw new Error('المريض غير موجود');
          }

          set(state => ({
            patients: state.patients.map(patient =>
              patient.id === id
                ? { ...patient, ...updatedFields, updatedAt: new Date().toISOString() }
                : patient
            )
          }));

          return true;
        } catch (error) {
          return false;
        }
      },

      // حذف مريض نهائياً - فقط إذا لم يكن له مواعيد أو علاجات أو فواتير (سلامة البيانات)
      deletePatient: async (id) => {
        try {
          const appointments = (await import('./appointmentStore')).useAppointmentStore.getState().appointments;
          const hasAppointments = appointments.some((a: { patientId: number }) => a.patientId === id);
          if (hasAppointments) throw new Error('لا يمكن حذف مريض له مواعيد مسجلة');

          const treatments = (await import('./treatmentStore')).useTreatmentStore.getState().treatments;
          const hasTreatments = treatments.some((t: { patientId: number }) => t.patientId === id);
          if (hasTreatments) throw new Error('لا يمكن حذف مريض له علاجات مسجلة');

          const invoices = (await import('./invoiceStore')).useInvoiceStore.getState().invoices;
          const hasInvoices = invoices.some((i: { patientId: number }) => i.patientId === id);
          if (hasInvoices) throw new Error('لا يمكن حذف مريض له فواتير مسجلة');

          set(state => ({
            patients: state.patients.filter(patient => patient.id !== id)
          }));
          return true;
        } catch (error) {
          throw error;
        }
      },

      // حذف مريض مؤقتاً (soft delete)
      softDeletePatient: async (id) => {
        try {
          set(state => ({
            patients: state.patients.map(patient =>
              patient.id === id
                ? { ...patient, isActive: false, updatedAt: new Date().toISOString() }
                : patient
            )
          }));
          return true;
        } catch (error) {
          return false;
        }
      },

      // استعادة مريض محذوف مؤقتاً
      restorePatient: async (id) => {
        try {
          set(state => ({
            patients: state.patients.map(patient =>
              patient.id === id
                ? { ...patient, isActive: true, updatedAt: new Date().toISOString() }
                : patient
            )
          }));
          return true;
        } catch (error) {
          return false;
        }
      },

      // البحث والتصفية
      getPatientById: (id) => {
        return get().patients.find(patient => patient.id === id);
      },

      searchPatients: (query) => {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) return get().patients.filter(p => p.isActive !== false);

        return get().patients.filter(patient =>
          patient.isActive !== false && (
            patient.name.toLowerCase().includes(searchTerm) ||
            patient.email?.toLowerCase().includes(searchTerm) ||
            patient.address?.toLowerCase().includes(searchTerm)
          )
        );
      },

      filterPatients: (filters) => {
        let filtered = get().patients.filter(p => p.isActive !== false);

        if (filters.searchQuery) {
          const searchTerm = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(patient =>
            patient.name.toLowerCase().includes(searchTerm)
          );
        }

        if (filters.gender && filters.gender !== 'all') {
          filtered = filtered.filter(patient => patient.gender === filters.gender);
        }

        if (filters.ageRange) {
          filtered = filtered.filter(patient => {
            if (!patient.birthDate) return false;
            const age = calculateAge(patient.birthDate);
            return age >= filters.ageRange!.min && age <= filters.ageRange!.max;
          });
        }

        if (filters.hasMedicalHistory !== undefined) {
          filtered = filtered.filter(patient => {
            const hasMedicalHistory = patient.medicalHistory && patient.medicalHistory.trim().length > 0;
            return filters.hasMedicalHistory ? hasMedicalHistory : !hasMedicalHistory;
          });
        }

        if (filters.isActive !== undefined) {
          filtered = filtered.filter(patient => patient.isActive === filters.isActive);
        }

        return filtered;
      },

      getActivePatients: () => {
        return get().patients.filter(patient => patient.isActive !== false);
      },

      getDeletedPatients: () => {
        return get().patients.filter(patient => patient.isActive === false);
      },

      // الإحصائيات
      getPatientStats: () => {
        const activePatients = get().patients.filter(p => p.isActive !== false);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return {
          total: activePatients.length,
          male: activePatients.filter(p => p.gender === 'male').length,
          female: activePatients.filter(p => p.gender === 'female').length,
          withMedicalHistory: activePatients.filter(p => p.medicalHistory && p.medicalHistory.trim().length > 0).length,
          recentlyAdded: activePatients.filter(p =>
            p.createdAt && new Date(p.createdAt) > thirtyDaysAgo
          ).length
        };
      },

      getPatientsByGender: (gender) => {
        return get().patients.filter(patient =>
          patient.isActive !== false && patient.gender === gender
        );
      },

      getPatientsWithMedicalHistory: () => {
        return get().patients.filter(patient =>
          patient.isActive !== false && patient.medicalHistory && typeof patient.medicalHistory === 'string' && patient.medicalHistory.trim().length > 0
        );
      },

      getRecentPatients: (days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return get().patients.filter(patient =>
          patient.isActive !== false &&
          patient.createdAt &&
          new Date(patient.createdAt) > cutoffDate
        );
      },

      // التحقق من صحة البيانات
      validatePatient: (patient) => {
        return validatePatientData(patient, get().patients);
      },

      // إدارة تسكير الحساب
      closePatientAccount: async (patientId, closureData) => {
        try {
          const patient = get().getPatientById(patientId);
          if (!patient) {
            throw new Error('المريض غير موجود');
          }

          const newClosureId = Date.now(); // استخدام timestamp كمعرف فريد
          const now = new Date().toISOString();

          const newClosure: AccountClosure = {
            ...closureData,
            id: newClosureId,
            patientId,
            createdAt: now
          };

          set(state => ({
            patients: state.patients.map(p =>
              p.id === patientId
                ? {
                    ...p,
                    accountClosures: [...(p.accountClosures || []), newClosure],
                    updatedAt: now
                  }
                : p
            )
          }));

          return newClosureId;
        } catch (error) {
          throw error;
        }
      },

      getPatientAccountClosures: (patientId) => {
        const patient = get().getPatientById(patientId);
        return patient?.accountClosures || [];
      },

      getLastAccountClosure: (patientId) => {
        const closures = get().getPatientAccountClosures(patientId);
        return closures.length > 0
          ? closures.sort((a, b) => new Date(b.closureDate).getTime() - new Date(a.closureDate).getTime())[0]
          : undefined;
      },

      hasActiveAccountClosure: (patientId) => {
        const lastClosure = get().getLastAccountClosure(patientId);
        return lastClosure !== undefined;
      },

      // النسخ الاحتياطي والاستعادة
      exportPatients: () => {
        const data = {
          patients: get().patients,
          lastId: get().lastId,
          version: get().version,
          exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
      },

      importPatients: async (data) => {
        try {
          const parsed = JSON.parse(data);

          if (!parsed.patients || !Array.isArray(parsed.patients)) {
            throw new Error('بيانات غير صحيحة');
          }

          let imported = 0;
          const errors: string[] = [];

          for (const patientData of parsed.patients) {
            try {
              const validation = validatePatientData(patientData, parsed.patients);
              if (!validation.isValid) {
                errors.push(`المريض ${patientData.name}: ${validation.errors.join(', ')}`);
                continue;
              }
              imported++;
            } catch (error) {
              errors.push(`خطأ في معالجة المريض ${patientData.name || 'غير معروف'}`);
            }
          }

          if (imported > 0) {
            set({
              patients: parsed.patients,
              lastId: parsed.lastId || get().lastId,
              version: parsed.version || get().version
            });
          }

          return {
            success: imported > 0,
            imported,
            errors
          };
        } catch (error) {
          return {
            success: false,
            imported: 0,
            errors: ['خطأ في قراءة البيانات']
          };
        }
      },

      clearAllPatients: async () => {
        try {
          set({
            patients: [],
            lastId: 0,
            lastInternalClinicId: 0
          });
          return true;
        } catch (error) {
          return false;
        }
      }
    }),
    {
      name: 'dental-patients-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) return persistedState;
        const patients = persistedState.patients?.map((p: any, idx: number) => ({
          ...p,
          isActive: p.isActive !== false,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          internalClinicId: p.internalClinicId ?? p.id ?? idx + 1
        })) ?? [];
        const lastInternalClinicId = persistedState.lastInternalClinicId ?? Math.max(0, ...patients.map((p: any) => p.internalClinicId ?? 0));
        return {
          ...persistedState,
          patients,
          lastInternalClinicId,
          version: 2
        };
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات المرضى من localStorage
      }
    }
  )
);