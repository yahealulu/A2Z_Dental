import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { usePaymentStore } from '../store/paymentStore';
import { useExpenseStore } from '../store/expenseStore';
import { useTreatmentStore } from '../store/treatmentStore';
import { usePatientStore } from '../store/patientStore';
import { OptimizedDateIndex, dateUtils, type DateRange, type DateRangeStats } from '../utils/dateIndexing';
import { memoryManager, MEMORY_LIMITS, type CleanupConfig } from '../utils/memoryManager';
import { RevenueIndexingEngine, type EnhancedPayment } from '../utils/revenueIndexing';

// نوع البيانات للإيرادات اليومية المحسنة
export interface OptimizedDailyRevenue {
  id: number;
  amount: number;
  patientName: string;
  treatmentType: string;
  paymentDate: string;
  notes?: string;
}

// نوع البيانات للإحصائيات الشهرية المحسنة
export interface OptimizedMonthlyStats {
  revenue: number;
  expenses: number;
  netProfit: number;
  isLoading: boolean;
}

// نوع البيانات لحالة التحميل التدريجي
export interface ProgressiveLoadingState {
  isLoadingDaily: boolean;
  isLoadingMonthly: boolean;
  loadingProgress: number;
  error: string | null;
}

// Cache محسن للبيانات المربوطة مع فهرسة ذكية
interface RevenueCache {
  dailyRevenue: Map<string, OptimizedDailyRevenue[]>;
  monthlyStats: Map<string, OptimizedMonthlyStats>;
  patientNames: Map<number, string>;
  treatmentTypes: Map<number, string>;
  // فهارس محسنة للبيانات المربوطة
  patientIndex: Map<number, any>;
  treatmentIndex: Map<number, any[]>;
  // Cache للبيانات المجمعة
  bulkPatientData: Map<string, Map<number, string>>;
  bulkTreatmentData: Map<string, Map<number, string>>;
  // Cache للتحميل التدريجي
  preloadedDates: Set<string>;
  preloadedMonths: Set<string>;
  // فهارس التواريخ المحسنة
  paymentDateIndex: OptimizedDateIndex<any> | null;
  expenseDateIndex: OptimizedDateIndex<any> | null;
  revenueIndexEngine: RevenueIndexingEngine | null;
  dateRangeCache: Map<string, any[]>;
  lastUpdate: number;
}

// مدة صلاحية الـ cache (5 دقائق)
const CACHE_DURATION = 5 * 60 * 1000;

export const useRevenueOptimization = () => {
  const {
    getDailyPayments,
    getMonthlyRevenue,
    getBulkDailyPayments,
    getBulkMonthlyRevenue
  } = usePaymentStore();
  const {
    getMonthlyExpensesList,
    getBulkMonthlyExpenses,
    getBulkMonthlyExpensesTotals
  } = useExpenseStore();
  const { getTreatmentsByPatient } = useTreatmentStore();
  const { getPatientById } = usePatientStore();

  // حالة التحميل التدريجي
  const [loadingState, setLoadingState] = useState<ProgressiveLoadingState>({
    isLoadingDaily: false,
    isLoadingMonthly: false,
    loadingProgress: 0,
    error: null
  });

  // Cache محلي للبيانات المحسنة مع فهارس ذكية
  const cacheRef = useRef<RevenueCache>({
    dailyRevenue: new Map(),
    monthlyStats: new Map(),
    patientNames: new Map(),
    treatmentTypes: new Map(),
    patientIndex: new Map(),
    treatmentIndex: new Map(),
    bulkPatientData: new Map(),
    bulkTreatmentData: new Map(),
    preloadedDates: new Set(),
    preloadedMonths: new Set(),
    paymentDateIndex: null,
    expenseDateIndex: null,
    revenueIndexEngine: null,
    dateRangeCache: new Map(),
    lastUpdate: 0
  });

  // التحقق من صلاحية الـ cache
  const isCacheValid = useCallback(() => {
    return Date.now() - cacheRef.current.lastUpdate < CACHE_DURATION;
  }, []);

  // بناء فهارس التواريخ المحسنة
  const buildDateIndexes = useCallback(() => {
    const { payments } = usePaymentStore.getState();
    const { expenses } = useExpenseStore.getState();

    // بناء فهرس الدفعات
    if (!cacheRef.current.paymentDateIndex) {
      cacheRef.current.paymentDateIndex = new OptimizedDateIndex<any>(
        (payment) => payment.paymentDate
      );
    }
    cacheRef.current.paymentDateIndex.buildIndex(payments);

    // بناء فهرس المصاريف
    if (!cacheRef.current.expenseDateIndex) {
      cacheRef.current.expenseDateIndex = new OptimizedDateIndex<any>(
        (expense) => expense.date
      );
    }
    cacheRef.current.expenseDateIndex.buildIndex(expenses);

    // بناء محرك فهرسة الإيرادات المتقدم
    const enhancedPayments: EnhancedPayment[] = payments
      .filter(payment => payment && payment.paymentDate) // تصفية الدفعات الصحيحة فقط
      .map(payment => {
        try {
          const patient = getPatientById(payment.patientId);
          const treatments = getTreatmentsByPatient(payment.patientId);

          return {
            id: payment.id,
            amount: payment.amount || 0,
            paymentDate: payment.paymentDate,
            patientId: payment.patientId,
            patientName: patient?.name || 'مريض غير معروف',
            treatmentType: treatments?.[0]?.type || 'علاج غير محدد',
            notes: payment.notes || '',
            category: treatments?.[0]?.type || 'عام',
            description: `${patient?.name || 'مريض غير معروف'} ${payment.notes || ''}`.trim()
          };
        } catch (error) {
          console.error('Error processing payment:', payment, error);
          return {
            id: payment.id,
            amount: payment.amount || 0,
            paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
            patientId: payment.patientId,
            patientName: 'مريض غير معروف',
            treatmentType: 'علاج غير محدد',
            notes: payment.notes || '',
            category: 'عام',
            description: 'دفعة غير مكتملة البيانات'
          };
        }
      });

    try {
      if (!cacheRef.current.revenueIndexEngine) {
        cacheRef.current.revenueIndexEngine = new RevenueIndexingEngine(enhancedPayments);
      } else {
        cacheRef.current.revenueIndexEngine.updateData(enhancedPayments);
      }
    } catch (error) {
      console.error('Error building revenue index engine:', error);
      // إنشاء محرك فارغ في حالة الفشل
      cacheRef.current.revenueIndexEngine = null;
    }

    cacheRef.current.lastUpdate = Date.now();
  }, [getPatientById, getTreatmentsByPatient]);

  // إضافة عنصر إلى الـ cache مع إدارة الذاكرة
  const addToRevenueCache = useCallback(<T>(
    cacheMap: Map<string, T>,
    cacheType: string,
    key: string,
    value: T
  ) => {
    const fullKey = `revenue-${cacheType}-${key}`;

    // تسجيل استخدام الذاكرة
    memoryManager.recordMemoryUsage(fullKey, value);

    // إضافة إلى الـ cache
    cacheMap.set(key, value);

    // تنظيف تلقائي إذا تجاوز الحد
    const maxItems = MEMORY_LIMITS.MAX_CACHE_ITEMS.dailyRevenue || 100;
    if (cacheMap.size > maxItems) {
      const cleanupConfig: CleanupConfig = {
        maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.medium * 60 * 1000,
        maxItems,
        priority: 'lru'
      };
      memoryManager.cleanupCache(cacheMap, `revenue-${cacheType}`, cleanupConfig);
    }
  }, []);

  // مسح الـ cache مع إدارة الذاكرة
  const clearCache = useCallback(() => {
    // إزالة تسجيلات الذاكرة للعناصر الحالية
    cacheRef.current.dailyRevenue.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`revenue-dailyRevenue-${key}`);
    });
    cacheRef.current.monthlyStats.forEach((_, key) => {
      memoryManager.removeMemoryRecord(`revenue-monthlyStats-${key}`);
    });

    cacheRef.current = {
      dailyRevenue: new Map(),
      monthlyStats: new Map(),
      patientNames: new Map(),
      treatmentTypes: new Map(),
      patientIndex: new Map(),
      treatmentIndex: new Map(),
      bulkPatientData: new Map(),
      bulkTreatmentData: new Map(),
      preloadedDates: new Set(),
      preloadedMonths: new Set(),
      paymentDateIndex: null,
      expenseDateIndex: null,
      dateRangeCache: new Map(),
      lastUpdate: Date.now()
    };
    setLoadingState({
      isLoadingDaily: false,
      isLoadingMonthly: false,
      loadingProgress: 0,
      error: null
    });
  }, []);

  // تحميل بيانات المرضى بشكل مجمع لتحسين الأداء
  const loadBulkPatientData = useCallback((patientIds: number[]): Map<number, string> => {
    const cacheKey = patientIds.sort().join(',');
    const bulkCache = cacheRef.current.bulkPatientData;

    if (isCacheValid() && bulkCache.has(cacheKey)) {
      return bulkCache.get(cacheKey)!;
    }

    const result = new Map<number, string>();
    const patientCache = cacheRef.current.patientNames;

    // تحميل البيانات المفقودة فقط
    const missingIds = patientIds.filter(id => !patientCache.has(id));

    // تحميل البيانات المفقودة دفعة واحدة
    missingIds.forEach(patientId => {
      const patient = getPatientById(patientId);
      const name = patient?.name || 'غير محدد';
      patientCache.set(patientId, name);
    });

    // بناء النتيجة من الـ cache
    patientIds.forEach(patientId => {
      result.set(patientId, patientCache.get(patientId) || 'غير محدد');
    });

    // حفظ في الـ bulk cache
    bulkCache.set(cacheKey, result);

    return result;
  }, [getPatientById, isCacheValid]);

  // الحصول على اسم المريض مع cache محسن
  const getPatientNameCached = useCallback((patientId: number): string => {
    const cache = cacheRef.current.patientNames;

    if (cache.has(patientId)) {
      return cache.get(patientId)!;
    }

    const patient = getPatientById(patientId);
    const name = patient?.name || 'غير محدد';
    cache.set(patientId, name);

    return name;
  }, [getPatientById]);

  // تحميل بيانات العلاجات بشكل مجمع لتحسين الأداء
  const loadBulkTreatmentData = useCallback((patientIds: number[]): Map<number, string> => {
    const cacheKey = patientIds.sort().join(',');
    const bulkCache = cacheRef.current.bulkTreatmentData;

    if (isCacheValid() && bulkCache.has(cacheKey)) {
      return bulkCache.get(cacheKey)!;
    }

    const result = new Map<number, string>();
    const treatmentCache = cacheRef.current.treatmentTypes;
    const treatmentIndex = cacheRef.current.treatmentIndex;

    // تحميل البيانات المفقودة فقط
    const missingIds = patientIds.filter(id => !treatmentCache.has(id));

    // تحميل بيانات العلاجات للمرضى المفقودين دفعة واحدة
    missingIds.forEach(patientId => {
      let patientTreatments = treatmentIndex.get(patientId);

      if (!patientTreatments) {
        patientTreatments = getTreatmentsByPatient(patientId);
        treatmentIndex.set(patientId, patientTreatments);
      }

      const latestTreatment = patientTreatments
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const treatmentType = latestTreatment?.name || 'غير محدد';
      treatmentCache.set(patientId, treatmentType);
    });

    // بناء النتيجة من الـ cache
    patientIds.forEach(patientId => {
      result.set(patientId, treatmentCache.get(patientId) || 'غير محدد');
    });

    // حفظ في الـ bulk cache
    bulkCache.set(cacheKey, result);

    return result;
  }, [getTreatmentsByPatient, isCacheValid]);

  // الحصول على نوع العلاج مع cache محسن
  const getTreatmentTypeCached = useCallback((patientId: number): string => {
    const cache = cacheRef.current.treatmentTypes;

    if (cache.has(patientId)) {
      return cache.get(patientId)!;
    }

    const patientTreatments = getTreatmentsByPatient(patientId);
    const latestTreatment = patientTreatments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const treatmentType = latestTreatment?.name || 'غير محدد';
    cache.set(patientId, treatmentType);

    return treatmentType;
  }, [getTreatmentsByPatient]);

  // الحصول على الدفعات اليومية باستخدام الفهرس المحسن
  const getOptimizedDailyPayments = useCallback((date: string) => {
    // التأكد من وجود الفهرس
    if (!cacheRef.current.paymentDateIndex || !cacheRef.current.paymentDateIndex.isIndexValid()) {
      buildDateIndexes();
    }

    return cacheRef.current.paymentDateIndex?.getByDate(date) || getDailyPayments(date);
  }, [getDailyPayments, buildDateIndexes]);

  // الحصول على المصاريف الشهرية باستخدام الفهرس المحسن
  const getOptimizedMonthlyExpenses = useCallback((year: number, month: number) => {
    // التأكد من وجود الفهرس
    if (!cacheRef.current.expenseDateIndex || !cacheRef.current.expenseDateIndex.isIndexValid()) {
      buildDateIndexes();
    }

    return cacheRef.current.expenseDateIndex?.getByMonth(year, month) || getMonthlyExpensesList(year, month);
  }, [getMonthlyExpensesList, buildDateIndexes]);

  // البحث في نطاق زمني محسن
  const getPaymentsByDateRange = useCallback((startDate: string, endDate: string) => {
    const cacheKey = `${startDate}-${endDate}`;
    const rangeCache = cacheRef.current.dateRangeCache;

    // التحقق من الـ cache
    if (rangeCache.has(cacheKey)) {
      return rangeCache.get(cacheKey)!;
    }

    // التأكد من وجود الفهرس
    if (!cacheRef.current.paymentDateIndex || !cacheRef.current.paymentDateIndex.isIndexValid()) {
      buildDateIndexes();
    }

    const result = cacheRef.current.paymentDateIndex?.getByDateRange(startDate, endDate) || [];
    rangeCache.set(cacheKey, result);

    return result;
  }, [buildDateIndexes]);

  // التحميل التدريجي للبيانات اليومية مع مؤشر التقدم (محسن بالفهرس)
  const loadDailyRevenueProgressively = useCallback(async (date: string): Promise<OptimizedDailyRevenue[]> => {
    const cache = cacheRef.current.dailyRevenue;

    // التحقق من الـ cache أولاً
    if (isCacheValid() && cache.has(date)) {
      return cache.get(date)!;
    }

    // بدء التحميل
    setLoadingState(prev => ({ ...prev, isLoadingDaily: true, loadingProgress: 0, error: null }));

    try {
      // المرحلة 1: تحميل الدفعات اليومية باستخدام الفهرس المحسن (25%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 25 }));
      const dailyPayments = getOptimizedDailyPayments(date);

      if (dailyPayments.length === 0) {
        cache.set(date, []);
        cacheRef.current.preloadedDates.add(date);
        setLoadingState(prev => ({ ...prev, isLoadingDaily: false, loadingProgress: 100 }));
        return [];
      }

      // المرحلة 2: استخراج معرفات المرضى (50%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 50 }));
      const uniquePatientIds = [...new Set(dailyPayments.map(p => p.patientId))];

      // المرحلة 3: تحميل بيانات المرضى (75%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 75 }));
      const patientNamesMap = loadBulkPatientData(uniquePatientIds);
      const treatmentTypesMap = loadBulkTreatmentData(uniquePatientIds);

      // المرحلة 4: بناء النتيجة (100%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 90 }));
      const result = dailyPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        patientName: payment.patientName || patientNamesMap.get(payment.patientId) || 'غير محدد',
        treatmentType: treatmentTypesMap.get(payment.patientId) || 'غير محدد',
        paymentDate: payment.paymentDate,
        notes: payment.notes
      }));

      // حفظ في الـ cache
      cache.set(date, result);
      cacheRef.current.preloadedDates.add(date);

      setLoadingState(prev => ({ ...prev, isLoadingDaily: false, loadingProgress: 100 }));
      return result;

    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoadingDaily: false,
        error: 'خطأ في تحميل البيانات اليومية'
      }));
      throw error;
    }
  }, [getOptimizedDailyPayments, loadBulkPatientData, loadBulkTreatmentData, isCacheValid]);

  // الحصول على إيرادات اليوم المحسنة (متزامن للاستخدام الفوري)
  const getOptimizedDailyRevenue = useCallback((date: string): OptimizedDailyRevenue[] => {
    const cache = cacheRef.current.dailyRevenue;

    // التحقق من الـ cache
    if (isCacheValid() && cache.has(date)) {
      return cache.get(date)!;
    }

    // الحصول على الدفعات اليومية مباشرة
    const dailyPayments = getOptimizedDailyPayments(date);

    if (dailyPayments.length === 0) {
      cache.set(date, []);
      return [];
    }

    // تحويل الدفعات إلى إيرادات
    const result = dailyPayments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      patientName: payment.patientName || 'غير محدد',
      treatmentType: 'دفعة', // قيمة ثابتة بسيطة
      paymentDate: payment.paymentDate,
      notes: payment.notes
    }));

    // حفظ في الـ cache
    cache.set(date, result);

    return result;
  }, [isCacheValid, getOptimizedDailyPayments]);

  // التحميل التدريجي للإحصائيات الشهرية (محسن بالفهرس)
  const loadMonthlyStatsProgressively = useCallback(async (year: number, month: number): Promise<OptimizedMonthlyStats> => {
    const cacheKey = `${year}-${month}`;
    const cache = cacheRef.current.monthlyStats;

    // التحقق من الـ cache أولاً
    if (isCacheValid() && cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // بدء التحميل
    setLoadingState(prev => ({ ...prev, isLoadingMonthly: true, loadingProgress: 0, error: null }));

    try {
      // المرحلة 1: تحميل الإيرادات الشهرية (50%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 50 }));
      const revenue = getMonthlyRevenue(year, month);

      // المرحلة 2: تحميل المصاريف الشهرية باستخدام الفهرس المحسن (75%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 75 }));
      const expensesList = getOptimizedMonthlyExpenses(year, month);
      const expenses = expensesList.reduce((sum, expense) => sum + expense.amount, 0);

      // المرحلة 3: حساب صافي الربح (100%)
      setLoadingState(prev => ({ ...prev, loadingProgress: 90 }));
      const netProfit = revenue - expenses;

      const result: OptimizedMonthlyStats = {
        revenue,
        expenses,
        netProfit,
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
        error: 'خطأ في تحميل الإحصائيات الشهرية'
      }));
      throw error;
    }
  }, [getMonthlyRevenue, getOptimizedMonthlyExpenses, isCacheValid]);

  // الحصول على الإحصائيات الشهرية المحسنة (متزامن للاستخدام الفوري)
  const getOptimizedMonthlyStats = useCallback((year: number, month: number): OptimizedMonthlyStats => {
    const cacheKey = `${year}-${month}`;
    const cache = cacheRef.current.monthlyStats;

    // التحقق من الـ cache
    if (isCacheValid() && cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // حساب الإيرادات والمصاريف مباشرة
    const revenue = getMonthlyRevenue(year, month);
    const expenses = getOptimizedMonthlyExpenses(year, month).reduce((total, expense) => total + expense.amount, 0);
    const netProfit = revenue - expenses;

    const result = {
      revenue,
      expenses,
      netProfit,
      isLoading: false
    };

    // حفظ في الـ cache
    cache.set(cacheKey, result);

    return result;
  }, [isCacheValid, getMonthlyRevenue, getOptimizedMonthlyExpenses]);

  // الحصول على إحصائيات متعددة الأشهر بشكل مجمع
  const getBulkMonthlyStats = useCallback((periods: Array<{year: number, month: number}>): Map<string, OptimizedMonthlyStats> => {
    const result = new Map<string, OptimizedMonthlyStats>();
    const cache = cacheRef.current.monthlyStats;
    const missingPeriods: Array<{year: number, month: number}> = [];

    // التحقق من الـ cache أولاً
    periods.forEach(({year, month}) => {
      const cacheKey = `${year}-${month}`;
      if (isCacheValid() && cache.has(cacheKey)) {
        result.set(cacheKey, cache.get(cacheKey)!);
      } else {
        missingPeriods.push({year, month});
      }
    });

    // تحميل البيانات المفقودة بشكل مجمع
    if (missingPeriods.length > 0) {
      const revenueMap = getBulkMonthlyRevenue(missingPeriods);
      const expensesMap = getBulkMonthlyExpensesTotals(missingPeriods);

      missingPeriods.forEach(({year, month}) => {
        const cacheKey = `${year}-${month}`;
        const revenue = revenueMap.get(cacheKey) || 0;
        const expenses = expensesMap.get(cacheKey) || 0;
        const netProfit = revenue - expenses;

        const stats: OptimizedMonthlyStats = {
          revenue,
          expenses,
          netProfit,
          isLoading: false
        };

        cache.set(cacheKey, stats);
        result.set(cacheKey, stats);
      });
    }

    return result;
  }, [getBulkMonthlyRevenue, getBulkMonthlyExpensesTotals, isCacheValid]);

  // حساب إجمالي إيرادات اليوم المحسن
  const calculateDailyTotal = useCallback((dailyRevenue: OptimizedDailyRevenue[]): number => {
    return dailyRevenue.reduce((sum, revenue) => sum + revenue.amount, 0);
  }, []);

  // دالة لتحسين الفهارس وإعادة بنائها عند الحاجة
  const optimizeIndexes = useCallback(() => {
    const cache = cacheRef.current;

    // مسح الفهارس القديمة إذا كانت كبيرة جداً
    if (cache.patientIndex.size > 1000) {
      cache.patientIndex.clear();
    }

    if (cache.treatmentIndex.size > 1000) {
      cache.treatmentIndex.clear();
    }

    // مسح bulk cache إذا كان كبيراً
    if (cache.bulkPatientData.size > 100) {
      cache.bulkPatientData.clear();
    }

    if (cache.bulkTreatmentData.size > 100) {
      cache.bulkTreatmentData.clear();
    }
  }, []);

  // التحميل المسبق للتواريخ المجاورة
  const preloadAdjacentDates = useCallback(async (currentDate: string) => {
    const date = new Date(currentDate);
    const adjacentDates: string[] = [];

    // إضافة 3 أيام قبل و 3 أيام بعد التاريخ الحالي
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue; // تجاهل التاريخ الحالي
      const adjacentDate = new Date(date);
      adjacentDate.setDate(date.getDate() + i);
      adjacentDates.push(format(adjacentDate, 'yyyy-MM-dd'));
    }

    // تحميل البيانات في الخلفية
    adjacentDates.forEach(dateStr => {
      if (!cacheRef.current.preloadedDates.has(dateStr)) {
        setTimeout(() => loadDailyRevenueProgressively(dateStr), 100);
      }
    });
  }, [loadDailyRevenueProgressively]);

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
        setTimeout(() => loadMonthlyStatsProgressively(year, month), 200);
      }
    });
  }, [loadMonthlyStatsProgressively]);

  // الحصول على إحصائيات النطاق الزمني
  const getDateRangeStats = useCallback((startDate?: string, endDate?: string): DateRangeStats | null => {
    if (!cacheRef.current.paymentDateIndex || !cacheRef.current.paymentDateIndex.isIndexValid()) {
      buildDateIndexes();
    }

    return cacheRef.current.paymentDateIndex?.getDateRangeStats(startDate, endDate) || null;
  }, [buildDateIndexes]);

  // البحث عن التواريخ القريبة
  const findNearestDates = useCallback((targetDate: string, count: number = 5): string[] => {
    if (!cacheRef.current.paymentDateIndex || !cacheRef.current.paymentDateIndex.isIndexValid()) {
      buildDateIndexes();
    }

    return cacheRef.current.paymentDateIndex?.findNearestDates(targetDate, count) || [];
  }, [buildDateIndexes]);

  // الحصول على معلومات الفهرس
  const getIndexInfo = useCallback(() => {
    const paymentIndexInfo = cacheRef.current.paymentDateIndex?.getIndexInfo();
    const expenseIndexInfo = cacheRef.current.expenseDateIndex?.getIndexInfo();

    return {
      payments: paymentIndexInfo,
      expenses: expenseIndexInfo,
      isValid: cacheRef.current.paymentDateIndex?.isIndexValid() && cacheRef.current.expenseDateIndex?.isIndexValid()
    };
  }, []);

  // دالة للحصول على إحصائيات الـ cache
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    return {
      dailyRevenueSize: cache.dailyRevenue.size,
      monthlyStatsSize: cache.monthlyStats.size,
      patientNamesSize: cache.patientNames.size,
      treatmentTypesSize: cache.treatmentTypes.size,
      patientIndexSize: cache.patientIndex.size,
      treatmentIndexSize: cache.treatmentIndex.size,
      bulkPatientDataSize: cache.bulkPatientData.size,
      bulkTreatmentDataSize: cache.bulkTreatmentData.size,
      preloadedDatesSize: cache.preloadedDates.size,
      preloadedMonthsSize: cache.preloadedMonths.size,
      dateRangeCacheSize: cache.dateRangeCache.size,
      paymentIndexValid: cache.paymentDateIndex?.isIndexValid() || false,
      expenseIndexValid: cache.expenseDateIndex?.isIndexValid() || false,
      isValid: isCacheValid(),
      lastUpdate: new Date(cache.lastUpdate).toLocaleString()
    };
  }, [isCacheValid]);

  // تهيئة الفهارس عند التحميل الأول
  useEffect(() => {
    buildDateIndexes();
  }, [buildDateIndexes]);

  // إعداد تنظيف دوري للـ cache
  useEffect(() => {
    // تنظيف دوري كل 15 دقيقة للإيرادات
    memoryManager.schedulePeriodicCleanup('revenueCache', 15, () => {
      const cache = cacheRef.current;

      // تنظيف الإيرادات اليومية
      const dailyCleanupConfig: CleanupConfig = {
        maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.medium * 60 * 1000,
        maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.dailyRevenue,
        priority: 'lru'
      };
      memoryManager.cleanupCache(cache.dailyRevenue, 'revenue-dailyRevenue', dailyCleanupConfig);

      // تنظيف الإحصائيات الشهرية
      const monthlyCleanupConfig: CleanupConfig = {
        maxAge: MEMORY_LIMITS.CACHE_TTL_MINUTES.long * 60 * 1000,
        maxItems: MEMORY_LIMITS.MAX_CACHE_ITEMS.monthlyStats,
        priority: 'lru'
      };
      memoryManager.cleanupCache(cache.monthlyStats, 'revenue-monthlyStats', monthlyCleanupConfig);
    });

    return () => {
      memoryManager.stopAllCleanupTimers();
    };
  }, []);

  return {
    // الدوال الأساسية
    getOptimizedDailyRevenue,
    getOptimizedMonthlyStats,
    getBulkMonthlyStats,
    calculateDailyTotal,

    // التحميل التدريجي
    loadDailyRevenueProgressively,
    loadMonthlyStatsProgressively,
    preloadAdjacentDates,
    preloadAdjacentMonths,

    // حالة التحميل
    loadingState,

    // الدوال المحسنة بالفهرس
    getOptimizedDailyPayments,
    getOptimizedMonthlyExpenses,
    getPaymentsByDateRange,
    getDateRangeStats,
    findNearestDates,

    // إدارة الفهارس
    buildDateIndexes,
    getIndexInfo,

    // إدارة الـ cache
    clearCache,
    isCacheValid,
    optimizeIndexes,
    getCacheStats,

    // دوال إضافية للتحكم المتقدم
    loadBulkPatientData,
    loadBulkTreatmentData,

    // أدوات التاريخ
    dateUtils,

    // الفهرسة المتقدمة للإيرادات (دوال جديدة)
    searchRevenue: useCallback((
      query: string,
      options: {
        patientId?: number;
        treatmentType?: string;
        dateRange?: { start: string; end: string };
        amountRange?: { min: number; max: number };
        fuzzy?: boolean;
      } = {}
    ): EnhancedPayment[] => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.searchRevenue(query, options) || [];
    }, [buildDateIndexes]),

    getPatientRevenue: useCallback((patientId: number, monthKey?: string): EnhancedPayment[] => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getPatientPayments(patientId, monthKey) || [];
    }, [buildDateIndexes]),

    getTreatmentRevenue: useCallback((treatmentType: string, dateKey?: string): EnhancedPayment[] => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getTreatmentPayments(treatmentType, dateKey) || [];
    }, [buildDateIndexes]),

    getQuarterlyRevenue: useCallback((year: number, quarter: number): EnhancedPayment[] => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getQuarterlyRevenue(year, quarter) || [];
    }, [buildDateIndexes]),

    getTopPatients: useCallback((limit: number = 10) => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getTopPatients(limit) || [];
    }, [buildDateIndexes]),

    getTopTreatments: useCallback((limit: number = 10) => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getTopTreatments(limit) || [];
    }, [buildDateIndexes]),

    getRevenueQuickStats: useCallback(() => {
      buildDateIndexes();
      return cacheRef.current.revenueIndexEngine?.getQuickStats() || {};
    }, [buildDateIndexes])
  };
};
