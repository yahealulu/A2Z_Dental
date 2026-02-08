// نظام إدارة الذاكرة المتقدم للتطبيق

// إعدادات إدارة الذاكرة
export const MEMORY_LIMITS = {
  // الحد الأقصى لحجم الـ cache بالميجابايت
  MAX_CACHE_SIZE_MB: 50,
  
  // الحد الأقصى لعدد العناصر في كل نوع cache
  MAX_CACHE_ITEMS: {
    dailyRevenue: 100,
    monthlyStats: 50,
    categoryAggregation: 30,
    paginatedExpenses: 50,
    filteredExpenses: 30
  },
  
  // مدة صلاحية الـ cache بالدقائق
  CACHE_TTL_MINUTES: {
    short: 5,    // للبيانات المتغيرة بكثرة
    medium: 15,  // للبيانات المتوسطة
    long: 60     // للبيانات الثابتة نسبياً
  },
  
  // حد التحذير من استهلاك الذاكرة
  WARNING_THRESHOLD_MB: 30
};

// نوع البيانات لإحصائيات الذاكرة
export interface MemoryStats {
  totalCacheSize: number;
  totalItems: number;
  cacheBreakdown: Record<string, {
    size: number;
    items: number;
    lastAccess: number;
  }>;
  isOverLimit: boolean;
  warningLevel: 'low' | 'medium' | 'high';
}

// نوع البيانات لإعدادات التنظيف
export interface CleanupConfig {
  maxAge: number;
  maxItems: number;
  priority: 'lru' | 'fifo' | 'size'; // Least Recently Used, First In First Out, Size-based
}

// فئة إدارة الذاكرة
export class MemoryManager {
  private static instance: MemoryManager;
  private memoryUsage: Map<string, number> = new Map();
  private accessTimes: Map<string, number> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // بدء مراقبة الذاكرة كل دقيقة
    this.startMemoryMonitoring();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // تقدير حجم الكائن بالبايت
  private estimateObjectSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  // تسجيل استخدام الذاكرة
  public recordMemoryUsage(cacheKey: string, data: any): void {
    const size = this.estimateObjectSize(data);
    this.memoryUsage.set(cacheKey, size);
    this.accessTimes.set(cacheKey, Date.now());
  }

  // إزالة تسجيل الذاكرة
  public removeMemoryRecord(cacheKey: string): void {
    this.memoryUsage.delete(cacheKey);
    this.accessTimes.delete(cacheKey);
  }

  // الحصول على إحصائيات الذاكرة
  public getMemoryStats(): MemoryStats {
    const totalSize = Array.from(this.memoryUsage.values()).reduce((sum, size) => sum + size, 0);
    const totalSizeMB = totalSize / (1024 * 1024);
    const totalItems = this.memoryUsage.size;

    const cacheBreakdown: Record<string, any> = {};
    this.memoryUsage.forEach((size, key) => {
      const category = key.split('-')[0];
      if (!cacheBreakdown[category]) {
        cacheBreakdown[category] = { size: 0, items: 0, lastAccess: 0 };
      }
      cacheBreakdown[category].size += size;
      cacheBreakdown[category].items += 1;
      cacheBreakdown[category].lastAccess = Math.max(
        cacheBreakdown[category].lastAccess,
        this.accessTimes.get(key) || 0
      );
    });

    const isOverLimit = totalSizeMB > MEMORY_LIMITS.MAX_CACHE_SIZE_MB;
    let warningLevel: 'low' | 'medium' | 'high' = 'low';
    
    if (totalSizeMB > MEMORY_LIMITS.WARNING_THRESHOLD_MB) {
      warningLevel = 'medium';
    }
    if (totalSizeMB > MEMORY_LIMITS.MAX_CACHE_SIZE_MB * 0.9) {
      warningLevel = 'high';
    }

    return {
      totalCacheSize: totalSizeMB,
      totalItems,
      cacheBreakdown,
      isOverLimit,
      warningLevel
    };
  }

  // تنظيف الـ cache بناءً على الإعدادات
  public cleanupCache(
    cacheMap: Map<string, any>,
    cacheType: string,
    config: CleanupConfig
  ): number {
    const now = Date.now();
    let cleanedItems = 0;

    // تنظيف العناصر القديمة
    const expiredKeys: string[] = [];
    cacheMap.forEach((_, key) => {
      const fullKey = `${cacheType}-${key}`;
      const lastAccess = this.accessTimes.get(fullKey) || 0;
      const age = now - lastAccess;
      
      if (age > config.maxAge) {
        expiredKeys.push(key);
      }
    });

    // إزالة العناصر المنتهية الصلاحية
    expiredKeys.forEach(key => {
      cacheMap.delete(key);
      this.removeMemoryRecord(`${cacheType}-${key}`);
      cleanedItems++;
    });

    // تنظيف إضافي إذا تجاوز الحد الأقصى
    if (cacheMap.size > config.maxItems) {
      const entries = Array.from(cacheMap.entries());
      
      // ترتيب حسب الأولوية
      if (config.priority === 'lru') {
        entries.sort((a, b) => {
          const timeA = this.accessTimes.get(`${cacheType}-${a[0]}`) || 0;
          const timeB = this.accessTimes.get(`${cacheType}-${b[0]}`) || 0;
          return timeA - timeB;
        });
      } else if (config.priority === 'size') {
        entries.sort((a, b) => {
          const sizeA = this.memoryUsage.get(`${cacheType}-${a[0]}`) || 0;
          const sizeB = this.memoryUsage.get(`${cacheType}-${b[0]}`) || 0;
          return sizeB - sizeA;
        });
      }

      // إزالة العناصر الزائدة
      const itemsToRemove = cacheMap.size - config.maxItems;
      for (let i = 0; i < itemsToRemove; i++) {
        const [key] = entries[i];
        cacheMap.delete(key);
        this.removeMemoryRecord(`${cacheType}-${key}`);
        cleanedItems++;
      }
    }

    return cleanedItems;
  }

  // تنظيف شامل للذاكرة
  public performGlobalCleanup(): {
    totalCleaned: number;
    sizeBefore: number;
    sizeAfter: number;
  } {
    const statsBefore = this.getMemoryStats();
    let totalCleaned = 0;

    // تنظيف العناصر القديمة جداً
    const now = Date.now();
    const oldKeys: string[] = [];
    
    this.accessTimes.forEach((time, key) => {
      const age = now - time;
      const maxAge = MEMORY_LIMITS.CACHE_TTL_MINUTES.long * 60 * 1000;
      
      if (age > maxAge) {
        oldKeys.push(key);
      }
    });

    oldKeys.forEach(key => {
      this.removeMemoryRecord(key);
      totalCleaned++;
    });

    const statsAfter = this.getMemoryStats();

    return {
      totalCleaned,
      sizeBefore: statsBefore.totalCacheSize,
      sizeAfter: statsAfter.totalCacheSize
    };
  }

  // بدء مراقبة الذاكرة الذكية
  private startMemoryMonitoring(): void {
    let lastActivity = Date.now();
    let monitoringInterval: NodeJS.Timeout | null = null;

    // مراقبة النشاط
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => {
      lastActivity = Date.now();

      // بدء المراقبة إذا لم تكن نشطة
      if (!monitoringInterval) {
        this.startActiveMonitoring();
      }
    };

    // إضافة مستمعي الأحداث
    if (typeof window !== 'undefined') {
      activityEvents.forEach(event => {
        window.addEventListener(event, updateActivity, { passive: true });
      });
    }

    // فحص دوري للنشاط
    const checkActivity = () => {
      const timeSinceActivity = Date.now() - lastActivity;

      // إيقاف المراقبة إذا لم يكن هناك نشاط لأكثر من 5 دقائق
      if (timeSinceActivity > 5 * 60 * 1000 && monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
    };

    // فحص النشاط كل دقيقة
    setInterval(checkActivity, 60000);
  }

  // مراقبة نشطة للذاكرة
  private startActiveMonitoring(): void {
    setInterval(() => {
      const stats = this.getMemoryStats();

      // تنظيف تلقائي إذا تجاوز الحد
      if (stats.isOverLimit) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Memory limit exceeded, performing cleanup...');
        }
        this.performGlobalCleanup();
      }

      // تحذير إذا اقترب من الحد (فقط في التطوير)
      if (process.env.NODE_ENV === 'development' && stats.warningLevel === 'high') {
        console.warn(`Memory usage high: ${stats.totalCacheSize.toFixed(2)}MB`);
      }
    }, 30000); // كل 30 ثانية أثناء النشاط
  }

  // جدولة تنظيف دوري لنوع cache معين
  public schedulePeriodicCleanup(
    cacheType: string,
    intervalMinutes: number,
    cleanupFn: () => void
  ): void {
    // إلغاء المؤقت السابق إن وجد
    const existingTimer = this.cleanupTimers.get(cacheType);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // إنشاء مؤقت جديد
    const timer = setInterval(cleanupFn, intervalMinutes * 60 * 1000);
    this.cleanupTimers.set(cacheType, timer);
  }

  // إيقاف جميع المؤقتات
  public stopAllCleanupTimers(): void {
    this.cleanupTimers.forEach(timer => clearInterval(timer));
    this.cleanupTimers.clear();
  }

  // تحديث وقت الوصول للعنصر
  public updateAccessTime(cacheKey: string): void {
    this.accessTimes.set(cacheKey, Date.now());
  }

  // التحقق من حاجة العنصر للتنظيف
  public shouldCleanupItem(cacheKey: string, maxAge: number): boolean {
    const lastAccess = this.accessTimes.get(cacheKey) || 0;
    const age = Date.now() - lastAccess;
    return age > maxAge;
  }
}

// إنشاء instance مشترك
export const memoryManager = MemoryManager.getInstance();

// دوال مساعدة
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isMemoryPressure = (): boolean => {
  const stats = memoryManager.getMemoryStats();
  return stats.warningLevel === 'high' || stats.isOverLimit;
};
