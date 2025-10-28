/**
 * تحسينات الإنتاج للأداء مع Electron + SQLite
 * هذا الملف يحتوي على جميع التحسينات المطلوبة للأداء الأمثل
 */

// إزالة جميع console statements في الإنتاج
export const isDevelopment = process.env.NODE_ENV === 'development';

// دالة آمنة للـ console في الإنتاج
export const safeConsole = {
  log: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (isDevelopment) console.error(...args);
  },
  info: (...args: any[]) => {
    if (isDevelopment) console.info(...args);
  },
  debug: (...args: any[]) => {
    if (isDevelopment) console.debug(...args);
  }
};

// تحسينات الذاكرة للإنتاج
export const PRODUCTION_MEMORY_CONFIG = {
  // تقليل حجم الـ cache
  maxCacheSize: isDevelopment ? 100 : 50, // MB
  // تقليل عدد العناصر المحفوظة
  maxCacheItems: isDevelopment ? 10000 : 5000,
  // تنظيف أكثر تكراراً في الإنتاج
  cleanupInterval: isDevelopment ? 60000 : 30000, // ms
  // حد أقل للذاكرة في الإنتاج
  memoryWarningThreshold: isDevelopment ? 80 : 60, // MB
  // تنظيف أكثر عدوانية في الإنتاج
  aggressiveCleanup: !isDevelopment
};

// تحسينات الأداء للإنتاج
export const PRODUCTION_PERFORMANCE_CONFIG = {
  // تعطيل مراقبة الأداء في الإنتاج
  enablePerformanceMonitoring: isDevelopment,
  // تعطيل مراقبة الذاكرة في الإنتاج
  enableMemoryMonitoring: isDevelopment,
  // تقليل عدد العناصر في القوائم الافتراضية
  virtualListItemHeight: 50,
  virtualListOverscan: isDevelopment ? 10 : 5,
  // تحسين debounce للبحث
  searchDebounceDelay: isDevelopment ? 300 : 150,
  // تحسين throttle للتمرير
  scrollThrottleDelay: isDevelopment ? 16 : 8
};

// تحسينات قاعدة البيانات للإنتاج
export const PRODUCTION_DATABASE_CONFIG = {
  // حجم الدفعات للعمليات الكبيرة
  batchSize: isDevelopment ? 100 : 500,
  // timeout للاستعلامات
  queryTimeout: isDevelopment ? 10000 : 5000, // ms
  // تحسين الفهرسة
  enableIndexOptimization: !isDevelopment,
  // ضغط البيانات
  enableCompression: !isDevelopment,
  // تنظيف قاعدة البيانات
  enableVacuum: !isDevelopment
};

// دالة تحسين الأداء العامة
export const optimizeForProduction = () => {
  if (!isDevelopment) {
    // تعطيل DevTools
    if (typeof window !== 'undefined') {
      // منع فتح DevTools
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        isDisabled: true,
        supportsFiber: true,
        inject: () => {},
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {}
      };
    }

    // تحسين garbage collection
    if (typeof global !== 'undefined' && global.gc) {
      // تشغيل garbage collection كل 5 دقائق
      const gcInterval = setInterval(() => {
        global.gc();
      }, 5 * 60 * 1000);

      // تنظيف عند إغلاق التطبيق
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          clearInterval(gcInterval);
        });
      }
    }

    // تحسين الذاكرة
    optimizeMemoryUsage();
  }
};

// تحسين استخدام الذاكرة
const optimizeMemoryUsage = () => {
  // تنظيف الـ cache بشكل دوري
  const cleanupInterval = setInterval(() => {
    // تنظيف localStorage
    cleanupLocalStorage();

    // تنظيف الذاكرة المؤقتة
    cleanupMemoryCache();

    // تنظيف Event Listeners غير المستخدمة
    cleanupEventListeners();
  }, PRODUCTION_MEMORY_CONFIG.cleanupInterval);

  // تنظيف عند إغلاق التطبيق
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval);
    });
  }

  return cleanupInterval;
};

// تنظيف localStorage
const cleanupLocalStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          // حذف العناصر المنتهية الصلاحية
          if (parsed.expiry && Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // حذف العناصر التالفة
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    safeConsole.error('Error cleaning localStorage:', e);
  }
};

// تنظيف الذاكرة المؤقتة
const cleanupMemoryCache = () => {
  // تنظيف الـ cache العام
  if (typeof window !== 'undefined' && (window as any).memoryManager) {
    (window as any).memoryManager.performGlobalCleanup();
  }
};

// تنظيف Event Listeners
const cleanupEventListeners = () => {
  // إزالة event listeners غير المستخدمة
  if (typeof window !== 'undefined') {
    // تنظيف resize listeners
    const resizeEvents = (window as any)._resizeListeners || [];
    if (resizeEvents.length > 10) {
      resizeEvents.splice(0, resizeEvents.length - 5);
    }
    
    // تنظيف scroll listeners
    const scrollEvents = (window as any)._scrollListeners || [];
    if (scrollEvents.length > 10) {
      scrollEvents.splice(0, scrollEvents.length - 5);
    }
  }
};

// تحسينات خاصة بـ Electron
export const ELECTRON_OPTIMIZATIONS = {
  // تحسين استهلاك الذاكرة
  memoryOptimization: {
    // تقليل عدد العمليات المتوازية
    maxConcurrentOperations: 3,
    // تحسين حجم النوافذ
    windowMemoryLimit: 512, // MB
    // تحسين الـ cache
    diskCacheSize: 100 // MB
  },
  
  // تحسين الأداء
  performanceOptimization: {
    // تحسين الرسم
    enableHardwareAcceleration: true,
    // تحسين الشبكة
    enableNetworkOptimization: true,
    // تحسين الملفات
    enableFileSystemCache: true
  }
};

// تحسينات خاصة بـ SQLite
export const SQLITE_OPTIMIZATIONS = {
  // إعدادات الأداء
  pragmas: {
    journal_mode: 'WAL', // Write-Ahead Logging للأداء الأفضل
    synchronous: 'NORMAL', // توازن بين الأداء والأمان
    cache_size: 10000, // حجم الـ cache
    temp_store: 'MEMORY', // تخزين مؤقت في الذاكرة
    mmap_size: 268435456, // 256MB memory mapping
    optimize: true // تحسين تلقائي
  },
  
  // تحسين الاستعلامات
  queryOptimization: {
    enablePreparedStatements: true,
    enableQueryPlanning: true,
    enableIndexHints: true,
    batchInserts: true
  }
};

// دالة التهيئة الرئيسية
export const initializeProductionOptimizations = () => {
  safeConsole.log('🚀 Initializing production optimizations...');
  
  // تطبيق التحسينات العامة
  optimizeForProduction();
  
  // تطبيق تحسينات الذاكرة
  if (typeof window !== 'undefined') {
    (window as any).PRODUCTION_CONFIG = {
      memory: PRODUCTION_MEMORY_CONFIG,
      performance: PRODUCTION_PERFORMANCE_CONFIG,
      database: PRODUCTION_DATABASE_CONFIG
    };
  }
  
  safeConsole.log('✅ Production optimizations initialized successfully');
};

// تصدير التكوينات
export {
  PRODUCTION_MEMORY_CONFIG as memoryConfig,
  PRODUCTION_PERFORMANCE_CONFIG as performanceConfig,
  PRODUCTION_DATABASE_CONFIG as databaseConfig
};
