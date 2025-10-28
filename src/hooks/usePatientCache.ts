import { useMemo, useCallback, useState, useRef } from 'react';
import type { Patient } from '../store/patientStore';

// نوع بيانات آخر زيارة مع التخزين المؤقت
interface CachedLastVisit {
  patientId: number;
  lastVisit?: string;
  calculatedAt: number;
  appointmentsHash: string;
}

// خيارات التخزين المؤقت
interface CacheOptions {
  maxAge?: number; // بالميلي ثانية
  maxSize?: number; // عدد العناصر
}

export const usePatientCache = (options: CacheOptions = {}) => {
  const { maxAge = 5 * 60 * 1000, maxSize = 1000 } = options; // 5 دقائق افتراضياً
  
  // تخزين مؤقت لآخر زيارة
  const lastVisitCacheRef = useRef<Map<number, CachedLastVisit>>(new Map());
  
  // تخزين مؤقت للحسابات العامة
  const generalCacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  
  // إحصائيات التخزين المؤقت
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    size: 0
  });

  // تنظيف التخزين المؤقت المنتهي الصلاحية
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const lastVisitCache = lastVisitCacheRef.current;
    const generalCache = generalCacheRef.current;

    // تنظيف تخزين آخر زيارة
    for (const [key, value] of lastVisitCache.entries()) {
      if (now - value.calculatedAt > maxAge) {
        lastVisitCache.delete(key);
      }
    }

    // تنظيف التخزين العام
    for (const [key, value] of generalCache.entries()) {
      if (now - value.timestamp > maxAge) {
        generalCache.delete(key);
      }
    }

    // تحديث الإحصائيات
    setCacheStats(prev => ({
      ...prev,
      size: lastVisitCache.size + generalCache.size
    }));
  }, [maxAge]);

  // حساب hash للمواعيد للتحقق من التغييرات
  const calculateAppointmentsHash = useCallback((appointments: any[]): string => {
    if (!appointments.length) return 'empty';
    
    const relevantData = appointments
      .map(app => `${app.id}-${app.patientId}-${app.date}-${app.status}`)
      .sort()
      .join('|');
    
    // hash بسيط
    let hash = 0;
    for (let i = 0; i < relevantData.length; i++) {
      const char = relevantData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // تحويل إلى 32bit integer
    }
    return hash.toString();
  }, []);

  // حساب آخر زيارة مع التخزين المؤقت
  const getLastVisitCached = useCallback((
    patientId: number,
    appointments: any[]
  ): string | undefined => {
    const cache = lastVisitCacheRef.current;
    const now = Date.now();
    const appointmentsHash = calculateAppointmentsHash(appointments);

    // التحقق من وجود البيانات في التخزين المؤقت
    const cached = cache.get(patientId);
    if (cached && 
        now - cached.calculatedAt < maxAge && 
        cached.appointmentsHash === appointmentsHash) {
      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return cached.lastVisit;
    }

    // حساب آخر زيارة
    const completedAppointments = appointments
      .filter(app => app.patientId === patientId && app.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastVisit = completedAppointments.length > 0
      ? `${completedAppointments[0].date} - ${completedAppointments[0].time}`
      : undefined;

    // حفظ في التخزين المؤقت
    cache.set(patientId, {
      patientId,
      lastVisit,
      calculatedAt: now,
      appointmentsHash
    });

    // تنظيف التخزين إذا تجاوز الحد الأقصى
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    setCacheStats(prev => ({ 
      ...prev, 
      misses: prev.misses + 1,
      size: cache.size + generalCacheRef.current.size
    }));

    return lastVisit;
  }, [calculateAppointmentsHash, maxAge, maxSize]);

  // تخزين مؤقت عام للحسابات
  const getCached = useCallback(<T>(
    key: string,
    calculator: () => T
  ): T => {
    const cache = generalCacheRef.current;
    const now = Date.now();

    // التحقق من التخزين المؤقت
    const cached = cache.get(key);
    if (cached && now - cached.timestamp < maxAge) {
      setCacheStats(prev => ({ ...prev, hits: prev.hits + 1 }));
      return cached.data;
    }

    // حساب البيانات الجديدة
    const data = calculator();

    // حفظ في التخزين المؤقت
    cache.set(key, {
      data,
      timestamp: now
    });

    // تنظيف التخزين إذا تجاوز الحد الأقصى
    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    setCacheStats(prev => ({ 
      ...prev, 
      misses: prev.misses + 1,
      size: lastVisitCacheRef.current.size + cache.size
    }));

    return data;
  }, [maxAge, maxSize]);

  // مسح التخزين المؤقت
  const clearCache = useCallback(() => {
    lastVisitCacheRef.current.clear();
    generalCacheRef.current.clear();
    setCacheStats({ hits: 0, misses: 0, size: 0 });
  }, []);

  // مسح تخزين مريض معين
  const clearPatientCache = useCallback((patientId: number) => {
    lastVisitCacheRef.current.delete(patientId);
    setCacheStats(prev => ({
      ...prev,
      size: lastVisitCacheRef.current.size + generalCacheRef.current.size
    }));
  }, []);

  // حساب معدل نجاح التخزين المؤقت
  const cacheHitRate = useMemo(() => {
    const total = cacheStats.hits + cacheStats.misses;
    return total > 0 ? (cacheStats.hits / total) * 100 : 0;
  }, [cacheStats.hits, cacheStats.misses]);

  // تشغيل تنظيف دوري للتخزين المؤقت
  const startPeriodicCleanup = useCallback(() => {
    const interval = setInterval(cleanupCache, maxAge / 2);
    return () => clearInterval(interval);
  }, [cleanupCache, maxAge]);

  return {
    getLastVisitCached,
    getCached,
    clearCache,
    clearPatientCache,
    cleanupCache,
    startPeriodicCleanup,
    cacheStats: {
      ...cacheStats,
      hitRate: cacheHitRate
    }
  };
};
