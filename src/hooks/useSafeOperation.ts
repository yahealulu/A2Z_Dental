import { useState, useCallback, useRef } from 'react';
import { 
  safeExecute, 
  retryOperation, 
  ErrorType, 
  type EnhancedError 
} from '../utils/errorHandling';

// نوع البيانات لحالة العملية
interface OperationState<T> {
  isLoading: boolean;
  data: T | null;
  error: EnhancedError | null;
  hasError: boolean;
  canRetry: boolean;
}

// نوع البيانات لإعدادات العملية
interface OperationConfig {
  errorType?: ErrorType;
  maxRetries?: number;
  retryDelay?: number;
  fallbackData?: any;
  context?: any;
}

// Hook للعمليات الآمنة
export const useSafeOperation = <T>() => {
  const [state, setState] = useState<OperationState<T>>({
    isLoading: false,
    data: null,
    error: null,
    hasError: false,
    canRetry: false
  });

  const operationRef = useRef<(() => Promise<T> | T) | null>(null);
  const configRef = useRef<OperationConfig>({});

  // تنفيذ عملية آمنة
  const execute = useCallback(async (
    operation: () => Promise<T> | T,
    config: OperationConfig = {}
  ) => {
    operationRef.current = operation;
    configRef.current = config;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasError: false
    }));

    const result = await safeExecute(
      operation,
      config.errorType || ErrorType.UNKNOWN_ERROR,
      config.context,
      config.fallbackData
    );

    if (result.success) {
      setState({
        isLoading: false,
        data: result.data || null,
        error: null,
        hasError: false,
        canRetry: false
      });
    } else {
      setState({
        isLoading: false,
        data: result.data || null,
        error: result.error || null,
        hasError: true,
        canRetry: result.error?.canRetry || false
      });
    }

    return result;
  }, []);

  // تنفيذ عملية مع إعادة المحاولة
  const executeWithRetry = useCallback(async (
    operation: () => Promise<T> | T,
    config: OperationConfig = {}
  ) => {
    operationRef.current = operation;
    configRef.current = config;

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasError: false
    }));

    const result = await retryOperation(
      operation,
      config.maxRetries || 3,
      config.retryDelay || 1000,
      config.errorType || ErrorType.UNKNOWN_ERROR,
      config.context
    );

    if (result.success) {
      setState({
        isLoading: false,
        data: result.data || null,
        error: null,
        hasError: false,
        canRetry: false
      });
    } else {
      setState({
        isLoading: false,
        data: result.data || null,
        error: result.error || null,
        hasError: true,
        canRetry: result.error?.canRetry || false
      });
    }

    return result;
  }, []);

  // إعادة المحاولة
  const retry = useCallback(async () => {
    if (operationRef.current && state.canRetry) {
      return await execute(operationRef.current, configRef.current);
    }
  }, [execute, state.canRetry]);

  // مسح الخطأ
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      hasError: false,
      canRetry: false
    }));
  }, []);

  // إعادة تعيين الحالة
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
      hasError: false,
      canRetry: false
    });
    operationRef.current = null;
    configRef.current = {};
  }, []);

  return {
    ...state,
    execute,
    executeWithRetry,
    retry,
    clearError,
    reset
  };
};

// Hook للعمليات المتعددة
export const useSafeBatchOperation = <T>() => {
  const [state, setState] = useState<{
    isLoading: boolean;
    results: Array<{ success: boolean; data?: T; error?: EnhancedError }>;
    errors: EnhancedError[];
    hasErrors: boolean;
    completedCount: number;
    totalCount: number;
  }>({
    isLoading: false,
    results: [],
    errors: [],
    hasErrors: false,
    completedCount: 0,
    totalCount: 0
  });

  const executeBatch = useCallback(async (
    operations: Array<() => Promise<T> | T>,
    config: OperationConfig = {}
  ) => {
    setState({
      isLoading: true,
      results: [],
      errors: [],
      hasErrors: false,
      completedCount: 0,
      totalCount: operations.length
    });

    const results: Array<{ success: boolean; data?: T; error?: EnhancedError }> = [];
    const errors: EnhancedError[] = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      const result = await safeExecute(
        operation,
        config.errorType || ErrorType.UNKNOWN_ERROR,
        { ...config.context, operationIndex: i },
        config.fallbackData
      );

      results.push(result);
      
      if (!result.success && result.error) {
        errors.push(result.error);
      }

      // تحديث التقدم
      setState(prev => ({
        ...prev,
        completedCount: i + 1,
        results: [...results],
        errors: [...errors],
        hasErrors: errors.length > 0
      }));
    }

    setState(prev => ({
      ...prev,
      isLoading: false
    }));

    return {
      results,
      errors,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length
    };
  }, []);

  return {
    ...state,
    executeBatch
  };
};

// Hook للعمليات مع fallback
export const useSafeOperationWithFallback = <T>(fallbackData: T) => {
  const safeOp = useSafeOperation<T>();

  const executeWithFallback = useCallback(async (
    operation: () => Promise<T> | T,
    config: Omit<OperationConfig, 'fallbackData'> = {}
  ) => {
    return await safeOp.execute(operation, {
      ...config,
      fallbackData
    });
  }, [safeOp, fallbackData]);

  return {
    ...safeOp,
    executeWithFallback,
    // البيانات ستكون دائماً متوفرة (إما النتيجة أو fallback)
    data: safeOp.data || fallbackData
  };
};

// Hook للعمليات الدورية الآمنة
export const useSafePeriodicOperation = <T>() => {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const safeOp = useSafeOperation<T>();

  const start = useCallback((
    operation: () => Promise<T> | T,
    interval: number,
    config: OperationConfig = {}
  ) => {
    if (isRunning) return;

    setIsRunning(true);
    
    // تنفيذ فوري
    safeOp.execute(operation, config);

    // تنفيذ دوري
    intervalRef.current = setInterval(() => {
      safeOp.execute(operation, config);
    }, interval);
  }, [isRunning, safeOp]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // تنظيف عند إلغاء التحميل
  const cleanup = useCallback(() => {
    stop();
  }, [stop]);

  return {
    ...safeOp,
    isRunning,
    start,
    stop,
    cleanup
  };
};
