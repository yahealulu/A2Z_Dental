/**
 * تحسينات Timer للأداء مع Electron + SQLite
 * هذا الملف يحتوي على بدائل محسنة للـ setTimeout و setInterval
 */

import React from 'react';
import { safeConsole } from './productionOptimizations';

// مدير Timer محسن
class TimerManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private rafCallbacks: Map<string, number> = new Map();
  
  // setTimeout محسن مع إدارة الذاكرة
  public optimizedTimeout(
    callback: () => void,
    delay: number,
    id?: string
  ): string {
    const timerId = id || `timeout_${Date.now()}_${Math.random()}`;
    
    // إلغاء Timer السابق إذا وجد
    this.clearOptimizedTimeout(timerId);
    
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timerId);
    }, delay);
    
    this.timers.set(timerId, timer);
    return timerId;
  }
  
  // setInterval محسن مع مراقبة النشاط
  public optimizedInterval(
    callback: () => void,
    delay: number,
    options: {
      id?: string;
      pauseOnInactive?: boolean;
      maxExecutions?: number;
    } = {}
  ): string {
    const intervalId = options.id || `interval_${Date.now()}_${Math.random()}`;
    let executionCount = 0;
    
    // إلغاء Interval السابق إذا وجد
    this.clearOptimizedInterval(intervalId);
    
    const executeCallback = () => {
      // التحقق من النشاط إذا كان مطلوباً
      if (options.pauseOnInactive && this.isPageInactive()) {
        return;
      }
      
      // التحقق من الحد الأقصى للتنفيذ
      if (options.maxExecutions && executionCount >= options.maxExecutions) {
        this.clearOptimizedInterval(intervalId);
        return;
      }
      
      callback();
      executionCount++;
    };
    
    const interval = setInterval(executeCallback, delay);
    this.intervals.set(intervalId, interval);
    
    return intervalId;
  }
  
  // requestAnimationFrame محسن
  public optimizedAnimationFrame(
    callback: () => void,
    id?: string
  ): string {
    const rafId = id || `raf_${Date.now()}_${Math.random()}`;
    
    // إلغاء RAF السابق إذا وجد
    this.clearOptimizedAnimationFrame(rafId);
    
    const frameId = requestAnimationFrame(() => {
      callback();
      this.rafCallbacks.delete(rafId);
    });
    
    this.rafCallbacks.set(rafId, frameId);
    return rafId;
  }
  
  // إلغاء timeout محسن
  public clearOptimizedTimeout(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
  
  // إلغاء interval محسن
  public clearOptimizedInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }
  
  // إلغاء animation frame محسن
  public clearOptimizedAnimationFrame(id: string): void {
    const frameId = this.rafCallbacks.get(id);
    if (frameId) {
      cancelAnimationFrame(frameId);
      this.rafCallbacks.delete(id);
    }
  }
  
  // إلغاء جميع Timers
  public clearAllTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.intervals.forEach(interval => clearInterval(interval));
    this.rafCallbacks.forEach(frameId => cancelAnimationFrame(frameId));
    
    this.timers.clear();
    this.intervals.clear();
    this.rafCallbacks.clear();
  }
  
  // التحقق من حالة النشاط
  private isPageInactive(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }
  
  // إحصائيات Timer
  public getTimerStats(): {
    activeTimeouts: number;
    activeIntervals: number;
    activeAnimationFrames: number;
  } {
    return {
      activeTimeouts: this.timers.size,
      activeIntervals: this.intervals.size,
      activeAnimationFrames: this.rafCallbacks.size
    };
  }
}

// إنشاء مثيل مدير Timer
export const timerManager = new TimerManager();

// Hook محسن للـ setTimeout
export const useOptimizedTimeout = (
  callback: () => void,
  delay: number | null,
  deps: React.DependencyList = []
) => {
  const callbackRef = React.useRef(callback);
  const timeoutRef = React.useRef<string | null>(null);
  
  // تحديث callback
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  
  React.useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = timerManager.optimizedTimeout(
        () => callbackRef.current(),
        delay
      );
    }
    
    return () => {
      if (timeoutRef.current) {
        timerManager.clearOptimizedTimeout(timeoutRef.current);
      }
    };
  }, [delay, ...deps]);
  
  // دالة إلغاء يدوية
  const cancel = React.useCallback(() => {
    if (timeoutRef.current) {
      timerManager.clearOptimizedTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  return cancel;
};

// Hook محسن للـ setInterval
export const useOptimizedInterval = (
  callback: () => void,
  delay: number | null,
  options: {
    pauseOnInactive?: boolean;
    maxExecutions?: number;
  } = {}
) => {
  const callbackRef = React.useRef(callback);
  const intervalRef = React.useRef<string | null>(null);
  
  // تحديث callback
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  
  React.useEffect(() => {
    if (delay !== null) {
      intervalRef.current = timerManager.optimizedInterval(
        () => callbackRef.current(),
        delay,
        options
      );
    }
    
    return () => {
      if (intervalRef.current) {
        timerManager.clearOptimizedInterval(intervalRef.current);
      }
    };
  }, [delay, options.pauseOnInactive, options.maxExecutions]);
  
  // دالة إلغاء يدوية
  const cancel = React.useCallback(() => {
    if (intervalRef.current) {
      timerManager.clearOptimizedInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  return cancel;
};

// Hook محسن للـ requestAnimationFrame
export const useOptimizedAnimationFrame = (
  callback: () => void,
  deps: React.DependencyList = []
) => {
  const callbackRef = React.useRef(callback);
  const rafRef = React.useRef<string | null>(null);
  
  // تحديث callback
  React.useEffect(() => {
    callbackRef.current = callback;
  });
  
  React.useEffect(() => {
    rafRef.current = timerManager.optimizedAnimationFrame(
      () => callbackRef.current()
    );
    
    return () => {
      if (rafRef.current) {
        timerManager.clearOptimizedAnimationFrame(rafRef.current);
      }
    };
  }, deps);
  
  // دالة إلغاء يدوية
  const cancel = React.useCallback(() => {
    if (rafRef.current) {
      timerManager.clearOptimizedAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);
  
  return cancel;
};

// دالة تنظيف شاملة للـ Timers
export const cleanupAllTimers = () => {
  timerManager.clearAllTimers();
  safeConsole.log('🧹 All timers cleaned up');
};

// مراقب Timer للتطوير
export const logTimerStats = () => {
  if (process.env.NODE_ENV === 'development') {
    const stats = timerManager.getTimerStats();
    safeConsole.log('⏱️ Timer Stats:', stats);
  }
};

// تصدير مدير Timer للاستخدام المباشر
export { timerManager as default };
