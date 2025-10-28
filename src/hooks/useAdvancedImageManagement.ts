import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedXRayStore } from '../store/optimizedXrayStore';

// إعدادات إدارة الذاكرة
interface MemoryManagementConfig {
  maxCacheSize: number; // عدد الصور في الذاكرة
  maxMemoryUsage: number; // بالميجابايت
  preloadDistance: number; // عدد الصور للتحميل المسبق
  cleanupInterval: number; // فترة التنظيف بالمللي ثانية
  lowMemoryThreshold: number; // حد الذاكرة المنخفضة
}

const DEFAULT_CONFIG: MemoryManagementConfig = {
  maxCacheSize: 50,
  maxMemoryUsage: 100, // 100 MB
  preloadDistance: 3,
  cleanupInterval: 30000, // 30 ثانية
  lowMemoryThreshold: 80 // 80 MB
};

// Hook لإدارة الذاكرة المتقدمة
export const useAdvancedImageManagement = (config: Partial<MemoryManagementConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { getCacheStats, cleanupCache, preloadImages } = useOptimizedXRayStore();
  
  const [memoryStats, setMemoryStats] = useState({ size: 0, memoryUsage: 0 });
  const [isLowMemory, setIsLowMemory] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageLoadTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    cacheHits: 0
  });
  
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();
  const loadTimeTracker = useRef<Map<string, number>>(new Map());
  const requestCounter = useRef(0);
  const cacheHitCounter = useRef(0);

  // مراقبة حالة الذاكرة
  const updateMemoryStats = useCallback(() => {
    const stats = getCacheStats();
    setMemoryStats(stats);
    setIsLowMemory(stats.memoryUsage > finalConfig.lowMemoryThreshold);
  }, [getCacheStats, finalConfig.lowMemoryThreshold]);

  // تنظيف ذكي للذاكرة
  const smartCleanup = useCallback(() => {
    const stats = getCacheStats();
    
    if (stats.size > finalConfig.maxCacheSize || stats.memoryUsage > finalConfig.maxMemoryUsage) {
      cleanupCache();
      updateMemoryStats();
    }
  }, [getCacheStats, cleanupCache, finalConfig.maxCacheSize, finalConfig.maxMemoryUsage, updateMemoryStats]);

  // تحميل مسبق ذكي
  const smartPreload = useCallback(async (currentImageIds: string[], currentIndex: number) => {
    try {
      const preloadIds: string[] = [];
      
      // تحميل الصور التالية
      for (let i = 1; i <= finalConfig.preloadDistance; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < currentImageIds.length) {
          preloadIds.push(currentImageIds[nextIndex]);
        }
      }
      
      // تحميل الصور السابقة (أقل أولوية)
      for (let i = 1; i <= Math.floor(finalConfig.preloadDistance / 2); i++) {
        const prevIndex = currentIndex - i;
        if (prevIndex >= 0) {
          preloadIds.push(currentImageIds[prevIndex]);
        }
      }
      
      if (preloadIds.length > 0) {
        await preloadImages(preloadIds);
      }
    } catch (error) {
      console.warn('خطأ في التحميل المسبق:', error);
    }
  }, [preloadImages, finalConfig.preloadDistance]);

  // تتبع أداء التحميل
  const trackLoadStart = useCallback((imageId: string) => {
    loadTimeTracker.current.set(imageId, Date.now());
    requestCounter.current++;
  }, []);

  const trackLoadEnd = useCallback((imageId: string, fromCache: boolean = false) => {
    const startTime = loadTimeTracker.current.get(imageId);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      loadTimeTracker.current.delete(imageId);
      
      if (fromCache) {
        cacheHitCounter.current++;
      }
      
      // تحديث متوسط وقت التحميل
      setPerformanceMetrics(prev => ({
        ...prev,
        averageLoadTime: (prev.averageLoadTime * (requestCounter.current - 1) + loadTime) / requestCounter.current,
        cacheHitRate: (cacheHitCounter.current / requestCounter.current) * 100,
        totalRequests: requestCounter.current,
        cacheHits: cacheHitCounter.current
      }));
    }
  }, []);

  // مراقبة استخدام الذاكرة في المتصفح
  const getSystemMemoryInfo = useCallback(async () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        usedJSHeapSize: memInfo.usedJSHeapSize / 1024 / 1024, // MB
        totalJSHeapSize: memInfo.totalJSHeapSize / 1024 / 1024, // MB
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit / 1024 / 1024 // MB
      };
    }
    return null;
  }, []);

  // تحسين تلقائي للأداء
  const autoOptimize = useCallback(async () => {
    const systemMemory = await getSystemMemoryInfo();
    const cacheStats = getCacheStats();
    
    // إذا كانت الذاكرة منخفضة، قم بتنظيف أكثر عدوانية
    if (systemMemory && systemMemory.usedJSHeapSize > systemMemory.jsHeapSizeLimit * 0.8) {
      cleanupCache();
      setIsLowMemory(true);
    }
    
    // تقليل حجم الذاكرة المؤقتة إذا كان الأداء بطيئاً
    if (performanceMetrics.averageLoadTime > 2000) { // أكثر من ثانيتين
      finalConfig.maxCacheSize = Math.max(10, finalConfig.maxCacheSize * 0.8);
    }
  }, [getSystemMemoryInfo, getCacheStats, cleanupCache, performanceMetrics.averageLoadTime, finalConfig]);

  // إعداد التنظيف الدوري
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      smartCleanup();
      autoOptimize();
      updateMemoryStats();
    }, finalConfig.cleanupInterval);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [smartCleanup, autoOptimize, updateMemoryStats, finalConfig.cleanupInterval]);

  // تحديث الإحصائيات عند التحميل
  useEffect(() => {
    updateMemoryStats();
  }, [updateMemoryStats]);

  return {
    // إحصائيات الذاكرة
    memoryStats,
    isLowMemory,
    performanceMetrics,
    
    // دوال الإدارة
    smartCleanup,
    smartPreload,
    autoOptimize,
    
    // تتبع الأداء
    trackLoadStart,
    trackLoadEnd,
    
    // معلومات النظام
    getSystemMemoryInfo,
    
    // إعدادات قابلة للتعديل
    config: finalConfig
  };
};

// Hook لمراقبة أداء الصور
export const useImagePerformanceMonitor = () => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [loadTimes, setLoadTimes] = useState<Map<string, number>>(new Map());
  
  const startLoading = useCallback((imageId: string) => {
    setLoadingImages(prev => new Set(prev).add(imageId));
    setLoadTimes(prev => new Map(prev).set(imageId, Date.now()));
  }, []);
  
  const finishLoading = useCallback((imageId: string, success: boolean = true) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    
    if (!success) {
      setFailedImages(prev => new Set(prev).add(imageId));
    } else {
      setFailedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
    
    const startTime = loadTimes.get(imageId);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`تحميل الصورة ${imageId}: ${duration}ms`);
    }
  }, [loadTimes]);
  
  const retryFailedImage = useCallback((imageId: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
  }, []);
  
  const getImageStatus = useCallback((imageId: string) => {
    if (loadingImages.has(imageId)) return 'loading';
    if (failedImages.has(imageId)) return 'failed';
    return 'loaded';
  }, [loadingImages, failedImages]);
  
  return {
    loadingImages,
    failedImages,
    startLoading,
    finishLoading,
    retryFailedImage,
    getImageStatus,
    stats: {
      loading: loadingImages.size,
      failed: failedImages.size
    }
  };
};

// Hook للتحكم في جودة الصور حسب الاتصال
export const useAdaptiveImageQuality = () => {
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  // مراقبة سرعة الاتصال
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case 'slow-2g':
          case '2g':
            setConnectionSpeed('slow');
            setImageQuality('low');
            break;
          case '3g':
            setConnectionSpeed('medium');
            setImageQuality('medium');
            break;
          case '4g':
          default:
            setConnectionSpeed('fast');
            setImageQuality('high');
            break;
        }
      };
      
      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);
  
  const getOptimalImageSettings = useCallback(() => {
    switch (imageQuality) {
      case 'low':
        return { maxWidth: 400, maxHeight: 300, quality: 0.6 };
      case 'medium':
        return { maxWidth: 800, maxHeight: 600, quality: 0.8 };
      case 'high':
        return { maxWidth: 1200, maxHeight: 900, quality: 0.9 };
      default:
        return { maxWidth: 800, maxHeight: 600, quality: 0.8 };
    }
  }, [imageQuality]);
  
  return {
    connectionSpeed,
    imageQuality,
    setImageQuality,
    getOptimalImageSettings
  };
};
