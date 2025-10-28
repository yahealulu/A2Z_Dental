import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// إعدادات إدارة الذاكرة
interface MemoryConfig {
  maxCacheSize: number; // عدد الصور في الذاكرة
  cleanupInterval: number; // فترة التنظيف بالمللي ثانية
  maxMemoryUsage: number; // تقدير الحد الأقصى بالميجابايت
}

const DEFAULT_CONFIG: MemoryConfig = {
  maxCacheSize: 30,
  cleanupInterval: 60000, // دقيقة واحدة
  maxMemoryUsage: 50 // 50 MB
};

// Hook لإدارة ذاكرة الصور
export const useImageMemoryManager = (config: Partial<MemoryConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [imageCache, setImageCache] = useState<Map<string, {
    url: string;
    lastAccessed: number;
    size: number; // تقدير حجم الصورة
  }>>(new Map());
  
  const [memoryStats, setMemoryStats] = useState({
    totalImages: 0,
    estimatedMemory: 0,
    lastCleanup: Date.now()
  });
  
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();

  // تقدير حجم الصورة من Base64
  const estimateImageSize = useCallback((dataUrl: string): number => {
    // Base64 يأخذ حوالي 4/3 من الحجم الأصلي
    const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
    return (base64Length * 3) / 4 / 1024 / 1024; // بالميجابايت
  }, []);

  // إضافة صورة للذاكرة المؤقتة
  const addToCache = useCallback((key: string, url: string) => {
    const size = estimateImageSize(url);
    
    setImageCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, {
        url,
        lastAccessed: Date.now(),
        size
      });
      return newCache;
    });
  }, [estimateImageSize]);

  // الحصول على صورة من الذاكرة المؤقتة
  const getFromCache = useCallback((key: string): string | null => {
    const cached = imageCache.get(key);
    if (cached) {
      // تحديث وقت الوصول
      setImageCache(prev => {
        const newCache = new Map(prev);
        newCache.set(key, {
          ...cached,
          lastAccessed: Date.now()
        });
        return newCache;
      });
      return cached.url;
    }
    return null;
  }, [imageCache]);

  // تنظيف الذاكرة المؤقتة
  const cleanupCache = useCallback(() => {
    setImageCache(prev => {
      const entries = Array.from(prev.entries());
      
      // ترتيب حسب آخر وصول (الأقدم أولاً)
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const newCache = new Map();
      let totalSize = 0;
      let count = 0;
      
      // الاحتفاظ بالصور الأحدث ضمن الحدود
      for (let i = entries.length - 1; i >= 0; i--) {
        const [key, value] = entries[i];
        
        if (count < finalConfig.maxCacheSize && totalSize + value.size < finalConfig.maxMemoryUsage) {
          newCache.set(key, value);
          totalSize += value.size;
          count++;
        } else {
          // تنظيف Object URLs للصور المحذوفة
          if (value.url.startsWith('blob:')) {
            URL.revokeObjectURL(value.url);
          }
        }
      }
      
      return newCache;
    });
    
    setMemoryStats(prev => ({
      ...prev,
      lastCleanup: Date.now()
    }));
  }, [finalConfig.maxCacheSize, finalConfig.maxMemoryUsage]);

  // تحديث إحصائيات الذاكرة
  const updateStats = useCallback(() => {
    setMemoryStats(prev => {
      const totalImages = imageCache.size;
      const estimatedMemory = Array.from(imageCache.values())
        .reduce((total, item) => total + item.size, 0);

      return {
        ...prev,
        totalImages,
        estimatedMemory
      };
    });
  }, [imageCache]);

  // تنظيف دوري
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      cleanupCache();
    }, finalConfig.cleanupInterval);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanupCache, finalConfig.cleanupInterval]);

  // تحديث الإحصائيات عند تغيير الذاكرة المؤقتة
  useEffect(() => {
    updateStats();
  }, [imageCache, updateStats]);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      // تنظيف جميع Object URLs
      imageCache.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  // تنظيف فوري
  const forceCleanup = useCallback(() => {
    cleanupCache();
  }, [cleanupCache]);

  // مسح الذاكرة المؤقتة بالكامل
  const clearCache = useCallback(() => {
    setImageCache(prev => {
      prev.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
      return new Map();
    });
  }, []);

  // فحص ما إذا كانت الذاكرة ممتلئة
  const isMemoryFull = useMemo(() => {
    return imageCache.size >= finalConfig.maxCacheSize ||
           memoryStats.estimatedMemory >= finalConfig.maxMemoryUsage;
  }, [imageCache.size, memoryStats.estimatedMemory, finalConfig.maxCacheSize, finalConfig.maxMemoryUsage]);

  return {
    // دوال إدارة الذاكرة المؤقتة
    addToCache,
    getFromCache,
    cleanupCache: forceCleanup,
    clearCache,
    
    // معلومات الحالة
    memoryStats,
    isMemoryFull,
    cacheSize: imageCache.size,
    
    // إعدادات
    config: finalConfig
  };
};

// Hook لمراقبة أداء تحميل الصور
export const useImagePerformanceTracker = () => {
  const [loadingStats, setLoadingStats] = useState({
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0,
    lastLoadTime: 0
  });
  
  const loadStartTimes = useRef<Map<string, number>>(new Map());

  const startLoad = useCallback((imageId: string) => {
    loadStartTimes.current.set(imageId, Date.now());
  }, []);

  const endLoad = useCallback((imageId: string, success: boolean = true) => {
    const startTime = loadStartTimes.current.get(imageId);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      loadStartTimes.current.delete(imageId);
      
      setLoadingStats(prev => {
        const newTotalLoads = prev.totalLoads + 1;
        const newSuccessfulLoads = success ? prev.successfulLoads + 1 : prev.successfulLoads;
        const newFailedLoads = success ? prev.failedLoads : prev.failedLoads + 1;
        const newAverageLoadTime = (prev.averageLoadTime * prev.totalLoads + loadTime) / newTotalLoads;
        
        return {
          totalLoads: newTotalLoads,
          successfulLoads: newSuccessfulLoads,
          failedLoads: newFailedLoads,
          averageLoadTime: newAverageLoadTime,
          lastLoadTime: loadTime
        };
      });
    }
  }, []);

  const resetStats = useCallback(() => {
    setLoadingStats({
      totalLoads: 0,
      successfulLoads: 0,
      failedLoads: 0,
      averageLoadTime: 0,
      lastLoadTime: 0
    });
    loadStartTimes.current.clear();
  }, []);

  const getSuccessRate = useCallback(() => {
    if (loadingStats.totalLoads === 0) return 0;
    return (loadingStats.successfulLoads / loadingStats.totalLoads) * 100;
  }, [loadingStats]);

  return {
    loadingStats,
    startLoad,
    endLoad,
    resetStats,
    successRate: getSuccessRate()
  };
};

// Hook للتحكم في جودة الصور حسب الأداء
export const useAdaptiveImageQuality = () => {
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoAdjust, setAutoAdjust] = useState(true);
  const { loadingStats } = useImagePerformanceTracker();

  // تعديل الجودة تلقائياً حسب الأداء
  useEffect(() => {
    if (!autoAdjust) return;

    const { averageLoadTime, totalLoads } = loadingStats;
    
    // إذا كان لدينا بيانات كافية
    if (totalLoads >= 5) {
      if (averageLoadTime > 3000) { // أكثر من 3 ثوانٍ
        setImageQuality('low');
      } else if (averageLoadTime > 1500) { // أكثر من 1.5 ثانية
        setImageQuality('medium');
      } else {
        setImageQuality('high');
      }
    }
  }, [loadingStats, autoAdjust]);

  const getQualitySettings = useCallback(() => {
    switch (imageQuality) {
      case 'low':
        return { 
          thumbnailSize: 150, 
          thumbnailQuality: 0.5,
          compressionQuality: 0.6 
        };
      case 'medium':
        return { 
          thumbnailSize: 200, 
          thumbnailQuality: 0.7,
          compressionQuality: 0.8 
        };
      case 'high':
        return { 
          thumbnailSize: 250, 
          thumbnailQuality: 0.8,
          compressionQuality: 0.9 
        };
      default:
        return { 
          thumbnailSize: 200, 
          thumbnailQuality: 0.7,
          compressionQuality: 0.8 
        };
    }
  }, [imageQuality]);

  return {
    imageQuality,
    setImageQuality,
    autoAdjust,
    setAutoAdjust,
    qualitySettings: getQualitySettings()
  };
};
