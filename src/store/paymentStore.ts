import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

// تعريف نموذج البيانات للدفعة
export interface Payment {
  id: number;
  patientId: number;
  patientName: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  invoiceId?: number; // ربط الدفعة بفاتورة
  paymentMethod: string; // طريقة الدفع (نقداً، تحويل، إلخ)
  recordedBy?: string; // من سجّل الدفعة (حساب الممرضة/الطبيب)
}

// تعريف نموذج الإحصائيات
export interface PaymentStats {
  totalAmount: number;
  totalPayments: number;
  averagePayment: number;
  todayAmount: number;
  monthlyAmount: number;
}

// تعريف حالة المتجر
interface PaymentState {
  payments: Payment[];
  lastId: number;

  // Cache للأداء
  _cache: {
    dailyRevenue: Map<string, number>;
    monthlyRevenue: Map<string, number>;
    dailyPayments: Map<string, Payment[]>;
    monthlyPayments: Map<string, Payment[]>;
    lastCacheUpdate: number;
  };

  // الأفعال
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePayment: (id: number, payment: Partial<Payment>) => void;
  deletePayment: (id: number) => void; // لا يحذف فعلياً (سلامة البيانات) - للإبقاء على التوافق
  getPaymentsByPatientId: (patientId: number) => Payment[];
  getPaymentsByInvoiceId: (invoiceId: number) => Payment[];
  getTotalPaidByInvoiceId: (invoiceId: number) => number;
  getTotalPaidByPatientId: (patientId: number) => number;
  getTotalPaid: () => number;

  // الإحصائيات المحسنة
  getPaymentStats: () => PaymentStats;
  getDailyRevenue: (date: string) => number;
  getMonthlyRevenue: (year: number, month: number) => number;
  getDailyPayments: (date: string) => Payment[];
  getMonthlyPayments: (year: number, month: number) => Payment[];

  // دوال مع مراعاة تسكير الحساب
  getPaymentsByPatientIdAfterClosure: (patientId: number, closureDate?: string) => Payment[];
  getTotalPaidByPatientIdAfterClosure: (patientId: number, closureDate?: string) => number;

  // دوال مساعدة للـ cache
  _clearCache: () => void;
  _isCacheValid: () => boolean;

  // دوال محسنة للعمليات المجمعة
  getBulkDailyPayments: (dates: string[]) => Map<string, Payment[]>;
  getBulkMonthlyRevenue: (periods: Array<{year: number, month: number}>) => Map<string, number>;
}

// إنشاء المتجر مع استخدام middleware للحفظ في localStorage
export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],
      lastId: 0,

      // تهيئة الـ cache
      _cache: {
        dailyRevenue: new Map(),
        monthlyRevenue: new Map(),
        dailyPayments: new Map(),
        monthlyPayments: new Map(),
        lastCacheUpdate: 0
      },

      // دوال مساعدة للـ cache
      _clearCache: () => {
        set(state => ({
          _cache: {
            dailyRevenue: new Map(),
            monthlyRevenue: new Map(),
            dailyPayments: new Map(),
            monthlyPayments: new Map(),
            lastCacheUpdate: Date.now()
          }
        }));
      },

      _isCacheValid: () => {
        const cacheAge = Date.now() - get()._cache.lastCacheUpdate;
        return cacheAge < 30000; // 30 ثانية
      },

      // إضافة دفعة جديدة
      addPayment: (payment) => {
        set(state => {
          const newId = state.lastId + 1;
          const newPayment: Payment = {
            ...payment,
            id: newId,
            paymentDate: payment.paymentDate || format(new Date(), 'yyyy-MM-dd'),
            paymentMethod: payment.paymentMethod ?? 'نقداً'
          };

          return {
            payments: [...state.payments, newPayment],
            lastId: newId
          };
        });

        get()._clearCache();
      },

      // تحديث دفعة موجودة
      updatePayment: (id, updatedFields) => {
        set(state => {
          const updatedPayments = state.payments.map(payment =>
            payment.id === id
              ? { ...payment, ...updatedFields }
              : payment
          );

          return { payments: updatedPayments };
        });

        // مسح الـ cache بعد التحديث
        get()._clearCache();
      },

      // حذف دفعة - غير مسموح (سلامة البيانات): لا تنفيذ فعلي
      deletePayment: (_id) => {
        // لا حذف للدفعات - التعديل فقط مسموح
        return;
      },

      getPaymentsByInvoiceId: (invoiceId) => {
        return get().payments.filter(p => p.invoiceId === invoiceId);
      },

      getTotalPaidByInvoiceId: (invoiceId) => {
        return get()
          .payments.filter(p => p.invoiceId === invoiceId)
          .reduce((sum, p) => sum + p.amount, 0);
      },

      // الحصول على دفعات مريض معين
      getPaymentsByPatientId: (patientId) => {
        return get().payments.filter(payment => payment.patientId === patientId);
      },

      // حساب إجمالي المدفوعات لمريض معين
      getTotalPaidByPatientId: (patientId) => {
        return get().payments
          .filter(payment => payment.patientId === patientId)
          .reduce((total, payment) => total + payment.amount, 0);
      },

      // حساب إجمالي جميع المدفوعات
      getTotalPaid: () => {
        return get().payments.reduce((total, payment) => total + payment.amount, 0);
      },

      // الإحصائيات الجديدة
      getPaymentStats: () => {
        const payments = get().payments;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalPayments = payments.length;
        const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

        const today = format(new Date(), 'yyyy-MM-dd');
        const todayAmount = payments
          .filter(p => p.paymentDate === today)
          .reduce((sum, p) => sum + p.amount, 0);

        const currentDate = new Date();
        const monthlyAmount = payments
          .filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate.getFullYear() === currentDate.getFullYear() &&
                   paymentDate.getMonth() === currentDate.getMonth();
          })
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          totalAmount,
          totalPayments,
          averagePayment,
          todayAmount,
          monthlyAmount
        };
      },

      getDailyRevenue: (date) => {
        const state = get();

        // التأكد من وجود الـ cache وإنشاؤه إذا لم يكن موجوداً
        if (!state._cache || !state._cache.dailyRevenue || !(state._cache.dailyRevenue instanceof Map)) {
          // حساب البيانات مباشرة بدون تحديث الحالة أثناء الرندر
          const result = state.payments
            .filter(p => p.paymentDate === date)
            .reduce((sum, p) => sum + p.amount, 0);

          return result;
        }

        const cache = state._cache.dailyRevenue;

        // التحقق من الـ cache
        if (state._isCacheValid() && cache.has(date)) {
          return cache.get(date)!;
        }

        // حساب البيانات
        const result = state.payments
          .filter(p => p.paymentDate === date)
          .reduce((sum, p) => sum + p.amount, 0);

        // حفظ في الـ cache
        cache.set(date, result);

        return result;
      },

      getMonthlyRevenue: (year, month) => {
        const state = get();

        // التأكد من وجود الـ cache وإنشاؤه إذا لم يكن موجوداً
        if (!state._cache || !state._cache.monthlyRevenue || !(state._cache.monthlyRevenue instanceof Map)) {
          // حساب البيانات مباشرة بدون تحديث الحالة أثناء الرندر
          const result = state.payments
            .filter(p => {
              const paymentDate = new Date(p.paymentDate);
              return paymentDate.getFullYear() === year && paymentDate.getMonth() === month - 1;
            })
            .reduce((sum, p) => sum + p.amount, 0);

          return result;
        }

        const cacheKey = `${year}-${month}`;
        const cache = state._cache.monthlyRevenue;

        // التحقق من الـ cache
        if (state._isCacheValid() && cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }

        // حساب البيانات
        const result = state.payments
          .filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate.getFullYear() === year && paymentDate.getMonth() === month - 1;
          })
          .reduce((sum, p) => sum + p.amount, 0);

        // حفظ في الـ cache
        cache.set(cacheKey, result);

        return result;
      },

      getDailyPayments: (date) => {
        const state = get();

        // التأكد من وجود الـ cache وإنشاؤه إذا لم يكن موجوداً
        if (!state._cache || !state._cache.dailyPayments || !(state._cache.dailyPayments instanceof Map)) {
          // حساب البيانات مباشرة بدون تحديث الحالة أثناء الرندر
          const result = state.payments.filter(p => p.paymentDate === date);
          return result;
        }

        const cache = state._cache.dailyPayments;

        // التحقق من الـ cache
        if (state._isCacheValid() && cache.has(date)) {
          return cache.get(date)!;
        }

        // حساب البيانات
        const result = state.payments.filter(p => p.paymentDate === date);

        // حفظ في الـ cache
        cache.set(date, result);

        return result;
      },

      getMonthlyPayments: (year, month) => {
        const state = get();

        // التأكد من وجود الـ cache وإنشاؤه إذا لم يكن موجوداً
        if (!state._cache || !state._cache.monthlyPayments || !(state._cache.monthlyPayments instanceof Map)) {
          // حساب البيانات مباشرة بدون تحديث الحالة أثناء الرندر
          const result = state.payments.filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate.getFullYear() === year && paymentDate.getMonth() === month - 1;
          });

          return result;
        }

        const cacheKey = `${year}-${month}`;
        const cache = state._cache.monthlyPayments;

        // التحقق من الـ cache
        if (state._isCacheValid() && cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }

        // حساب البيانات
        const result = state.payments.filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate.getFullYear() === year && paymentDate.getMonth() === month - 1;
        });

        // حفظ في الـ cache
        cache.set(cacheKey, result);

        return result;
      },

      // دوال مع مراعاة تسكير الحساب
      getPaymentsByPatientIdAfterClosure: (patientId, closureDate) => {
        return get().payments.filter(payment =>
          payment.patientId === patientId &&
          (!closureDate || new Date(payment.paymentDate) > new Date(closureDate))
        );
      },

      getTotalPaidByPatientIdAfterClosure: (patientId, closureDate) => {
        return get().getPaymentsByPatientIdAfterClosure(patientId, closureDate)
          .reduce((total, payment) => total + payment.amount, 0);
      },

      // دوال محسنة للعمليات المجمعة
      getBulkDailyPayments: (dates) => {
        const state = get();
        const result = new Map<string, Payment[]>();

        dates.forEach(date => {
          const payments = state.getDailyPayments(date);
          result.set(date, payments);
        });

        return result;
      },

      getBulkMonthlyRevenue: (periods) => {
        const state = get();
        const result = new Map<string, number>();

        periods.forEach(({year, month}) => {
          const key = `${year}-${month}`;
          const revenue = state.getMonthlyRevenue(year, month);
          result.set(key, revenue);
        });

        return result;
      },

    }),
    {
      name: 'dental-payments-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (persistedState?.payments && version < 2) {
          return {
            ...persistedState,
            payments: persistedState.payments.map((p: any) => ({
              ...p,
              paymentMethod: p.paymentMethod ?? 'نقداً',
              invoiceId: p.invoiceId,
              recordedBy: p.recordedBy
            }))
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات المدفوعات من localStorage
      }
    }
  )
);