// نظام تخزين آمن مع معالجة الأخطاء

import { safeSave, safeLoad, ErrorType, errorManager } from './errorHandling';

// نوع البيانات لإعدادات التخزين
interface StorageConfig {
  prefix?: string;
  compression?: boolean;
  encryption?: boolean;
  maxSize?: number; // بالبايت
  ttl?: number; // مدة الصلاحية بالميلي ثانية
}

// نوع البيانات للعنصر المحفوظ
interface StoredItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version: string;
}

// فئة التخزين الآمن
export class SafeStorage {
  private config: StorageConfig;
  private storage: Storage;
  private version = '1.0.0';

  constructor(storage: Storage = localStorage, config: StorageConfig = {}) {
    this.storage = storage;
    this.config = {
      prefix: 'dental_app_',
      compression: false,
      encryption: false,
      maxSize: 5 * 1024 * 1024, // 5MB
      ...config
    };
  }

  // إنشاء مفتاح مع البادئة
  private createKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  // حفظ البيانات بأمان
  async save<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const fullKey = this.createKey(key);
      const item: StoredItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.version
      };

      // التحقق من حجم البيانات
      const serializedData = JSON.stringify(item);
      if (this.config.maxSize && serializedData.length > this.config.maxSize) {
        errorManager.createError(
          ErrorType.STORAGE_ERROR,
          `البيانات كبيرة جداً: ${serializedData.length} bytes`,
          { key, dataSize: serializedData.length, maxSize: this.config.maxSize }
        );
        return false;
      }

      const result = await safeSave(fullKey, item, this.storage);
      return result.success;
    } catch (error) {
      errorManager.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'save' }
      );
      return false;
    }
  }

  // تحميل البيانات بأمان
  load<T>(key: string, defaultValue: T): T {
    try {
      const fullKey = this.createKey(key);
      const result = safeLoad<StoredItem<T>>(fullKey, null as any, this.storage);

      if (!result.success || !result.data) {
        return defaultValue;
      }

      const item = result.data;

      // التحقق من الإصدار
      if (item.version !== this.version) {
        console.warn(`Version mismatch for key ${key}: ${item.version} vs ${this.version}`);
        this.remove(key);
        return defaultValue;
      }

      // التحقق من انتهاء الصلاحية
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key);
        return defaultValue;
      }

      return item.data;
    } catch (error) {
      errorManager.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'load' }
      );
      return defaultValue;
    }
  }

  // إزالة البيانات
  remove(key: string): boolean {
    try {
      const fullKey = this.createKey(key);
      this.storage.removeItem(fullKey);
      return true;
    } catch (error) {
      errorManager.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'remove' }
      );
      return false;
    }
  }

  // التحقق من وجود المفتاح
  exists(key: string): boolean {
    try {
      const fullKey = this.createKey(key);
      return this.storage.getItem(fullKey) !== null;
    } catch (error) {
      return false;
    }
  }

  // مسح جميع البيانات مع البادئة
  clear(): boolean {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => this.storage.removeItem(key));
      return true;
    } catch (error) {
      errorManager.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { operation: 'clear' }
      );
      return false;
    }
  }

  // الحصول على حجم التخزين المستخدم
  getUsedSpace(): number {
    try {
      let totalSize = 0;
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          const value = this.storage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  // تنظيف البيانات المنتهية الصلاحية
  cleanup(): number {
    let cleanedCount = 0;
    
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          try {
            const value = this.storage.getItem(key);
            if (value) {
              const item: StoredItem<any> = JSON.parse(value);
              
              // التحقق من انتهاء الصلاحية
              if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                keysToRemove.push(key);
              }
              
              // التحقق من الإصدار
              if (item.version !== this.version) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // إزالة البيانات التالفة
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        this.storage.removeItem(key);
        cleanedCount++;
      });
    } catch (error) {
      errorManager.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { operation: 'cleanup' }
      );
    }

    return cleanedCount;
  }

  // الحصول على إحصائيات التخزين
  getStats(): {
    totalKeys: number;
    usedSpace: number;
    maxSpace: number;
    usagePercentage: number;
  } {
    const usedSpace = this.getUsedSpace();
    const maxSpace = this.config.maxSize || 5 * 1024 * 1024;
    
    let totalKeys = 0;
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix!)) {
          totalKeys++;
        }
      }
    } catch {
      totalKeys = 0;
    }

    return {
      totalKeys,
      usedSpace,
      maxSpace,
      usagePercentage: (usedSpace / maxSpace) * 100
    };
  }
}

// instances مشتركة
export const safeLocalStorage = new SafeStorage(localStorage, {
  prefix: 'dental_app_',
  maxSize: 10 * 1024 * 1024 // 10MB
});

export const safeSessionStorage = new SafeStorage(sessionStorage, {
  prefix: 'dental_session_',
  maxSize: 5 * 1024 * 1024 // 5MB
});

// دوال مساعدة للاستخدام السريع
export const saveToStorage = <T>(key: string, data: T, ttl?: number): Promise<boolean> => {
  return safeLocalStorage.save(key, data, ttl);
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  return safeLocalStorage.load(key, defaultValue);
};

export const removeFromStorage = (key: string): boolean => {
  return safeLocalStorage.remove(key);
};

export const clearStorage = (): boolean => {
  return safeLocalStorage.clear();
};

// تنظيف دوري للتخزين
export const setupStorageCleanup = (intervalMinutes: number = 60): () => void => {
  const cleanup = () => {
    const cleaned = safeLocalStorage.cleanup();
    if (process.env.NODE_ENV === 'development' && cleaned > 0) {
      console.log(`Storage cleanup: removed ${cleaned} expired items`);
    }
  };

  // تنظيف فوري
  cleanup();

  // تنظيف دوري
  const interval = setInterval(cleanup, intervalMinutes * 60 * 1000);

  // دالة إيقاف التنظيف
  return () => clearInterval(interval);
};
