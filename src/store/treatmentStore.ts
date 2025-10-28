import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useDoctorStore } from './doctorStore';

// تعريف نموذج الجلسة
export interface TreatmentSession {
  id: number;
  treatmentId: number;
  sessionNumber: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// تعريف نموذج العلاج المحسن مع نظام الجلسات
export interface Treatment {
  id: number;
  patientId: number;
  name: string;
  description?: string;
  cost: number;
  startDate: string; // تاريخ بداية العلاج
  endDate?: string; // تاريخ انتهاء العلاج (عند الإكمال)
  status: 'in_progress' | 'completed' | 'cancelled_incomplete' | 'cancelled_no_sessions';
  isStarted?: boolean; // هل تم بدء العلاج (إضافة التكلفة لحساب المريض)
  teethNumbers?: number[];
  doctorId?: number;
  doctorName?: string; // اسم الطبيب محفوظ وقت إنشاء العلاج
  sessions: TreatmentSession[]; // قائمة الجلسات
  finalNotes?: string; // ملاحظات نهائية عند الإكمال أو الإلغاء
  cancelReason?: string; // سبب الإلغاء (إن وجد)
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

// قالب العلاج (العلاجات الثابتة المتاحة في العيادة)
export interface TreatmentTemplate {
  id: number;
  name: string;
  description: string;
  defaultCost: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// تعريف نموذج التصفية
export interface TreatmentFilters {
  patientId?: number;
  status?: Treatment['status'];
  dateRange?: { start: string; end: string };
  doctorId?: number;
  minCost?: number;
  maxCost?: number;
}

// تعريف نموذج الإحصائيات
export interface TreatmentStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  cancelled: number;
  totalRevenue: number;
  averageCost: number;
}

// واجهة حالة المتجر المحسنة
interface TreatmentState {
  treatments: Treatment[];
  treatmentTemplates: TreatmentTemplate[];
  lastId: number;
  lastTemplateId: number;
  lastSessionId: number;
  version: number;

  // الأفعال الأساسية للعلاجات
  addTreatment: (treatment: Omit<Treatment, 'id' | 'sessions' | 'createdAt' | 'updatedAt'>, firstSessionNotes?: string) => Promise<number>;
  updateTreatment: (id: number, treatment: Partial<Treatment>) => Promise<boolean>;
  deleteTreatment: (id: number) => Promise<boolean>;
  completeTreatment: (id: number, finalNotes?: string, newCost?: number) => Promise<boolean>;
  cancelTreatment: (id: number, saveToRecord: boolean, cancelReason?: string) => Promise<boolean>;
  updateTreatmentCost: (id: number, newCost: number) => Promise<boolean>;

  // الأفعال الأساسية للجلسات
  addSession: (treatmentId: number, notes: string, sessionDate?: string) => Promise<TreatmentSession>;
  updateSession: (sessionId: number, notes: string) => Promise<boolean>;
  getSessionsByTreatment: (treatmentId: number) => TreatmentSession[];

  // الأفعال الأساسية لقوالب العلاجات
  addTreatmentTemplate: (template: Omit<TreatmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TreatmentTemplate>;
  updateTreatmentTemplate: (id: number, template: Partial<TreatmentTemplate>) => Promise<boolean>;
  deleteTreatmentTemplate: (id: number) => Promise<boolean>;
  initializeDefaultTemplates: () => void;

  // البحث والتصفية للعلاجات
  getTreatmentById: (id: number) => Treatment | undefined;
  getTreatmentsByPatient: (patientId: number) => Treatment[];
  getTreatmentsByDoctor: (doctorId: number) => Treatment[];
  filterTreatments: (filters: TreatmentFilters) => Treatment[];
  getActiveTreatments: () => Treatment[];
  getInProgressTreatments: () => Treatment[]; // العلاجات الجارية فقط
  getCompletedTreatments: () => Treatment[]; // العلاجات المكتملة فقط

  // دوال خاصة للسجل السني والدفعات (العلاجات المكتملة فقط)
  getCompletedTreatmentsByPatient: (patientId: number) => Treatment[];
  getTotalCostByPatientIdCompleted: (patientId: number) => number;
  getPaymentDistributionCompleted: (patientId: number, totalPaid: number) => {
    totalCost: number;
    totalPaid: number;
    remainingAmount: number;
    fullyPaidTreatments: Treatment[];
    partiallyPaidTreatments: Treatment[];
    unpaidTreatments: Treatment[]
  };

  // دوال مع مراعاة تسكير الحساب
  getCompletedTreatmentsByPatientAfterClosure: (patientId: number, closureDate?: string) => Treatment[];
  getTotalCostByPatientIdCompletedAfterClosure: (patientId: number, closureDate?: string) => number;
  getPaymentDistributionCompletedAfterClosure: (patientId: number, totalPaid: number, closureDate?: string) => {
    totalCost: number;
    totalPaid: number;
    remainingAmount: number;
    fullyPaidTreatments: Treatment[];
    partiallyPaidTreatments: Treatment[];
    unpaidTreatments: Treatment[]
  };

  // البحث والتصفية لقوالب العلاجات
  getTreatmentTemplateById: (id: number) => TreatmentTemplate | undefined;
  searchTreatmentTemplates: (query: string) => TreatmentTemplate[];
  getTreatmentTemplatesByCategory: (category: string) => TreatmentTemplate[];
  getActiveTreatmentTemplates: () => TreatmentTemplate[];

  // الإحصائيات
  getTreatmentStats: () => TreatmentStats;
  getPatientTotalCost: (patientId: number) => number;
  getMonthlyRevenue: (year: number, month: number) => number;

  // للتوافق مع الكود القديم
  getTreatmentsByPatientId: (patientId: number) => Treatment[];
  getTotalCostByPatientId: (patientId: number) => number;
  getTotalCost: () => number;

  // النظام الهجين الذكي للدفعات
  getUnpaidTreatmentsByPatient: (patientId: number) => Treatment[];
  getRemainingCostByPatientId: (patientId: number, totalPaid: number) => number;
  distributePayments: (patientId: number, totalPaid: number) => { treatmentId: number; paidAmount: number; remainingAmount: number }[];
  getPaymentDistribution: (patientId: number, totalPaid: number) => {
    totalCost: number;
    totalPaid: number;
    remainingAmount: number;
    fullyPaidTreatments: Treatment[];
    partiallyPaidTreatments: Treatment[];
    unpaidTreatments: Treatment[]
  };

  // النسخ الاحتياطي
  exportTreatments: () => string;
  importTreatments: (data: string) => Promise<{ success: boolean; imported: number; errors: string[] }>;
  clearAllTreatments: () => Promise<boolean>;
}

// وظائف مساعدة للتحقق من صحة البيانات
const validateTreatmentData = (treatment: Partial<Treatment>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!treatment.name || treatment.name.trim().length < 2) {
    errors.push('اسم العلاج يجب أن يكون على الأقل حرفين');
  }

  if (!treatment.patientId || treatment.patientId <= 0) {
    errors.push('معرف المريض مطلوب');
  }

  if (treatment.cost === undefined || treatment.cost === null || treatment.cost < 0) {
    errors.push('تكلفة العلاج يجب أن تكون صفر أو أكبر');
  }

  if (!treatment.startDate) {
    errors.push('تاريخ بداية العلاج مطلوب');
  }

  if (treatment.startDate && new Date(treatment.startDate) < new Date('2020-01-01')) {
    errors.push('تاريخ بداية العلاج غير صحيح');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// التحقق من صحة بيانات الجلسة
const validateSessionData = (session: Partial<TreatmentSession>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!session.treatmentId || session.treatmentId <= 0) {
    errors.push('معرف العلاج مطلوب');
  }

  if (!session.notes || session.notes.trim().length < 2) {
    errors.push('ملاحظات الجلسة مطلوبة');
  }

  if (!session.date) {
    errors.push('تاريخ الجلسة مطلوب');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// إنشاء المتجر المحسن
export const useTreatmentStore = create<TreatmentState>()(
  persist(
    (set, get) => ({
      treatments: [],
      treatmentTemplates: [],
      lastId: 0,
      lastTemplateId: 0,
      lastSessionId: 0,
      version: 2,

      // إضافة علاج جديد مع الجلسة الأولى
      addTreatment: async (treatmentData, firstSessionNotes = '') => {
        try {
          const validation = validateTreatmentData(treatmentData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastId + 1;
          const sessionId = get().lastSessionId + 1;
          const now = new Date().toISOString();

          // الحصول على اسم الطبيب وحفظه مع العلاج
          let doctorName = undefined;
          if (treatmentData.doctorId) {
            const doctor = useDoctorStore.getState().getDoctorById(treatmentData.doctorId);
            doctorName = doctor?.name;
          }

          // إنشاء الجلسة الأولى إذا تم توفير ملاحظات
          const sessions: TreatmentSession[] = [];
          if (firstSessionNotes.trim()) {
            sessions.push({
              id: sessionId,
              treatmentId: newId,
              sessionNumber: 1,
              date: treatmentData.startDate,
              notes: firstSessionNotes.trim(),
              createdAt: now,
              updatedAt: now
            });
          }

          const newTreatment: Treatment = {
            ...treatmentData,
            id: newId,
            doctorName, // حفظ اسم الطبيب وقت إنشاء العلاج
            status: 'in_progress', // العلاج يبدأ فوراً
            isStarted: true, // العلاج بدأ فوراً (التكلفة مضافة لحساب المريض)
            sessions,
            createdAt: now,
            updatedAt: now,
            isActive: true
          };

          set(state => ({
            treatments: [...state.treatments, newTreatment],
            lastId: newId,
            lastSessionId: firstSessionNotes.trim() ? sessionId : state.lastSessionId
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      // تحديث علاج موجود
      updateTreatment: async (id, updatedFields) => {
        try {
          const validation = validateTreatmentData(updatedFields);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const treatment = get().treatments.find(t => t.id === id);
          if (!treatment) {
            throw new Error('العلاج غير موجود');
          }

          set(state => ({
            treatments: state.treatments.map(treatment =>
              treatment.id === id
                ? { ...treatment, ...updatedFields, updatedAt: new Date().toISOString() }
                : treatment
            )
          }));

          return true;
        } catch (error) {
          return false;
        }
      },

      // حذف علاج
      deleteTreatment: async (id) => {
        try {
          set(state => ({
            treatments: state.treatments.filter(treatment => treatment.id !== id)
          }));
          return true;
        } catch (error) {
          return false;
        }
      },

      // إكمال العلاج
      completeTreatment: async (id, finalNotes = '', newCost?: number) => {
        try {
          const treatment = get().getTreatmentById(id);
          if (!treatment) {
            throw new Error('العلاج غير موجود');
          }

          // التحقق من صحة التكلفة الجديدة
          if (newCost !== undefined && (isNaN(newCost) || newCost < 0)) {
            throw new Error('التكلفة الجديدة غير صحيحة');
          }

          const now = new Date().toISOString();

          // تنظيف وتحقق من الملاحظات النهائية
          const cleanedFinalNotes = typeof finalNotes === 'string' ? finalNotes.trim() : '';
          const validFinalNotes = cleanedFinalNotes && cleanedFinalNotes !== '' ? cleanedFinalNotes : undefined;

          set(state => ({
            treatments: state.treatments.map(t =>
              t.id === id
                ? {
                    ...t,
                    status: 'completed' as const,
                    cost: newCost !== undefined ? newCost : t.cost, // تحديث التكلفة إذا تم توفيرها
                    endDate: now,
                    finalNotes: validFinalNotes,
                    updatedAt: now
                  }
                : t
            )
          }));

          // حفظ البيانات في localStorage
          const updatedTreatments = get().treatments;
          localStorage.setItem('treatments', JSON.stringify(updatedTreatments));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // إلغاء العلاج
      cancelTreatment: async (id, saveToRecord, cancelReason = '') => {
        try {
          const treatment = get().getTreatmentById(id);
          if (!treatment) {
            throw new Error('العلاج غير موجود');
          }

          const now = new Date().toISOString();

          if (!saveToRecord && treatment.sessions.length === 0) {
            // حذف نهائي إذا لم تكن هناك جلسات
            set(state => ({
              treatments: state.treatments.filter(t => t.id !== id)
            }));
          } else if (saveToRecord || treatment.sessions.length > 0) {
            // حفظ كعلاج ملغي
            const status = treatment.sessions.length > 0 ? 'cancelled_incomplete' : 'cancelled_no_sessions';

            set(state => ({
              treatments: state.treatments.map(t =>
                t.id === id
                  ? {
                      ...t,
                      status: status as const,
                      endDate: now,
                      cancelReason: cancelReason.trim() || undefined,
                      updatedAt: now
                    }
                  : t
              )
            }));
          }

          return true;
        } catch (error) {
          throw error;
        }
      },

      // تحديث تكلفة العلاج
      updateTreatmentCost: async (id, newCost) => {
        try {
          if (newCost < 0) {
            throw new Error('التكلفة يجب أن تكون صفر أو أكبر');
          }

          const treatment = get().getTreatmentById(id);
          if (!treatment) {
            throw new Error('العلاج غير موجود');
          }

          const now = new Date().toISOString();

          set(state => ({
            treatments: state.treatments.map(t =>
              t.id === id
                ? { ...t, cost: newCost, updatedAt: now }
                : t
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // إضافة جلسة جديدة
      addSession: async (treatmentId, notes, sessionDate) => {
        try {
          const treatment = get().getTreatmentById(treatmentId);
          if (!treatment) {
            throw new Error('العلاج غير موجود');
          }

          if (treatment.status !== 'in_progress') {
            throw new Error('لا يمكن إضافة جلسة لعلاج غير جاري');
          }

          const sessionData = {
            treatmentId,
            notes: notes.trim(),
            date: sessionDate || new Date().toISOString().split('T')[0]
          };

          const validation = validateSessionData(sessionData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const sessionId = get().lastSessionId + 1;
          const now = new Date().toISOString();
          const sessionNumber = treatment.sessions.length + 1;

          const newSession: TreatmentSession = {
            id: sessionId,
            treatmentId,
            sessionNumber,
            date: sessionData.date,
            notes: sessionData.notes,
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            treatments: state.treatments.map(t =>
              t.id === treatmentId
                ? { ...t, sessions: [...t.sessions, newSession], updatedAt: now }
                : t
            ),
            lastSessionId: sessionId
          }));

          return newSession;
        } catch (error) {
          throw error;
        }
      },

      // تحديث جلسة موجودة
      updateSession: async (sessionId, notes) => {
        try {
          if (!notes.trim()) {
            throw new Error('ملاحظات الجلسة مطلوبة');
          }

          const now = new Date().toISOString();
          let sessionFound = false;

          set(state => {
            const updatedTreatments = state.treatments.map(treatment => ({
              ...treatment,
              sessions: (treatment.sessions || []).map(session => {
                if (session.id === sessionId) {
                  sessionFound = true;
                  return { ...session, notes: notes.trim(), updatedAt: now };
                }
                return session;
              }),
              updatedAt: (treatment.sessions || []).some(s => s.id === sessionId) ? now : treatment.updatedAt
            }));

            // حفظ البيانات في localStorage
            localStorage.setItem('treatments', JSON.stringify(updatedTreatments));

            return {
              treatments: updatedTreatments
            };
          });

          if (!sessionFound) {
            throw new Error('الجلسة غير موجودة');
          }

          return true;
        } catch (error) {
          throw error;
        }
      },



      // الحصول على جلسات علاج معين
      getSessionsByTreatment: (treatmentId) => {
        const treatment = get().getTreatmentById(treatmentId);
        return treatment ? treatment.sessions : [];
      },

      // البحث والتصفية
      getTreatmentById: (id) => {
        return get().treatments.find(treatment => treatment.id === id);
      },

      getTreatmentsByPatient: (patientId) => {
        return get().treatments.filter(treatment =>
          treatment.patientId === patientId && treatment.isActive !== false
        );
      },

      getTreatmentsByDoctor: (doctorId) => {
        return get().treatments.filter(treatment =>
          treatment.doctorId === doctorId && treatment.isActive !== false
        );
      },

      filterTreatments: (filters) => {
        let filtered = get().treatments.filter(t => t.isActive !== false);

        if (filters.patientId) {
          filtered = filtered.filter(t => t.patientId === filters.patientId);
        }

        if (filters.status) {
          filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters.doctorId) {
          filtered = filtered.filter(t => t.doctorId === filters.doctorId);
        }

        if (filters.dateRange) {
          filtered = filtered.filter(t =>
            t.startDate >= filters.dateRange!.start && t.startDate <= filters.dateRange!.end
          );
        }

        if (filters.minCost !== undefined) {
          filtered = filtered.filter(t => t.cost >= filters.minCost!);
        }

        if (filters.maxCost !== undefined) {
          filtered = filtered.filter(t => t.cost <= filters.maxCost!);
        }

        return filtered;
      },

      getActiveTreatments: () => {
        return get().treatments.filter(treatment => treatment.isActive !== false);
      },

      // الحصول على العلاجات الجارية فقط (باستثناء العلاجات القديمة بتكلفة 0)
      getInProgressTreatments: () => {
        return get().treatments.filter(treatment =>
          treatment.isActive !== false &&
          treatment.status === 'in_progress' &&
          treatment.cost > 0
        );
      },

      // الحصول على العلاجات المكتملة فقط
      getCompletedTreatments: () => {
        return get().treatments.filter(treatment =>
          treatment.isActive !== false && treatment.status === 'completed'
        );
      },

      // الحصول على العلاجات المكتملة لمريض معين (للسجل السني والدفعات)
      getCompletedTreatmentsByPatient: (patientId: number) => {
        return get().treatments.filter(treatment =>
          treatment.patientId === patientId &&
          treatment.isActive !== false &&
          treatment.status === 'completed'
        );
      },

      // الحصول على إجمالي تكلفة العلاجات المكتملة لمريض معين
      getTotalCostByPatientIdCompleted: (patientId: number) => {
        return get().treatments
          .filter(treatment =>
            treatment.patientId === patientId &&
            treatment.isActive !== false &&
            treatment.status === 'completed'
          )
          .reduce((sum, treatment) => sum + treatment.cost, 0);
      },

      // توزيع الدفعات للعلاجات المكتملة فقط
      getPaymentDistributionCompleted: (patientId: number, totalPaid: number) => {
        const state = get();
        const treatments = state.treatments
          .filter(t =>
            t.patientId === patientId &&
            t.isActive !== false &&
            t.status === 'completed'
          )
          .sort((a, b) => new Date(a.endDate || a.startDate).getTime() - new Date(b.endDate || b.startDate).getTime());

        const totalCost = treatments.reduce((sum, t) => sum + t.cost, 0);
        const remainingAmount = Math.max(0, totalCost - totalPaid);

        // توزيع الدفعات على العلاجات المكتملة
        const distribution: { treatmentId: number; paidAmount: number; remainingAmount: number }[] = [];
        let remainingPayment = totalPaid;

        for (const treatment of treatments) {
          if (remainingPayment <= 0) {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: 0,
              remainingAmount: treatment.cost
            });
          } else if (remainingPayment >= treatment.cost) {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: treatment.cost,
              remainingAmount: 0
            });
            remainingPayment -= treatment.cost;
          } else {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: remainingPayment,
              remainingAmount: treatment.cost - remainingPayment
            });
            remainingPayment = 0;
          }
        }

        const fullyPaidTreatments: Treatment[] = [];
        const partiallyPaidTreatments: Treatment[] = [];
        const unpaidTreatments: Treatment[] = [];

        treatments.forEach(treatment => {
          const dist = distribution.find(d => d.treatmentId === treatment.id);
          if (!dist) return;

          if (dist.remainingAmount === 0) {
            fullyPaidTreatments.push(treatment);
          } else if (dist.paidAmount > 0) {
            partiallyPaidTreatments.push(treatment);
          } else {
            unpaidTreatments.push(treatment);
          }
        });

        return {
          totalCost,
          totalPaid,
          remainingAmount,
          fullyPaidTreatments,
          partiallyPaidTreatments,
          unpaidTreatments
        };
      },

      // دوال مع مراعاة تسكير الحساب
      getCompletedTreatmentsByPatientAfterClosure: (patientId: number, closureDate?: string) => {
        const state = get();
        return state.treatments.filter(t =>
          t.patientId === patientId &&
          t.isActive !== false &&
          t.status === 'completed' &&
          // العلاجات القديمة (بتكلفة 0) تظهر دائماً في السجل السني بغض النظر عن تاريخ التسكير
          (t.cost === 0 || !closureDate || new Date(t.endDate || t.startDate) > new Date(closureDate))
        );
      },

      getTotalCostByPatientIdCompletedAfterClosure: (patientId: number, closureDate?: string) => {
        return get().getCompletedTreatmentsByPatientAfterClosure(patientId, closureDate)
          .reduce((sum, treatment) => sum + treatment.cost, 0);
      },

      getPaymentDistributionCompletedAfterClosure: (patientId: number, totalPaid: number, closureDate?: string) => {
        const state = get();
        const treatments = state.getCompletedTreatmentsByPatientAfterClosure(patientId, closureDate)
          .sort((a, b) => new Date(a.endDate || a.startDate).getTime() - new Date(b.endDate || b.startDate).getTime());

        // توزيع الدفعات على العلاجات المكتملة بعد التسكير
        const distribution: { treatmentId: number; paidAmount: number; remainingAmount: number }[] = [];
        let remainingPayment = totalPaid;

        for (const treatment of treatments) {
          if (remainingPayment <= 0) {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: 0,
              remainingAmount: treatment.cost
            });
          } else if (remainingPayment >= treatment.cost) {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: treatment.cost,
              remainingAmount: 0
            });
            remainingPayment -= treatment.cost;
          } else {
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: remainingPayment,
              remainingAmount: treatment.cost - remainingPayment
            });
            remainingPayment = 0;
          }
        }

        const fullyPaidTreatments: Treatment[] = [];
        const partiallyPaidTreatments: Treatment[] = [];
        const unpaidTreatments: Treatment[] = [];

        treatments.forEach(treatment => {
          const dist = distribution.find(d => d.treatmentId === treatment.id);
          if (!dist) return;

          if (dist.remainingAmount === 0) {
            fullyPaidTreatments.push(treatment);
          } else if (dist.paidAmount > 0) {
            partiallyPaidTreatments.push(treatment);
          } else {
            unpaidTreatments.push(treatment);
          }
        });

        // حساب الإجماليات بناءً على العلاجات غير المدفوعة بالكامل فقط
        const activeTreatments = [...partiallyPaidTreatments, ...unpaidTreatments];
        const activeTotalCost = activeTreatments.reduce((sum, t) => sum + t.cost, 0);
        const activeTotalPaid = partiallyPaidTreatments.reduce((sum, t) => {
          const dist = distribution.find(d => d.treatmentId === t.id);
          return sum + (dist?.paidAmount || 0);
        }, 0);
        const activeRemainingAmount = activeTotalCost - activeTotalPaid;

        return {
          totalCost: activeTotalCost, // فقط العلاجات غير المدفوعة بالكامل
          totalPaid: activeTotalPaid, // فقط الدفعات للعلاجات غير المكتملة الدفع
          remainingAmount: activeRemainingAmount,
          fullyPaidTreatments,
          partiallyPaidTreatments,
          unpaidTreatments
        };
      },

      // الإحصائيات
      getTreatmentStats: () => {
        const activeTreatments = get().treatments.filter(t => t.isActive !== false);
        const totalRevenue = activeTreatments
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.cost, 0);

        return {
          total: activeTreatments.length,
          completed: activeTreatments.filter(t => t.status === 'completed').length,
          inProgress: activeTreatments.filter(t => t.status === 'in_progress').length,
          planned: activeTreatments.filter(t => t.status === 'planned').length,
          cancelled: activeTreatments.filter(t => t.status === 'cancelled').length,
          totalRevenue,
          averageCost: activeTreatments.length > 0 ? totalRevenue / activeTreatments.length : 0
        };
      },

      getPatientTotalCost: (patientId) => {
        return get().treatments
          .filter(t => t.patientId === patientId && t.isActive !== false)
          .reduce((sum, t) => sum + t.cost, 0);
      },

      getMonthlyRevenue: (year, month) => {
        return get().treatments
          .filter(t => {
            if (t.status !== 'completed' || t.isActive === false) return false;
            const treatmentDate = new Date(t.date);
            return treatmentDate.getFullYear() === year && treatmentDate.getMonth() === month - 1;
          })
          .reduce((sum, t) => sum + t.cost, 0);
      },

      // للتوافق مع الكود القديم
      getTreatmentsByPatientId: (patientId) => {
        return get().getTreatmentsByPatient(patientId);
      },

      getTotalCostByPatientId: (patientId) => {
        return get().getPatientTotalCost(patientId);
      },

      getTotalCost: () => {
        return get().treatments
          .filter(t => t.isActive !== false)
          .reduce((total, treatment) => total + treatment.cost, 0);
      },

      // النسخ الاحتياطي
      exportTreatments: () => {
        const data = {
          treatments: get().treatments,
          lastId: get().lastId,
          version: get().version,
          exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
      },

      importTreatments: async (data) => {
        try {
          const parsed = JSON.parse(data);

          if (!parsed.treatments || !Array.isArray(parsed.treatments)) {
            throw new Error('بيانات غير صحيحة');
          }

          let imported = 0;
          const errors: string[] = [];

          for (const treatmentData of parsed.treatments) {
            try {
              const validation = validateTreatmentData(treatmentData);
              if (!validation.isValid) {
                errors.push(`العلاج ${treatmentData.name}: ${validation.errors.join(', ')}`);
                continue;
              }
              imported++;
            } catch (error) {
              errors.push(`خطأ في معالجة العلاج ${treatmentData.name || 'غير معروف'}`);
            }
          }

          if (imported > 0) {
            set({
              treatments: parsed.treatments,
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

      clearAllTreatments: async () => {
        try {
          set({
            treatments: [],
            lastId: 0
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      // === وظائف قوالب العلاجات ===

      // إضافة قالب علاج جديد
      addTreatmentTemplate: async (templateData) => {
        try {
          const state = get();
          const newTemplate: TreatmentTemplate = {
            ...templateData,
            id: state.lastTemplateId + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          set({
            treatmentTemplates: [...state.treatmentTemplates, newTemplate],
            lastTemplateId: newTemplate.id
          });

          return newTemplate;
        } catch (error) {
          throw error;
        }
      },

      // تحديث قالب علاج
      updateTreatmentTemplate: async (id, updates) => {
        try {
          const state = get();
          const templateIndex = state.treatmentTemplates.findIndex(t => t.id === id);

          if (templateIndex === -1) {
            throw new Error('قالب العلاج غير موجود');
          }

          const updatedTemplates = [...state.treatmentTemplates];
          updatedTemplates[templateIndex] = {
            ...updatedTemplates[templateIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };

          set({ treatmentTemplates: updatedTemplates });
          return true;
        } catch (error) {
          return false;
        }
      },

      // حذف قالب علاج
      deleteTreatmentTemplate: async (id) => {
        try {
          const state = get();
          set({
            treatmentTemplates: state.treatmentTemplates.filter(t => t.id !== id)
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      // تهيئة القوالب الافتراضية
      initializeDefaultTemplates: () => {
        const defaultTemplates: Omit<TreatmentTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
          { name: 'تنظيف الأسنان', description: 'تنظيف احترافي للأسنان وإزالة الجير', defaultCost: 200, category: 'وقائي', isActive: true },
          { name: 'حشو ضرس', description: 'حشو تجويف بمادة مركبة', defaultCost: 300, category: 'علاج تحفظي', isActive: true },
          { name: 'حشو عصب', description: 'علاج العصب وإزالة اللب المصاب', defaultCost: 800, category: 'علاج عصب', isActive: true },
          { name: 'قلع ضرس', description: 'إزالة السن التالف', defaultCost: 250, category: 'جراحي', isActive: true },
          { name: 'تركيب تاج', description: 'تغطية السن بتاج خزفي', defaultCost: 1200, category: 'تركيبات', isActive: true },
          { name: 'تبييض أسنان', description: 'تبييض احترافي للأسنان', defaultCost: 600, category: 'تجميلي', isActive: true },
          { name: 'زراعة أسنان', description: 'زراعة جذر سن اصطناعي', defaultCost: 3500, category: 'زراعة', isActive: true },
          { name: 'تقويم أسنان', description: 'تصحيح وضعية الأسنان', defaultCost: 5000, category: 'تقويم', isActive: true },
          { name: 'خلع ضرس العقل', description: 'إزالة ضرس العقل المدفون', defaultCost: 500, category: 'جراحي', isActive: true },
          { name: 'تنظيف عميق', description: 'تنظيف تحت اللثة', defaultCost: 400, category: 'وقائي', isActive: true }
        ];

        const state = get();
        let lastId = state.lastTemplateId;
        const templates = defaultTemplates.map(template => ({
          ...template,
          id: ++lastId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        set({
          treatmentTemplates: templates,
          lastTemplateId: lastId
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Default treatment templates initialized:', templates.length);
        }
      },

      // البحث في قوالب العلاجات
      searchTreatmentTemplates: (query) => {
        const state = get();
        const searchTerm = query.toLowerCase();
        return state.treatmentTemplates.filter(template =>
          template.name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm) ||
          template.category.toLowerCase().includes(searchTerm)
        );
      },

      // الحصول على قوالب العلاجات حسب الفئة
      getTreatmentTemplatesByCategory: (category) => {
        const state = get();
        return state.treatmentTemplates.filter(template =>
          template.category.toLowerCase() === category.toLowerCase()
        );
      },

      // الحصول على قوالب العلاجات النشطة
      getActiveTreatmentTemplates: () => {
        const state = get();
        return state.treatmentTemplates.filter(template => template.isActive);
      },

      // الحصول على قالب علاج بالمعرف
      getTreatmentTemplateById: (id) => {
        const state = get();
        return state.treatmentTemplates.find(template => template.id === id);
      },

      // النظام الهجين الذكي للدفعات
      getUnpaidTreatmentsByPatient: (patientId: number) => {
        const state = get();
        const treatments = state.treatments.filter(t =>
          t.patientId === patientId &&
          t.isActive
        );

        return treatments;
      },

      getRemainingCostByPatientId: (patientId: number, totalPaid: number) => {
        const state = get();
        const totalCost = state.treatments
          .filter(t => t.patientId === patientId && t.isActive)
          .reduce((sum, t) => sum + t.cost, 0);

        return Math.max(0, totalCost - totalPaid);
      },

      distributePayments: (patientId: number, totalPaid: number) => {
        const state = get();
        const treatments = state.treatments
          .filter(t => t.patientId === patientId && t.isActive)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); // ترتيب حسب التاريخ (الأقدم أولاً)

        const distribution: { treatmentId: number; paidAmount: number; remainingAmount: number }[] = [];
        let remainingPayment = totalPaid;

        for (const treatment of treatments) {
          if (remainingPayment <= 0) {
            // لا يوجد مبلغ متبقي للدفع
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: 0,
              remainingAmount: treatment.cost
            });
          } else if (remainingPayment >= treatment.cost) {
            // المبلغ المتبقي كافٍ لتغطية العلاج بالكامل
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: treatment.cost,
              remainingAmount: 0
            });
            remainingPayment -= treatment.cost;
          } else {
            // المبلغ المتبقي يغطي جزءاً من العلاج
            distribution.push({
              treatmentId: treatment.id,
              paidAmount: remainingPayment,
              remainingAmount: treatment.cost - remainingPayment
            });
            remainingPayment = 0;
          }
        }

        return distribution;
      },

      getPaymentDistribution: (patientId: number, totalPaid: number) => {
        const state = get();
        const allTreatments = state.treatments
          .filter(t => t.patientId === patientId && t.isActive)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        const distribution = get().distributePayments(patientId, totalPaid);

        const fullyPaidTreatments: Treatment[] = [];
        const partiallyPaidTreatments: Treatment[] = [];
        const unpaidTreatments: Treatment[] = [];

        allTreatments.forEach(treatment => {
          const dist = distribution.find(d => d.treatmentId === treatment.id);
          if (!dist) return;

          if (dist.remainingAmount === 0) {
            fullyPaidTreatments.push(treatment);
          } else if (dist.paidAmount > 0) {
            partiallyPaidTreatments.push(treatment);
          } else {
            unpaidTreatments.push(treatment);
          }
        });

        // استبعاد العلاجات المدفوعة بالكامل من الحسابات
        const activeTreatments = [...partiallyPaidTreatments, ...unpaidTreatments];
        const activeTotalCost = activeTreatments.reduce((sum, t) => sum + t.cost, 0);
        const fullyPaidCost = fullyPaidTreatments.reduce((sum, t) => sum + t.cost, 0);
        const paidForActiveTreatments = Math.max(0, totalPaid - fullyPaidCost);
        const activeRemainingAmount = Math.max(0, activeTotalCost - paidForActiveTreatments);

        return {
          totalCost: activeTotalCost, // فقط العلاجات غير المدفوعة بالكامل
          totalPaid: paidForActiveTreatments,
          remainingAmount: activeRemainingAmount,
          fullyPaidTreatments,
          partiallyPaidTreatments,
          unpaidTreatments
        };
      }
    }),
    {
      name: 'dental-treatments-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            version: 1,
            treatments: persistedState.treatments?.map((treatment: any) => ({
              ...treatment,
              isActive: treatment.isActive !== false,
              createdAt: treatment.createdAt || new Date().toISOString(),
              updatedAt: treatment.updatedAt || new Date().toISOString()
            })) || []
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات العلاجات من localStorage
      }
    }
  )
);
