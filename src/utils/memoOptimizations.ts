/**
 * تحسينات React.memo للأداء مع Electron + SQLite
 * هذا الملف يحتوي على دوال مساعدة لتحسين React.memo
 */

import React from 'react';
import { safeConsole } from './productionOptimizations';

// دالة مقارنة محسنة للـ props
export const shallowEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  // التحقق من عدد المفاتيح
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  // مقارنة سطحية للقيم
  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// دالة مقارنة عميقة للـ props المعقدة
export const deepEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  maxDepth: number = 3
): boolean => {
  if (maxDepth <= 0) {
    return prevProps === nextProps;
  }

  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // مقارنة مباشرة للقيم البدائية
    if (prevValue === nextValue) {
      continue;
    }

    // مقارنة عميقة للكائنات والمصفوفات
    if (
      typeof prevValue === 'object' &&
      typeof nextValue === 'object' &&
      prevValue !== null &&
      nextValue !== null
    ) {
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) {
          return false;
        }
        for (let i = 0; i < prevValue.length; i++) {
          if (!deepEqual({ [i]: prevValue[i] }, { [i]: nextValue[i] }, maxDepth - 1)) {
            return false;
          }
        }
      } else if (!Array.isArray(prevValue) && !Array.isArray(nextValue)) {
        if (!deepEqual(prevValue, nextValue, maxDepth - 1)) {
          return false;
        }
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
};

// دالة مقارنة محسنة للدوال
export const functionEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  functionKeys: string[] = []
): boolean => {
  // مقارنة عادية للـ props غير الدوال
  const nonFunctionProps = { ...prevProps };
  const nonFunctionNextProps = { ...nextProps };

  functionKeys.forEach(key => {
    delete nonFunctionProps[key];
    delete nonFunctionNextProps[key];
  });

  if (!shallowEqual(nonFunctionProps, nonFunctionNextProps)) {
    return false;
  }

  // مقارنة الدوال بالمرجع
  for (const key of functionKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// HOC محسن لـ React.memo مع تتبع الأداء
export const withMemoOptimization = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  compareFunction?: (prevProps: P, nextProps: P) => boolean,
  debugName?: string
) => {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    const startTime = performance.now();
    
    let areEqual = false;
    
    if (compareFunction) {
      areEqual = compareFunction(prevProps, nextProps);
    } else {
      areEqual = shallowEqual(prevProps, nextProps);
    }
    
    const compareTime = performance.now() - startTime;
    
    // تسجيل الأداء في التطوير
    if (process.env.NODE_ENV === 'development' && debugName) {
      if (compareTime > 1) {
        safeConsole.warn(`Slow memo comparison in ${debugName}: ${compareTime.toFixed(2)}ms`);
      }
      
      if (!areEqual) {
        safeConsole.log(`${debugName} will re-render - props changed`);
      }
    }
    
    return areEqual;
  });

  MemoizedComponent.displayName = debugName || Component.displayName || Component.name;
  
  return MemoizedComponent;
};

// دالة مساعدة لإنشاء مقارن محسن للجداول
export const createTableMemoComparator = <T>(
  dataKey: string = 'data',
  columnsKey: string = 'columns'
) => {
  return (prevProps: any, nextProps: any): boolean => {
    // مقارنة البيانات
    const prevData = prevProps[dataKey];
    const nextData = nextProps[dataKey];
    
    if (prevData !== nextData) {
      // مقارنة عميقة للبيانات إذا كانت مختلفة بالمرجع
      if (Array.isArray(prevData) && Array.isArray(nextData)) {
        if (prevData.length !== nextData.length) {
          return false;
        }
        
        // مقارنة سريعة للعناصر الأولى
        for (let i = 0; i < Math.min(prevData.length, 10); i++) {
          if (prevData[i] !== nextData[i]) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    
    // مقارنة الأعمدة
    const prevColumns = prevProps[columnsKey];
    const nextColumns = nextProps[columnsKey];
    
    if (prevColumns !== nextColumns) {
      return false;
    }
    
    // مقارنة باقي الـ props
    const otherProps = { ...prevProps };
    const otherNextProps = { ...nextProps };
    
    delete otherProps[dataKey];
    delete otherProps[columnsKey];
    delete otherNextProps[dataKey];
    delete otherNextProps[columnsKey];
    
    return shallowEqual(otherProps, otherNextProps);
  };
};

// دالة مساعدة لإنشاء مقارن محسن للنماذج
export const createFormMemoComparator = (
  valueKey: string = 'value',
  onChangeKey: string = 'onChange'
) => {
  return (prevProps: any, nextProps: any): boolean => {
    // مقارنة القيمة
    if (prevProps[valueKey] !== nextProps[valueKey]) {
      return false;
    }
    
    // مقارنة باقي الـ props عدا onChange
    const otherProps = { ...prevProps };
    const otherNextProps = { ...nextProps };
    
    delete otherProps[onChangeKey];
    delete otherNextProps[onChangeKey];
    
    return shallowEqual(otherProps, otherNextProps);
  };
};

// دالة مساعدة لإنشاء مقارن محسن للبطاقات
export const createCardMemoComparator = (
  excludeKeys: string[] = ['onEdit', 'onDelete', 'onClick']
) => {
  return (prevProps: any, nextProps: any): boolean => {
    const filteredPrevProps = { ...prevProps };
    const filteredNextProps = { ...nextProps };
    
    // إزالة الدوال من المقارنة
    excludeKeys.forEach(key => {
      delete filteredPrevProps[key];
      delete filteredNextProps[key];
    });
    
    return shallowEqual(filteredPrevProps, filteredNextProps);
  };
};

// إحصائيات React.memo للتطوير
export const memoStats = {
  totalComparisons: 0,
  preventedRenders: 0,
  slowComparisons: 0,
  
  recordComparison: (prevented: boolean, time: number) => {
    memoStats.totalComparisons++;
    if (prevented) memoStats.preventedRenders++;
    if (time > 1) memoStats.slowComparisons++;
  },
  
  getStats: () => ({
    totalComparisons: memoStats.totalComparisons,
    preventedRenders: memoStats.preventedRenders,
    slowComparisons: memoStats.slowComparisons,
    preventionRate: memoStats.totalComparisons > 0 
      ? (memoStats.preventedRenders / memoStats.totalComparisons * 100).toFixed(2) + '%'
      : '0%'
  }),
  
  reset: () => {
    memoStats.totalComparisons = 0;
    memoStats.preventedRenders = 0;
    memoStats.slowComparisons = 0;
  }
};

// دالة لطباعة إحصائيات React.memo
export const logMemoStats = () => {
  if (process.env.NODE_ENV === 'development') {
    const stats = memoStats.getStats();
    safeConsole.log('📊 React.memo Stats:', stats);
  }
};

// تصدير الدوال المساعدة
export {
  shallowEqual as arePropsEqual,
  deepEqual as arePropsDeepEqual,
  functionEqual as areFunctionPropsEqual
};
