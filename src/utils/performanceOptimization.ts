// نظام تحسين الأداء المتقدم

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// نوع البيانات لمراقبة الأداء
export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  componentName: string;
  isSlowComponent: boolean;
  memoryUsage?: number;
}

// نوع البيانات لإعدادات التحسين
export interface OptimizationConfig {
  enableRenderTracking: boolean;
  enableMemoization: boolean;
  enableLazyLoading: boolean;
  enableVirtualScrolling: boolean;
  slowRenderThreshold: number; // بالميلي ثانية
  maxRenderCount: number;
}

// الإعدادات الافتراضية للتحسين
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableRenderTracking: process.env.NODE_ENV === 'development', // فقط في التطوير
  enableMemoization: true,
  enableLazyLoading: true,
  enableVirtualScrolling: true,
  slowRenderThreshold: 16, // 60 FPS = 16ms per frame
  maxRenderCount: 1000
};

// فئة مراقب الأداء
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private config: OptimizationConfig = DEFAULT_OPTIMIZATION_CONFIG;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // تسجيل render جديد
  public recordRender(componentName: string, renderTime: number): void {
    if (!this.config.enableRenderTracking) return;

    const existing = this.metrics.get(componentName);
    
    if (existing) {
      const newRenderCount = existing.renderCount + 1;
      const newTotalTime = existing.totalRenderTime + renderTime;
      const newAverageTime = newTotalTime / newRenderCount;

      this.metrics.set(componentName, {
        ...existing,
        renderCount: newRenderCount,
        lastRenderTime: renderTime,
        averageRenderTime: newAverageTime,
        totalRenderTime: newTotalTime,
        isSlowComponent: newAverageTime > this.config.slowRenderThreshold
      });
    } else {
      this.metrics.set(componentName, {
        renderCount: 1,
        lastRenderTime: renderTime,
        averageRenderTime: renderTime,
        totalRenderTime: renderTime,
        componentName,
        isSlowComponent: renderTime > this.config.slowRenderThreshold
      });
    }

    // تحذير للمكونات البطيئة (فقط في التطوير)
    if (process.env.NODE_ENV === 'development' && renderTime > this.config.slowRenderThreshold) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
    }
  }

  // الحصول على إحصائيات المكون
  public getComponentMetrics(componentName: string): PerformanceMetrics | undefined {
    return this.metrics.get(componentName);
  }

  // الحصول على جميع الإحصائيات
  public getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // الحصول على أبطأ المكونات
  public getSlowestComponents(limit: number = 10): PerformanceMetrics[] {
    return this.getAllMetrics()
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, limit);
  }

  // مسح الإحصائيات
  public clearMetrics(): void {
    this.metrics.clear();
  }

  // تحديث الإعدادات
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// instance مشترك
export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook لمراقبة أداء المكون (معطل)
export const usePerformanceTracking = (componentName: string) => {
  const renderCount = useRef<number>(0);

  // تعطيل مراقبة الأداء - فقط عد الرندرات
  useEffect(() => {
    renderCount.current += 1;
  });

  return {
    renderCount: renderCount.current,
    getMetrics: () => undefined // لا توجد إحصائيات
  };
};

// Hook محسن للـ memoization
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList | undefined,
  debugName?: string
): T => {
  const memoStartTime = useRef<number>(0);
  
  return useMemo(() => {
    memoStartTime.current = performance.now();
    const result = factory();
    const memoTime = performance.now() - memoStartTime.current;
    
    if (process.env.NODE_ENV === 'development' && debugName && memoTime > 5) {
      console.warn(`Expensive memo calculation in ${debugName}: ${memoTime}ms`);
    }
    
    return result;
  }, deps);
};

// Hook محسن للـ callback
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  debugName?: string
): T => {
  const callbackStartTime = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    callbackStartTime.current = performance.now();
    const result = callback(...args);
    const callbackTime = performance.now() - callbackStartTime.current;
    
    if (process.env.NODE_ENV === 'development' && debugName && callbackTime > 10) {
      console.warn(`Slow callback execution in ${debugName}: ${callbackTime}ms`);
    }
    
    return result;
  }, deps) as T;
};

// Hook للـ debouncing المحسن
export const useOptimizedDebounce = <T>(
  value: T,
  delay: number,
  debugName?: string
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const startTime = performance.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      const debounceTime = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development' && debugName && debounceTime > delay + 5) {
        console.warn(`Debounce delay exceeded in ${debugName}: ${debounceTime}ms`);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, debugName]);

  return debouncedValue;
};

// Hook للـ throttling المحسن
export const useOptimizedThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  debugName?: string
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
        
        if (process.env.NODE_ENV === 'development' && debugName) {
          console.log(`Throttled execution in ${debugName}`);
        }
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay, debugName]) as T;
};

// Hook لتحسين القوائم الطويلة
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
};

// Hook لتحسين البحث
export const useOptimizedSearch = <T>(
  items: T[],
  searchTerm: string,
  searchFunction: (item: T, term: string) => boolean,
  debounceDelay: number = 300
) => {
  const debouncedSearchTerm = useOptimizedDebounce(searchTerm, debounceDelay, 'search');

  const filteredItems = useOptimizedMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    return items.filter(item => searchFunction(item, debouncedSearchTerm));
  }, [items, debouncedSearchTerm, searchFunction], 'search-filter');

  return {
    filteredItems,
    isSearching: searchTerm !== debouncedSearchTerm,
    searchTerm: debouncedSearchTerm
  };
};

// دالة لتحليل الأداء
export const analyzePerformance = () => {
  const metrics = performanceMonitor.getAllMetrics();
  const slowComponents = performanceMonitor.getSlowestComponents();

  return {
    totalComponents: metrics.length,
    slowComponents: slowComponents.length,
    averageRenderTime: metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / metrics.length,
    totalRenders: metrics.reduce((sum, m) => sum + m.renderCount, 0),
    recommendations: generatePerformanceRecommendations(slowComponents)
  };
};

// توليد توصيات الأداء
const generatePerformanceRecommendations = (slowComponents: PerformanceMetrics[]): string[] => {
  const recommendations: string[] = [];

  slowComponents.forEach(component => {
    if (component.averageRenderTime > 50) {
      recommendations.push(`Consider memoizing ${component.componentName} - avg render time: ${component.averageRenderTime.toFixed(2)}ms`);
    }

    if (component.renderCount > 100) {
      recommendations.push(`${component.componentName} renders frequently (${component.renderCount} times) - check dependencies`);
    }
  });

  return recommendations;
};
