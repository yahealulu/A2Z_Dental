import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTreatmentStore } from '../store/treatmentStore';
import { usePaymentStore } from '../store/paymentStore';
import { useXRayStore } from '../store/xrayStore';

// نوع البيانات للقسم
type SectionType = 'info' | 'dental' | 'xray' | 'appointments' | 'payment';

// نوع البيانات للتحميل المقسم
interface SectionData {
  isLoaded: boolean;
  isLoading: boolean;
  data: any;
  error?: string;
}

// نوع البيانات للتخزين المؤقت
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// مدة صلاحية التخزين المؤقت (5 دقائق)
const CACHE_TTL = 5 * 60 * 1000;

// فئة إدارة التخزين المؤقت
class PatientDetailsCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// إنشاء مثيل واحد من التخزين المؤقت
const cache = new PatientDetailsCache();

// Hook للتحميل المقسم للأقسام
export const useSectionedLoading = (patientId: number) => {
  const [sections, setSections] = useState<Record<SectionType, SectionData>>({
    info: { isLoaded: true, isLoading: false, data: null },
    dental: { isLoaded: false, isLoading: false, data: null },
    xray: { isLoaded: false, isLoading: false, data: null },
    appointments: { isLoaded: false, isLoading: false, data: null },
    payment: { isLoaded: false, isLoading: false, data: null }
  });

  const loadSection = useCallback(async (sectionType: SectionType) => {
    if (sections[sectionType].isLoaded || sections[sectionType].isLoading) {
      return;
    }

    setSections(prev => ({
      ...prev,
      [sectionType]: { ...prev[sectionType], isLoading: true }
    }));

    try {
      // محاولة الحصول على البيانات من التخزين المؤقت أولاً
      const cacheKey = `${sectionType}_${patientId}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        setSections(prev => ({
          ...prev,
          [sectionType]: { isLoaded: true, isLoading: false, data: cachedData }
        }));
        return;
      }

      // تحميل البيانات حسب نوع القسم
      let data;
      switch (sectionType) {
        case 'dental':
          data = await loadDentalData(patientId);
          break;
        case 'xray':
          data = await loadXRayData(patientId);
          break;
        case 'appointments':
          data = await loadAppointmentsData(patientId);
          break;
        case 'payment':
          data = await loadPaymentData(patientId);
          break;
        default:
          data = null;
      }

      // حفظ البيانات في التخزين المؤقت
      cache.set(cacheKey, data);

      setSections(prev => ({
        ...prev,
        [sectionType]: { isLoaded: true, isLoading: false, data }
      }));
    } catch (error) {
      setSections(prev => ({
        ...prev,
        [sectionType]: { 
          isLoaded: false, 
          isLoading: false, 
          data: null, 
          error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
        }
      }));
    }
  }, [patientId, sections]);

  return { sections, loadSection };
};

// دوال تحميل البيانات لكل قسم
const loadDentalData = async (patientId: number) => {
  const { getCompletedTreatmentsByPatient } = useTreatmentStore.getState();
  return getCompletedTreatmentsByPatient(patientId);
};

const loadXRayData = async (patientId: number) => {
  const { getXRaysByPatientId } = useXRayStore.getState();
  return getXRaysByPatientId(patientId);
};

const loadAppointmentsData = async (patientId: number) => {
  // سيتم تنفيذها لاحقاً
  return [];
};

const loadPaymentData = async (patientId: number) => {
  const { getCompletedTreatmentsByPatient, getPaymentDistribution } = useTreatmentStore.getState();
  const { getPaymentsByPatientId, getTotalPaidByPatientId } = usePaymentStore.getState();

  const treatments = getCompletedTreatmentsByPatient(patientId);
  const payments = getPaymentsByPatientId(patientId);
  const totalPaid = getTotalPaidByPatientId(patientId);
  const paymentDistribution = getPaymentDistribution(patientId, totalPaid); // للعلاجات النشطة

  return {
    treatments,
    payments,
    totalCost: paymentDistribution.totalCost,
    totalPaid,
    paymentDistribution,
    remainingAmount: paymentDistribution.remainingAmount
  };
};

// Hook للتخزين المؤقت لحسابات توزيع الدفعات
export const usePaymentDistributionCache = (patientId: number) => {
  const [cachedDistribution, setCachedDistribution] = useState<any>(null);
  const [lastCalculationTime, setLastCalculationTime] = useState<number>(0);

  const getPaymentDistribution = useCallback((totalPaid: number, forceRecalculate = false) => {
    const cacheKey = `payment_distribution_${patientId}_${totalPaid}`;
    const now = Date.now();

    // التحقق من صحة التخزين المؤقت
    if (!forceRecalculate && cachedDistribution && (now - lastCalculationTime < CACHE_TTL)) {
      return cachedDistribution;
    }

    // إعادة حساب التوزيع
    const { getPaymentDistribution } = useTreatmentStore.getState();
    const distribution = getPaymentDistribution(patientId, totalPaid);

    // حفظ في التخزين المؤقت
    setCachedDistribution(distribution);
    setLastCalculationTime(now);
    cache.set(cacheKey, distribution);

    return distribution;
  }, [patientId, cachedDistribution, lastCalculationTime]);

  return { getPaymentDistribution };
};

// Hook للتحميل التدريجي للصور
export const useImageLazyLoading = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const loadImage = useCallback((imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (loadedImages.has(imageUrl)) {
        resolve();
        return;
      }

      if (loadingImages.has(imageUrl)) {
        // انتظار تحميل الصورة الجاري
        const checkLoading = () => {
          if (loadedImages.has(imageUrl)) {
            resolve();
          } else if (!loadingImages.has(imageUrl)) {
            reject(new Error('فشل في تحميل الصورة'));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
        return;
      }

      setLoadingImages(prev => new Set(prev).add(imageUrl));

      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(imageUrl));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageUrl);
          return newSet;
        });
        resolve();
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageUrl);
          return newSet;
        });
        reject(new Error('فشل في تحميل الصورة'));
      };
      img.src = imageUrl;
    });
  }, [loadedImages, loadingImages]);

  const isImageLoaded = useCallback((imageUrl: string) => {
    return loadedImages.has(imageUrl);
  }, [loadedImages]);

  const isImageLoading = useCallback((imageUrl: string) => {
    return loadingImages.has(imageUrl);
  }, [loadingImages]);

  return { loadImage, isImageLoaded, isImageLoading };
};

// Hook للتقسيم إلى صفحات
export const useDataPagination = <T>(data: T[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};

// تنظيف التخزين المؤقت عند تغيير المريض
export const clearPatientCache = (patientId?: number) => {
  if (patientId) {
    // حذف البيانات المتعلقة بمريض معين
    cache.delete(`dental_${patientId}`);
    cache.delete(`xray_${patientId}`);
    cache.delete(`appointments_${patientId}`);
    cache.delete(`payment_${patientId}`);
  } else {
    // حذف جميع البيانات
    cache.clear();
  }
};
