import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// تعريف نموذج المصروف المحدث
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD format
  isPaid: boolean;
  createdAt: string;
}

// تعريف نموذج فئة المصروف
export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

// فئات المصاريف الافتراضية
export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'أدوات طبية', createdAt: new Date().toISOString() },
  { id: '2', name: 'مواد استهلاكية', createdAt: new Date().toISOString() },
  { id: '3', name: 'أجهزة ومعدات', createdAt: new Date().toISOString() },
  { id: '4', name: 'صيانة وإصلاح', createdAt: new Date().toISOString() },
  { id: '5', name: 'إيجار', createdAt: new Date().toISOString() },
  { id: '6', name: 'كهرباء وماء', createdAt: new Date().toISOString() },
  { id: '7', name: 'رواتب', createdAt: new Date().toISOString() },
  { id: '8', name: 'تأمين', createdAt: new Date().toISOString() },
  { id: '9', name: 'تسويق وإعلان', createdAt: new Date().toISOString() },
  { id: '10', name: 'مصاريف إدارية', createdAt: new Date().toISOString() },
  { id: '11', name: 'أخرى', createdAt: new Date().toISOString() }
];

// تعريف نموذج الإحصائيات المحدث
export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  averageExpense: number;
  expensesByCategory: Record<string, number>;
  monthlyExpenses: number;
  dailyExpenses: number;
}

// تعريف واجهة المتجر المحدثة
interface ExpenseState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  lastExpenseId: number;
  lastCategoryId: number;
  version: number;

  // Cache للأداء
  _cache: {
    dailyExpenses: Map<string, Expense[]>;
    monthlyExpenses: Map<string, Expense[]>;
    categorySummary: Map<string, Record<string, number>>;
    lastCacheUpdate: number;
  };

  // إدارة المصاريف
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<string>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  getExpenseById: (id: string) => Expense | undefined;
  getExpensesByCategory: (category: string) => Expense[];
  togglePaymentStatus: (id: string) => Promise<boolean>;
  getUnpaidExpenses: () => Expense[];

  // إدارة الفئات
  addCategory: (name: string) => Promise<string>;
  updateCategory: (id: string, name: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  getCategoryById: (id: string) => ExpenseCategory | undefined;
  canDeleteCategory: (id: string) => boolean;

  // الإحصائيات المحسنة
  getExpenseStats: () => ExpenseStats;
  getMonthlyExpenses: (year: number, month: number) => number;
  getMonthlyExpensesList: (year: number, month: number) => Expense[];
  getDailyExpenses: (date: string) => number;
  getDailyExpensesList: (date: string) => Expense[];
  getExpensesCategorySummary: () => Record<string, number>;
  getMonthlyCategorySummary: (year: number, month: number) => Record<string, number>;

  // دوال مساعدة للـ cache
  _clearCache: () => void;
  _isCacheValid: () => boolean;

  // دوال محسنة للعمليات المجمعة
  getBulkMonthlyExpenses: (periods: Array<{year: number, month: number}>) => Map<string, Expense[]>;
  getBulkMonthlyExpensesTotals: (periods: Array<{year: number, month: number}>) => Map<string, number>;

  // دوال محسنة لتجميع الفئات
  getExpensesByCategory: (categoryName: string) => Expense[];
  getCategoryTotals: () => Record<string, number>;
  getCategoryStats: (categoryName: string) => {
    total: number;
    count: number;
    average: number;
    paid: number;
    unpaid: number;
  };

  // النسخ الاحتياطي
  exportExpenses: () => string;
  importExpenses: (data: string) => Promise<{ success: boolean; imported: number; errors: string[] }>;
  clearAllExpenses: () => Promise<boolean>;
}

// وظائف مساعدة للتحقق من صحة البيانات
const validateExpenseData = (expense: Partial<Expense>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!expense.category || expense.category.trim().length < 1) {
    errors.push('فئة المصروف مطلوبة');
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('مبلغ المصروف يجب أن يكون أكبر من صفر');
  }

  if (!expense.date || expense.date.trim().length === 0) {
    errors.push('تاريخ المصروف مطلوب');
  }

  if (expense.isPaid === undefined || expense.isPaid === null) {
    errors.push('حالة الدفع مطلوبة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// إنشاء المتجر
export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: DEFAULT_EXPENSE_CATEGORIES,
      lastExpenseId: 0,
      lastCategoryId: 11,
      version: 2,

      // تهيئة الـ cache
      _cache: {
        dailyExpenses: new Map(),
        monthlyExpenses: new Map(),
        categorySummary: new Map(),
        lastCacheUpdate: 0
      },

      // دوال مساعدة للـ cache
      _clearCache: () => {
        set(state => ({
          _cache: {
            dailyExpenses: new Map(),
            monthlyExpenses: new Map(),
            categorySummary: new Map(),
            lastCacheUpdate: Date.now()
          }
        }));
      },

      _isCacheValid: () => {
        const cacheAge = Date.now() - get()._cache.lastCacheUpdate;
        return cacheAge < 30000; // 30 ثانية
      },

      // إضافة مصروف جديد
      addExpense: async (expenseData) => {
        try {
          const validation = validateExpenseData(expenseData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = `exp_${get().lastExpenseId + 1}_${Date.now()}`;
          const now = new Date().toISOString();

          const newExpense: Expense = {
            ...expenseData,
            id: newId,
            isPaid: expenseData.isPaid !== undefined ? expenseData.isPaid : true,
            createdAt: now
          };

          set(state => ({
            expenses: [...state.expenses, newExpense],
            lastExpenseId: state.lastExpenseId + 1
          }));

          // مسح الـ cache بعد إضافة مصروف جديد
          get()._clearCache();

          // إجبار تحديث المكونات التي تستخدم المصاريف غير المدفوعة
          if (!newExpense.isPaid) {
            // تحديث فوري للمصاريف غير المدفوعة
            setTimeout(() => {
              // إشارة للمكونات للتحديث
              window.dispatchEvent(new CustomEvent('expenseUpdated', {
                detail: { type: 'added', expense: newExpense }
              }));
            }, 0);
          }

          return newId;
        } catch (error) {
          throw error;
        }
      },

      // تحديث مصروف موجود
      updateExpense: async (id, updatedFields) => {
        try {
          const expense = get().getExpenseById(id);
          if (!expense) {
            throw new Error('المصروف غير موجود');
          }

          const updatedExpense = { ...expense, ...updatedFields };
          const validation = validateExpenseData(updatedExpense);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          set(state => ({
            expenses: state.expenses.map(e =>
              e.id === id ? updatedExpense : e
            )
          }));

          // مسح الـ cache بعد التحديث
          get()._clearCache();

          // إجبار تحديث المكونات
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('expenseUpdated', {
              detail: { type: 'updated', expense: updatedExpense }
            }));
          }, 0);

          return true;
        } catch (error) {
          console.error('خطأ في تحديث المصروف:', error);
          return false;
        }
      },

      // حذف مصروف
      deleteExpense: async (id) => {
        try {
          set(state => ({
            expenses: state.expenses.filter(e => e.id !== id)
          }));

          // مسح الـ cache بعد الحذف
          get()._clearCache();

          // إجبار تحديث المكونات
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('expenseUpdated', {
              detail: { type: 'deleted', expenseId: id }
            }));
          }, 0);

          return true;
        } catch (error) {
          console.error('خطأ في حذف المصروف:', error);
          return false;
        }
      },

      // الحصول على مصروف بالمعرف
      getExpenseById: (id) => {
        return get().expenses.find(e => e.id === id);
      },

      // الحصول على المصاريف حسب الفئة
      getExpensesByCategory: (category) => {
        return get().expenses.filter(e => e.category === category);
      },

      // تبديل حالة الدفع
      togglePaymentStatus: async (id) => {
        try {
          const expense = get().getExpenseById(id);
          if (!expense) {
            throw new Error('المصروف غير موجود');
          }

          set(state => ({
            expenses: state.expenses.map(e =>
              e.id === id ? { ...e, isPaid: !e.isPaid } : e
            )
          }));

          // مسح الـ cache بعد تغيير حالة الدفع
          get()._clearCache();

          // إجبار تحديث المكونات
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('expenseUpdated', {
              detail: { type: 'paymentToggled', expense }
            }));
          }, 0);

          return true;
        } catch (error) {
          console.error('خطأ في تبديل حالة الدفع:', error);
          return false;
        }
      },

      // الحصول على المصاريف غير المدفوعة
      getUnpaidExpenses: () => {
        return get().expenses.filter(e => !e.isPaid);
      },

      // إضافة فئة جديدة
      addCategory: async (name) => {
        try {
          if (!name || name.trim().length < 1) {
            throw new Error('اسم الفئة مطلوب');
          }

          const trimmedName = name.trim();
          const existingCategory = get().categories.find(c => c.name === trimmedName);
          if (existingCategory) {
            throw new Error('هذه الفئة موجودة بالفعل');
          }

          const newId = `cat_${get().lastCategoryId + 1}_${Date.now()}`;
          const now = new Date().toISOString();

          const newCategory: ExpenseCategory = {
            id: newId,
            name: trimmedName,
            createdAt: now
          };

          set(state => ({
            categories: [...state.categories, newCategory],
            lastCategoryId: state.lastCategoryId + 1
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      // تحديث فئة موجودة
      updateCategory: async (id, name) => {
        try {
          if (!name || name.trim().length < 1) {
            throw new Error('اسم الفئة مطلوب');
          }

          const trimmedName = name.trim();
          const existingCategory = get().categories.find(c => c.name === trimmedName && c.id !== id);
          if (existingCategory) {
            throw new Error('هذه الفئة موجودة بالفعل');
          }

          set(state => ({
            categories: state.categories.map(c => 
              c.id === id ? { ...c, name: trimmedName } : c
            )
          }));

          return true;
        } catch (error) {
          console.error('خطأ في تحديث الفئة:', error);
          return false;
        }
      },

      // حذف فئة
      deleteCategory: async (id) => {
        try {
          if (!get().canDeleteCategory(id)) {
            throw new Error('لا يمكن حذف هذه الفئة لأنها تحتوي على مصاريف');
          }

          set(state => ({
            categories: state.categories.filter(c => c.id !== id)
          }));

          return true;
        } catch (error) {
          console.error('خطأ في حذف الفئة:', error);
          return false;
        }
      },

      // الحصول على فئة بالمعرف
      getCategoryById: (id) => {
        return get().categories.find(c => c.id === id);
      },

      // التحقق من إمكانية حذف الفئة
      canDeleteCategory: (id) => {
        const category = get().getCategoryById(id);
        if (!category) return false;
        
        const expensesInCategory = get().getExpensesByCategory(category.name);
        return expensesInCategory.length === 0;
      },

      // باقي الوظائف...
      getExpenseStats: () => {
        const expenses = get().expenses;
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const dailyExpenses = get().getDailyExpenses(today);
        const monthlyExpenses = get().getMonthlyExpenses(currentYear, currentMonth);
        
        const expensesByCategory = get().getExpensesCategorySummary();

        return {
          totalExpenses: expenses.length,
          totalAmount,
          averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
          expensesByCategory,
          monthlyExpenses,
          dailyExpenses
        };
      },

      getMonthlyExpenses: (year, month) => {
        const monthlyExpenses = get().getMonthlyExpensesList(year, month);
        return monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      },

      getMonthlyExpensesList: (year, month) => {
        const state = get();

        // حساب البيانات مباشرة دون اعتماد على cache للتأكد من التحديث
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        // حساب آخر يوم في الشهر بشكل صحيح
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const result = state.expenses.filter(e => e.date >= startDate && e.date <= endDate);

        return result;
      },

      getDailyExpenses: (date) => {
        const dailyExpenses = get().getDailyExpensesList(date);
        return dailyExpenses.reduce((sum, e) => sum + e.amount, 0);
      },

      getDailyExpensesList: (date) => {
        const state = get();

        // حساب البيانات مباشرة دون اعتماد على cache للتأكد من التحديث
        const result = state.expenses.filter(e => e.date === date);
        return result;
      },

      getExpensesCategorySummary: () => {
        return get().expenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);
      },

      getMonthlyCategorySummary: (year, month) => {
        const state = get();

        // التأكد من وجود الـ cache وإنشاؤه إذا لم يكن موجوداً
        if (!state._cache || !state._cache.categorySummary || !(state._cache.categorySummary instanceof Map)) {
          // حساب البيانات مباشرة بدون تحديث الحالة أثناء الرندر
          const monthlyExpenses = state.getMonthlyExpensesList(year, month);
          const result = monthlyExpenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
          }, {} as Record<string, number>);

          return result;
        }

        const cacheKey = `monthly-${year}-${month}`;
        const cache = state._cache.categorySummary;

        // التحقق من الـ cache
        if (state._isCacheValid() && cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }

        // حساب البيانات
        const monthlyExpenses = state.getMonthlyExpensesList(year, month);
        const result = monthlyExpenses.reduce((acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);

        // حفظ في الـ cache
        cache.set(cacheKey, result);

        return result;
      },

      exportExpenses: () => {
        const data = {
          expenses: get().expenses,
          categories: get().categories,
          exportDate: new Date().toISOString(),
          version: get().version
        };
        return JSON.stringify(data, null, 2);
      },

      importExpenses: async (data) => {
        try {
          const parsed = JSON.parse(data);
          const imported = parsed.expenses?.length || 0;
          
          set({
            expenses: parsed.expenses || [],
            categories: parsed.categories || DEFAULT_EXPENSE_CATEGORIES
          });

          return { success: true, imported, errors: [] };
        } catch (error) {
          return { success: false, imported: 0, errors: ['خطأ في تحليل البيانات'] };
        }
      },

      clearAllExpenses: async () => {
        try {
          set({
            expenses: [],
            lastExpenseId: 0
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      // دوال محسنة للعمليات المجمعة
      getBulkMonthlyExpenses: (periods) => {
        const state = get();
        const result = new Map<string, Expense[]>();

        periods.forEach(({year, month}) => {
          const key = `${year}-${month}`;
          const expenses = state.getMonthlyExpensesList(year, month);
          result.set(key, expenses);
        });

        return result;
      },

      getBulkMonthlyExpensesTotals: (periods) => {
        const state = get();
        const result = new Map<string, number>();

        periods.forEach(({year, month}) => {
          const key = `${year}-${month}`;
          const total = state.getMonthlyExpenses(year, month);
          result.set(key, total);
        });

        return result;
      },

      // دوال محسنة لتجميع الفئات
      getExpensesByCategory: (categoryName) => {
        return get().expenses.filter(expense => expense.category === categoryName);
      },

      getCategoryTotals: () => {
        const expenses = get().expenses;
        const totals: Record<string, number> = {};

        expenses.forEach(expense => {
          if (!totals[expense.category]) {
            totals[expense.category] = 0;
          }
          totals[expense.category] += expense.amount;
        });

        return totals;
      },

      getCategoryStats: (categoryName) => {
        const categoryExpenses = get().getExpensesByCategory(categoryName);
        const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = categoryExpenses.length;
        const average = count > 0 ? total / count : 0;

        const paidExpenses = categoryExpenses.filter(exp => exp.isPaid);
        const unpaidExpenses = categoryExpenses.filter(exp => !exp.isPaid);

        const paid = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const unpaid = unpaidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
          total,
          count,
          average,
          paid,
          unpaid
        };
      }
    }),
    {
      name: 'dental-expenses-storage-v2',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            categories: DEFAULT_EXPENSE_CATEGORIES,
            lastCategoryId: 11,
            version: 2
          };
        }
        return persistedState;
      }
    }
  )
);
