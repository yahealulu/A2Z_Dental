import { useMemo, useRef, useCallback, useState, useEffect, useReducer } from 'react';
import { format } from 'date-fns';
import { useExpenseStore, type Expense } from '../store/expenseStore';
import { ExpenseFilterEngine, type AdvancedExpenseFilters } from '../utils/expenseFiltering';
import { memoryManager, MEMORY_LIMITS, type CleanupConfig } from '../utils/memoryManager';
import { safeExecute, ErrorType, errorManager } from '../utils/errorHandling';

// نوع البيانات لإحصائيات الفئة المحسنة
export interface OptimizedCategoryStats {
  categoryName: string;
  totalAmount: number;
  expenseCount: number;
  averageAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidCount: number;
  unpaidCount: number;
}

// نوع البيانات لتجميع الفئات المحسن
export interface CategoryAggregation {
  [categoryName: string]: OptimizedCategoryStats;
}

// نوع البيانات للملخص الشهري المحسن
export interface OptimizedMonthlySummary {
  year: number;
  month: number;
  totalAmount: number;
  totalExpenses: number;
  averageExpense: number;
  paidAmount: number;
  unpaidAmount: number;
  paidCount: number;
  unpaidCount: number;
  categoryBreakdown: CategoryAggregation;
  dailyBreakdown: Record<string, number>;
  isLoading: boolean;
}

// نوع البيانات للصفحات المحسنة
export interface PaginatedExpenses {
  expenses: Expense[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// نوع البيانات لحالة التحميل
export interface ExpenseLoadingState {
  isLoadingCategories: boolean;
  isLoadingMonthly: boolean;
  isLoadingPagination: boolean;
  loadingProgress: number;
  error: string | null;
}

// Cache محسن للمصروفات مع فهرسة الفئات
interface ExpenseCache {
  categoryAggregation: Map<string, CategoryAggregation>;
  categoryIndex: Map<string, Expense[]>;
  monthlyStats: Map<string, OptimizedMonthlySummary>;
  dailyExpenses: Map<string, Expense[]>;
  unpaidExpenses: Expense[];
  // Cache للملخصات الشهرية المحسنة
  monthlyBreakdown: Map<string, Record<string, number>>;
  preloadedMonths: Set<string>;
  // Cache للصفحات المحسنة
  paginatedExpenses: Map<string, PaginatedExpenses>;
  preloadedPages: Map<string, Set<number>>;
  // Cache للتصفية المتقدمة
  filteredExpenses: Map<string, Expense[]>;
  filterEngine: ExpenseFilterEngine | null;
  lastUpdate: number;
}

// مدة صلاحية الـ cache (3 دقائق)
const CACHE_DURATION = 3 * 60 * 1000;

export const useExpenseOptimization = () => {
  // إجبار إعادة الرندر عند تغيير البيانات
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const {
    expenses,
    categories,
    getDailyExpensesList,
    getMonthlyExpensesList,
    getMonthlyCategorySummary,
    getUnpaidExpenses
  } = useExpenseStore();

  // حالة التحميل
  const [loadingState, setLoadingState] = useState<ExpenseLoadingState>({
    isLoadingCategories: false,
    isLoadingMonthly: false,
    isLoadingPagination: false,
    loadingProgress: 0,
    error: null
  });

  // إجبار التحديث عند تغيير المصاريف
  useEffect(() => {
    forceUpdate();
  }, [expenses.length]);

  // الاستماع لأحداث تحديث المصاريف الفورية
  useEffect(() => {
    const handleExpenseUpdate = (event: CustomEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Expense updated, forcing reload:', event.detail);
      }
      // مسح cache وإجبار التحديث
      cacheRef.current = {
        categoryAggregation: new Map(),
        categoryIndex: new Map(),
        monthlyStats: new Map(),
        dailyExpenses: new Map(),
        unpaidExpenses: [],
        monthlyBreakdown: new Map(),
        preloadedMonths: new Set(),
        paginatedExpenses: new Map(),
        preloadedPages: new Map(),
        filteredExpenses: new Map(),
        filterEngine: null,
        lastUpdate: 0
      };
      forceUpdate();
    };

    window.addEventListener('expenseUpdated', handleExpenseUpdate as EventListener);

    return () => {
      window.removeEventListener('expenseUpdated', handleExpenseUpdate as EventListener);
    };
  }, [forceUpdate]);

  // Cache محلي للبيانات المحسنة
  const cacheRef = useRef<ExpenseCache>({
    categoryAggregation: new Map(),
    categoryIndex: new Map(),
    monthlyStats: new Map(),
    dailyExpenses: new Map(),
    unpaidExpenses: [],
    monthlyBreakdown: new Map(),
    preloadedMonths: new Set(),
    paginatedExpenses: new Map(),
    preloadedPages: new Map(),
    filteredExpenses: new Map(),
    filterEngine: null,
    lastUpdate: 0
  });

  // التحقق من صلاحية الـ cache
  const isCacheValid = useCallback(() => {
    return Date.now() - cacheRef.current.lastUpdate < CACHE_DURATION;
  }, []);

  // إضافة عنصر إلى الـ cache مع إدارة الذاكرة
  const addToCache = useCallback(<T>(
    cacheMap: Map<string, T>,
    cacheType: string,
    key: string,
    value: T
  ) => {
    const fullKey = `${cacheType}-${key}`;

    // تسجيل استخدام الذاكرة
    memoryManager.recordMemoryUsage(fullKey, value);

    // إضافة إلى الـ cache
    cacheMap.set(key, value);

    // تنظيف تلقائي إذا تجاوز الحد
    const maxItems = MEMORY_LIMITS.MAX_CACHE_ITEMS[cacheType as keyof typeof MEMORY_LIMITS.MAX_CACHE_ITEMS] || 50;
    if (cacheMap.size > maxItems) {
      const cleanupConfig: CleanupConfig = {
        maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.medium * 60 * 1000,
        maxItems,
        priority: 'lru'
      };
      memoryManager.cleanupCache(cacheMap, cacheType, cleanupConfig);
    }
  }, []);

  // الحصول من الـ cache مع تحديث وقت الوصول
  const getFromCache = useCallback(<T>(
    cacheMap: Map<string, T>,
    cacheType: string,
    key: string
  ): T | undefined => {
    const value = cacheMap.get(key);
    if (value) {
      const fullKey = `${cacheType}-${key}`;
      memoryManager.updateAccessTime(fullKey);
    }
    return value;
  }, []);

  // مسح الـ cache مع إدارة الذاكرة
  const clearCache = useCallback(() => {
    // إزالة تسجيلات الذاكرة للعناصر الحالية
    cacheRef.current.categoryAggregation.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`categoryAggregation-${key}`);
    });
    cacheRef.current.monthlyStats.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`monthlyStats-${key}`);
    });
    cacheRef.current.paginatedExpenses.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`paginatedExpenses-${key}`);
    });
    cacheRef.current.filteredExpenses.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`filteredExpenses-${key}`);
    });

    cacheRef.current = {
      categoryAggregation: new Map(),
      categoryIndex: new Map(),
      monthlyStats: new Map(),
      dailyExpenses: new Map(),
      unpaidExpenses: [],
      monthlyBreakdown: new Map(),
      preloadedMonths: new Set(),
      paginatedExpenses: new Map(),
      preloadedPages: new Map(),
      filteredExpenses: new Map(),
      filterEngine: null,
      lastUpdate: Date.now()
    };
    setLoadingState({
      isLoadingCategories: false,
      isLoadingMonthly: false,
      isLoadingPagination: false,
      loadingProgress: 0,
      error: null
    });
  }, []);

  // بناء فهرس الفئات
  const buildCategoryIndex = useCallback(() => {
    const categoryIndex = new Map<string, Expense[]>();
    
    expenses.forEach(expense => {
      if (!categoryIndex.has(expense.category)) {
        categoryIndex.set(expense.category, []);
      }
      categoryIndex.get(expense.category)!.push(expense);
    });

    cacheRef.current.categoryIndex = categoryIndex;
    cacheRef.current.lastUpdate = Date.now();
  }, [expenses]);

  // حساب إحصائيات الفئة المحسنة
  const calculateCategoryStats = useCallback((categoryExpenses: Expense[]): OptimizedCategoryStats => {
    const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = categoryExpenses.length;
    const averageAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;
    
    const paidExpenses = categoryExpenses.filter(exp => exp.isPaid);
    const unpaidExpenses = categoryExpenses.filter(exp => !exp.isPaid);
    
    const paidAmount = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const unpaidAmount = unpaidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
      categoryName: categoryExpenses[0]?.category || '',
      totalAmount,
      expenseCount,
      averageAmount,
      paidAmount,
      unpaidAmount,
      paidCount: paidExpenses.length,
      unpaidCount: unpaidExpenses.length
    };
  }, []);

  // الحصول على تجميع الفئات المحسن مع إدارة الذاكرة
  const getOptimizedCategoryAggregation = useCallback((
    year?: number,
    month?: number
  ): CategoryAggregation => {
    const result: CategoryAggregation = {};

    // تصفية المصروفات حسب الشهر إذا تم تحديده
    let filteredExpenses = expenses;
    if (year && month) {
      filteredExpenses = getMonthlyExpensesList(year, month);
    }

    // تجميع المصروفات حسب الفئة
    const categoryGroups = new Map<string, Expense[]>();
    filteredExpenses.forEach(expense => {
      if (!categoryGroups.has(expense.category)) {
        categoryGroups.set(expense.category, []);
      }
      categoryGroups.get(expense.category)!.push(expense);
    });

    // حساب إحصائيات كل فئة
    categoryGroups.forEach((categoryExpenses, categoryName) => {
      result[categoryName] = calculateCategoryStats(categoryExpenses);
    });

    return result;
  }, [expenses, getMonthlyExpensesList, calculateCategoryStats]);

  // الحصول على مصروفات فئة معينة
  const getExpensesByCategory = useCallback((categoryName: string): Expense[] => {
    // بناء الفهرس إذا لم يكن موجوداً
    if (!isCacheValid() || cacheRef.current.categoryIndex.size === 0) {
      buildCategoryIndex();
    }

    return cacheRef.current.categoryIndex.get(categoryName) || [];
  }, [buildCategoryIndex, isCacheValid]);

  // الحصول على أهم الفئات (الأكثر إنفاقاً)
  const getTopCategories = useCallback((limit: number = 5): OptimizedCategoryStats[] => {
    const aggregation = getOptimizedCategoryAggregation();
    
    return Object.values(aggregation)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }, [getOptimizedCategoryAggregation]);

  // الحصول على إحصائيات سريعة للفئات
  const getCategoryQuickStats = useCallback(() => {
    const aggregation = getOptimizedCategoryAggregation();
    const stats = Object.values(aggregation);
    
    const totalCategories = stats.length;
    const totalAmount = stats.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const totalExpenses = stats.reduce((sum, cat) => sum + cat.expenseCount, 0);
    const averagePerCategory = totalCategories > 0 ? totalAmount / totalCategories : 0;
    
    const mostExpensiveCategory = stats.reduce((max, cat) => 
      cat.totalAmount > max.totalAmount ? cat : max, 
      stats[0] || { categoryName: '', totalAmount: 0 } as OptimizedCategoryStats
    );

    return {
      totalCategories,
      totalAmount,
      totalExpenses,
      averagePerCategory,
      mostExpensiveCategory: mostExpensiveCategory.categoryName,
      mostExpensiveAmount: mostExpensiveCategory.totalAmount
    };
  }, [getOptimizedCategoryAggregation]);

  // التحميل التدريجي للملخص الشهري
  const loadMonthlySummaryProgressively = useCallback(async (year: number, month: number): Promise<OptimizedMonthlySummary> => {
    const cacheKey = `${year}-${month}`;
    const cache = cacheRef.current.monthlyStats;

    // التحقق من الـ cache أولاً
    if (isCacheValid() && cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // بدء التحميل
    setLoadingState(prev => ({ ...prev, isLoadingMonthly: true, loadingProgress: 0, error: null }));

    try {
      // المرحلة 1: تحميل المصروفات الشهرية (25%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 25 }));
      const monthlyExpenses = getMonthlyExpensesList(year, month);

      if (monthlyExpenses.length === 0) {
        const emptyResult: OptimizedMonthlySummary = {
          year,
          month,
          totalAmount: 0,
          totalExpenses: 0,
          averageExpense: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          paidCount: 0,
          unpaidCount: 0,
          categoryBreakdown: {},
          dailyBreakdown: {},
          isLoading: false
        };
        cache.set(cacheKey, emptyResult);
        cacheRef.current.preloadedMonths.add(cacheKey);
        setLoadingState(prev => ({ ...prev, isLoadingMonthly: false, loadingProgress: 100 }));
        return emptyResult;
      }

      // المرحلة 2: حساب الإحصائيات الأساسية (50%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 50 }));
      const totalAmount = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalExpenses = monthlyExpenses.length;
      const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

      const paidExpenses = monthlyExpenses.filter(exp => exp.isPaid);
      const unpaidExpenses = monthlyExpenses.filter(exp => !exp.isPaid);

      const paidAmount = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const unpaidAmount = unpaidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      // المرحلة 3: تجميع الفئات (75%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 75 }));
      const categoryBreakdown = getOptimizedCategoryAggregation(year, month);

      // المرحلة 4: تجميع يومي (90%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 90 }));
      const dailyBreakdown: Record<string, number> = {};
      monthlyExpenses.forEach(expense => {
        const dayKey = expense.date;
        if (!dailyBreakdown[dayKey]) {
          dailyBreakdown[dayKey] = 0;
        }
        dailyBreakdown[dayKey] += expense.amount;
      });

      const result: OptimizedMonthlySummary = {
        year,
        month,
        totalAmount,
        totalExpenses,
        averageExpense,
        paidAmount,
        unpaidAmount,
        paidCount: paidExpenses.length,
        unpaidCount: unpaidExpenses.length,
        categoryBreakdown,
        dailyBreakdown,
        isLoading: false
      };

      // حفظ في الـ cache
      cache.set(cacheKey, result);
      cacheRef.current.preloadedMonths.add(cacheKey);

      setLoadingState(prev => ({ ...prev, isLoadingMonthly: false, loadingProgress: 100 }));
      return result;

    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoadingMonthly: false,
        error: 'خطأ في تحميل الملخص الشهري'
      }));
      throw error;
    }
  }, [getMonthlyExpensesList, getOptimizedCategoryAggregation, isCacheValid]);

  // الحصول على الملخص الشهري المحسن (متزامن للاستخدام الفوري)
  const getOptimizedMonthlySummary = useCallback((year: number, month: number): OptimizedMonthlySummary => {
    // حساب البيانات مباشرة دون اعتماد على cache للتأكد من التحديث الفوري
    const monthlyExpenses = getMonthlyExpensesList(year, month);

    if (monthlyExpenses.length === 0) {
      return {
        year,
        month,
        totalAmount: 0,
        totalExpenses: 0,
        averageExpense: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
        categoryBreakdown: {},
        dailyBreakdown: {},
        isLoading: false
      };
    }

    // حساب الإحصائيات
    const totalAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalExpenses = monthlyExpenses.length;
    const averageExpense = totalAmount / totalExpenses;

    const paidExpenses = monthlyExpenses.filter(expense => expense.isPaid);
    const unpaidExpenses = monthlyExpenses.filter(expense => !expense.isPaid);
    const paidAmount = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const unpaidAmount = unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // تجميع حسب الفئة
    const categoryBreakdown: CategoryAggregation = {};
    monthlyExpenses.forEach(expense => {
      if (!categoryBreakdown[expense.category]) {
        categoryBreakdown[expense.category] = {
          categoryName: expense.category,
          totalAmount: 0,
          expenseCount: 0,
          averageAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          paidCount: 0,
          unpaidCount: 0
        };
      }
      const cat = categoryBreakdown[expense.category];
      cat.totalAmount += expense.amount;
      cat.expenseCount += 1;
      if (expense.isPaid) {
        cat.paidAmount += expense.amount;
        cat.paidCount += 1;
      } else {
        cat.unpaidAmount += expense.amount;
        cat.unpaidCount += 1;
      }
    });
    Object.keys(categoryBreakdown).forEach(catName => {
      const cat = categoryBreakdown[catName];
      cat.averageAmount = cat.expenseCount > 0 ? cat.totalAmount / cat.expenseCount : 0;
    });

    // تجميع يومي
    const dailyBreakdown: Record<string, number> = {};
    monthlyExpenses.forEach(expense => {
      const dayKey = expense.date;
      if (!dailyBreakdown[dayKey]) {
        dailyBreakdown[dayKey] = 0;
      }
      dailyBreakdown[dayKey] += expense.amount;
    });

    return {
      year,
      month,
      totalAmount,
      totalExpenses,
      averageExpense,
      paidAmount,
      unpaidAmount,
      paidCount: paidExpenses.length,
      unpaidCount: unpaidExpenses.length,
      categoryBreakdown,
      dailyBreakdown,
      isLoading: false
    };
  }, [isCacheValid, getMonthlyExpensesList]);

  // التحميل المسبق للأشهر المجاورة
  const preloadAdjacentMonths = useCallback(async (currentYear: number, currentMonth: number) => {
    const adjacentMonths: Array<{year: number, month: number}> = [];

    // إضافة الشهر السابق والشهر التالي
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    adjacentMonths.push(
      { year: prevYear, month: prevMonth },
      { year: nextYear, month: nextMonth }
    );

    // تحميل البيانات في الخلفية
    adjacentMonths.forEach(({year, month}) => {
      const cacheKey = `${year}-${month}`;
      if (!cacheRef.current.preloadedMonths.has(cacheKey)) {
        setTimeout(() => loadMonthlySummaryProgressively(year, month), 100);
      }
    });
  }, [loadMonthlySummaryProgressively]);

  // الحصول على المصروفات مع pagination محسن
  const getPaginatedExpenses = useCallback((
    page: number = 1,
    itemsPerPage: number = 20,
    filters?: {
      category?: string;
      isPaid?: boolean;
      dateFrom?: string;
      dateTo?: string;
      searchTerm?: string;
    }
  ): PaginatedExpenses => {
    const cacheKey = `${page}-${itemsPerPage}-${JSON.stringify(filters || {})}`;
    const cache = cacheRef.current.paginatedExpenses;

    // التحقق من الـ cache
    if (isCacheValid() && cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // تطبيق التصفية
    let filteredExpenses = expenses;

    if (filters) {
      if (filters.category) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === filters.category);
      }

      if (filters.isPaid !== undefined) {
        filteredExpenses = filteredExpenses.filter(exp => exp.isPaid === filters.isPaid);
      }

      if (filters.dateFrom) {
        filteredExpenses = filteredExpenses.filter(exp => exp.date >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        filteredExpenses = filteredExpenses.filter(exp => exp.date <= filters.dateTo!);
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredExpenses = filteredExpenses.filter(exp =>
          (exp as Expense & { description?: string }).description?.toLowerCase().includes(searchLower) ||
          exp.category.toLowerCase().includes(searchLower)
        );
      }
    }

    // ترتيب المصروفات (الأحدث أولاً)
    filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // حساب pagination
    const totalItems = filteredExpenses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredExpenses.slice(startIndex, endIndex);

    const result: PaginatedExpenses = {
      expenses: paginatedItems,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    // حفظ في الـ cache
    cache.set(cacheKey, result);

    return result;
  }, [expenses, isCacheValid]);

  // التحميل التدريجي للصفحات مع مؤشر التقدم
  const loadPaginatedExpensesProgressively = useCallback(async (
    page: number,
    itemsPerPage: number,
    filters?: any
  ): Promise<PaginatedExpenses> => {
    const cacheKey = `${page}-${itemsPerPage}-${JSON.stringify(filters || {})}`;
    const cache = cacheRef.current.paginatedExpenses;

    // التحقق من الـ cache أولاً
    if (isCacheValid() && cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // بدء التحميل
    setLoadingState(prev => ({ ...prev, isLoadingPagination: true, loadingProgress: 0, error: null }));

    try {
      // المرحلة 1: تطبيق التصفية (50%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 50 }));
      await new Promise(resolve => setTimeout(resolve, 50)); // محاكاة تأخير للتحميل

      // المرحلة 2: حساب pagination (100%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 90 }));
      const result = getPaginatedExpenses(page, itemsPerPage, filters);

      setLoadingState(prev => ({ ...prev, isLoadingPagination: false, loadingProgress: 100 }));
      return result;

    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoadingPagination: false,
        error: 'خطأ في تحميل الصفحة'
      }));
      throw error;
    }
  }, [getPaginatedExpenses, isCacheValid]);

  // التحميل المسبق للصفحات المجاورة
  const preloadAdjacentPages = useCallback(async (
    currentPage: number,
    itemsPerPage: number,
    filters?: any
  ) => {
    const adjacentPages = [currentPage - 1, currentPage + 1].filter(page => page > 0);

    adjacentPages.forEach(page => {
      const cacheKey = `${page}-${itemsPerPage}-${JSON.stringify(filters || {})}`;
      if (!cacheRef.current.paginatedExpenses.has(cacheKey)) {
        setTimeout(() => {
          getPaginatedExpenses(page, itemsPerPage, filters);
        }, 100);
      }
    });
  }, [getPaginatedExpenses]);

  // بناء محرك التصفية مع معالجة الأخطاء
  const buildFilterEngine = useCallback(() => {
    if (!cacheRef.current.filterEngine || !isCacheValid()) {
      try {
        cacheRef.current.filterEngine = new ExpenseFilterEngine(expenses);
        cacheRef.current.lastUpdate = Date.now();
      } catch (error) {
        console.warn('Failed to build filter engine:', error);
        errorManager.createError(
          ErrorType.CALCULATION_ERROR,
          error as Error,
          { expenseCount: expenses.length }
        );
        setLoadingState(prev => ({
          ...prev,
          error: 'خطأ في بناء محرك التصفية'
        }));
      }
    }
  }, [expenses, isCacheValid]);

  // التصفية المتقدمة مع cache والفهرسة المحسنة ومعالجة الأخطاء
  const getFilteredExpenses = useCallback((filters: AdvancedExpenseFilters): Expense[] => {
    const cacheKey = JSON.stringify(filters);
    const cache = cacheRef.current.filteredExpenses;

    // التحقق من الـ cache مع تحديث وقت الوصول
    const cachedResult = getFromCache(cache, 'filteredExpenses', cacheKey);
    if (isCacheValid() && cachedResult) {
      return cachedResult;
    }

    // بناء محرك التصفية إذا لم يكن موجوداً (sync version)
    if (!cacheRef.current.filterEngine || !isCacheValid()) {
      try {
        cacheRef.current.filterEngine = new ExpenseFilterEngine(expenses);
        cacheRef.current.lastUpdate = Date.now();
      } catch (error) {
        console.warn('Failed to build filter engine:', error);
        setLoadingState(prev => ({
          ...prev,
          error: 'خطأ في بناء محرك التصفية'
        }));
        return [];
      }
    }

    // تطبيق التصفية مع معالجة الأخطاء
    try {
      if (!cacheRef.current.filterEngine) {
        throw new Error('Filter engine not available');
      }

      const filteredExpenses = cacheRef.current.filterEngine.applyFilters(filters);

      // حفظ في الـ cache مع إدارة الذاكرة
      addToCache(cache, 'filteredExpenses', cacheKey, filteredExpenses);

      return filteredExpenses;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error filtering expenses:', error);
      }
      errorManager.createError(
        ErrorType.CALCULATION_ERROR,
        error as Error,
        { filters, expenseCount: expenses.length }
      );
      return [];
    }
  }, [isCacheValid, getFromCache, addToCache, expenses]);

  // الحصول على المصروفات مع pagination وتصفية متقدمة
  const getAdvancedPaginatedExpenses = useCallback((
    page: number = 1,
    itemsPerPage: number = 20,
    filters: AdvancedExpenseFilters = {}
  ): PaginatedExpenses => {
    // تطبيق التصفية أولاً
    const filteredExpenses = getFilteredExpenses(filters);

    // حساب pagination
    const totalItems = filteredExpenses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredExpenses.slice(startIndex, endIndex);

    return {
      expenses: paginatedItems,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }, [getFilteredExpenses]);

  // الحصول على إحصائيات التصفية
  const getFilterStats = useCallback(() => {
    buildFilterEngine();
    return cacheRef.current.filterEngine!.getFilterStats();
  }, [buildFilterEngine]);

  // البحث السريع في المصروفات مع الفهرسة المتقدمة
  const searchExpenses = useCallback((searchTerm: string): Expense[] => {
    if (!searchTerm || searchTerm.length < 2) {
      return expenses;
    }

    return getFilteredExpenses({ searchTerm });
  }, [expenses, getFilteredExpenses]);

  // البحث المتقدم مع خيارات إضافية
  const advancedSearchExpenses = useCallback((
    searchTerm: string,
    options: {
      exact?: boolean;
      fuzzy?: boolean;
      category?: string;
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
    } = {}
  ): Expense[] => {
    try {
      buildFilterEngine();
      if (!cacheRef.current.filterEngine) {
        return [];
      }
      return cacheRef.current.filterEngine.advancedSearch(searchTerm, options);
    } catch (error) {
      console.error('Error in advanced search:', error);
      return [];
    }
  }, [buildFilterEngine]);

  // الحصول على المصروفات بالفهرس المتقدم
  const getExpensesByAdvancedIndex = useCallback((
    indexType: 'byDate' | 'byMonth' | 'byYear' | 'byWeek',
    key: string
  ): Expense[] => {
    try {
      buildFilterEngine();
      if (!cacheRef.current.filterEngine) {
        return [];
      }
      return cacheRef.current.filterEngine.getByAdvancedIndex(indexType, key);
    } catch (error) {
      console.error('Error getting expenses by advanced index:', error);
      return [];
    }
  }, [buildFilterEngine]);

  // الحصول على المصروفات المركبة
  const getExpensesByCompositeIndex = useCallback((
    type: 'dateAndCategory' | 'monthAndCategory' | 'statusAndCategory',
    key1: string,
    key2: string
  ): Expense[] => {
    try {
      buildFilterEngine();
      const engine = cacheRef.current.filterEngine;
      if (!engine) {
        return [];
      }

      switch (type) {
        case 'dateAndCategory':
          return engine.getByDateAndCategory(key1, key2);
        case 'monthAndCategory':
          return engine.getByMonthAndCategory(key1, key2);
        case 'statusAndCategory':
          return engine.getByStatusAndCategory(key1 === 'true', key2);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting expenses by composite index:', error);
      return [];
    }
  }, [buildFilterEngine]);

  // الحصول على المصروفات مرتبة
  const getSortedExpenses = useCallback((sortBy: 'amount' | 'date'): Expense[] => {
    try {
      buildFilterEngine();
      if (!cacheRef.current.filterEngine) {
        return [];
      }
      return cacheRef.current.filterEngine.getSortedExpenses(sortBy);
    } catch (error) {
      console.error('Error getting sorted expenses:', error);
      return [];
    }
  }, [buildFilterEngine]);

  // إعداد تنظيف دوري للـ cache
  useEffect(() => {
    // تنظيف دوري كل 10 دقائق
    memoryManager.schedulePeriodicCleanup('expenseCache', 10, () => {
      const cache = cacheRef.current;

      // تنظيف كل نوع cache
      const cleanupConfigs: Record<string, CleanupConfig> = {
        categoryAggregation: {
          maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.medium * 60 * 1000,
          maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.categoryAggregation,
          priority: 'lru'
        },
        monthlyStats: {
          maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.long * 60 * 1000,
          maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.monthlyStats,
          priority: 'lru'
        },
        paginatedExpenses: {
          maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.short * 60 * 1000,
          maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.paginatedExpenses,
          priority: 'lru'
        },
        filteredExpenses: {
          maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.short * 60 * 1000,
          maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.filteredExpenses,
          priority: 'lru'
        }
      };

      // تطبيق التنظيف
      Object.entries(cleanupConfigs).forEach(([type, config]) => {
        const cacheMap = cache[type as keyof typeof cache] as Map<string, any>;
        if (cacheMap instanceof Map) {
          memoryManager.cleanupCache(cacheMap, type, config);
        }
      });
    });

    // تنظيف عند إلغاء التحميل
    return () => {
      memoryManager.stopAllCleanupTimers();
    };
  }, []);

  // دالة للحصول على إحصائيات الذاكرة
  const getMemoryStats = useCallback(() => {
    return memoryManager.getMemoryStats();
  }, []);

  // دالة لتنظيف يدوي للذاكرة
  const performManualCleanup = useCallback(() => {
    return memoryManager.performGlobalCleanup();
  }, []);

  return {
    // الدوال الأساسية المحسنة
    getOptimizedCategoryAggregation,
    getExpensesByCategory,
    getTopCategories,
    getCategoryQuickStats,

    // الملخصات الشهرية المحسنة
    getOptimizedMonthlySummary,
    loadMonthlySummaryProgressively,
    preloadAdjacentMonths,

    // pagination المحسن
    getPaginatedExpenses,
    loadPaginatedExpensesProgressively,
    preloadAdjacentPages,

    // التصفية المتقدمة
    getFilteredExpenses,
    getAdvancedPaginatedExpenses,
    getFilterStats,
    searchExpenses,
    advancedSearchExpenses,
    buildFilterEngine,

    // الفهرسة المتقدمة
    getExpensesByAdvancedIndex,
    getExpensesByCompositeIndex,
    getSortedExpenses,

    // حالة التحميل
    loadingState,

    // إدارة الـ cache والذاكرة
    clearCache,
    isCacheValid,
    buildCategoryIndex,
    getMemoryStats,
    performManualCleanup,

    // الدوال الأصلية (للتوافق) - محسنة للتحديث التلقائي
    getDailyExpensesList: useCallback((date: string) => {
      return getDailyExpensesList(date);
    }, [getDailyExpensesList, expenses.length]),

    getMonthlyExpensesList: useCallback((year: number, month: number) => {
      return getMonthlyExpensesList(year, month);
    }, [getMonthlyExpensesList, expenses.length]),

    getMonthlyCategorySummary: useCallback((year: number, month: number) => {
      return getMonthlyCategorySummary(year, month);
    }, [getMonthlyCategorySummary, expenses.length]),

    getUnpaidExpenses: useCallback(() => {
      return getUnpaidExpenses();
    }, [getUnpaidExpenses, expenses.length])
  };
};
