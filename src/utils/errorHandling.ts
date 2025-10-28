// نظام إدارة الأخطاء المتقدم

// أنواع الأخطاء المختلفة
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// مستويات الخطورة
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// نوع البيانات للخطأ المحسن
export interface EnhancedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  timestamp: number;
  context?: any;
  stack?: string;
  canRetry: boolean;
  fallbackData?: any;
}

// رسائل الأخطاء باللغة العربية
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: 'مشكلة في الاتصال، يرجى التحقق من الإنترنت والمحاولة مرة أخرى',
  [ErrorType.DATA_CORRUPTION]: 'البيانات تالفة، سيتم استخدام نسخة احتياطية',
  [ErrorType.VALIDATION_ERROR]: 'البيانات المدخلة غير صحيحة، يرجى المراجعة والتصحيح',
  [ErrorType.MEMORY_ERROR]: 'البيانات كثيرة جداً، سيتم تحميل جزء منها فقط',
  [ErrorType.CALCULATION_ERROR]: 'خطأ في الحسابات، سيتم إعادة المحاولة',
  [ErrorType.STORAGE_ERROR]: 'مشكلة في حفظ البيانات، يرجى المحاولة مرة أخرى',
  [ErrorType.UNKNOWN_ERROR]: 'حدث خطأ غير متوقع، يرجى إعادة تحميل الصفحة'
};

// فئة إدارة الأخطاء
export class ErrorManager {
  private static instance: ErrorManager;
  private errorLog: EnhancedError[] = [];
  private maxLogSize = 100;

  private constructor() {}

  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  // إنشاء خطأ محسن
  public createError(
    type: ErrorType,
    originalError: Error | string,
    context?: any,
    fallbackData?: any
  ): EnhancedError {
    const message = typeof originalError === 'string' ? originalError : originalError.message;
    const stack = typeof originalError === 'object' ? originalError.stack : undefined;

    const enhancedError: EnhancedError = {
      type,
      severity: this.getSeverity(type),
      message,
      userMessage: ERROR_MESSAGES[type],
      timestamp: Date.now(),
      context,
      stack,
      canRetry: this.canRetry(type),
      fallbackData
    };

    this.logError(enhancedError);
    return enhancedError;
  }

  // تحديد مستوى الخطورة
  private getSeverity(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
        return ErrorSeverity.LOW;
      case ErrorType.CALCULATION_ERROR:
      case ErrorType.STORAGE_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorType.DATA_CORRUPTION:
      case ErrorType.MEMORY_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.NETWORK_ERROR:
      case ErrorType.UNKNOWN_ERROR:
        return ErrorSeverity.CRITICAL;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  // تحديد إمكانية إعادة المحاولة
  private canRetry(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK_ERROR,
      ErrorType.CALCULATION_ERROR,
      ErrorType.STORAGE_ERROR
    ].includes(type);
  }

  // تسجيل الخطأ
  private logError(error: EnhancedError): void {
    this.errorLog.unshift(error);
    
    // الحفاظ على حجم السجل
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // طباعة في الكونسول للتطوير
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.type} - ${error.severity}`);
      console.error('Message:', error.message);
      console.info('User Message:', error.userMessage);
      console.info('Context:', error.context);
      if (error.stack) console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }

  // الحصول على سجل الأخطاء
  public getErrorLog(): EnhancedError[] {
    return [...this.errorLog];
  }

  // مسح سجل الأخطاء
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  // الحصول على الأخطاء حسب النوع
  public getErrorsByType(type: ErrorType): EnhancedError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  // الحصول على الأخطاء حسب الخطورة
  public getErrorsBySeverity(severity: ErrorSeverity): EnhancedError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }
}

// instance مشترك
export const errorManager = ErrorManager.getInstance();

// دالة مساعدة لتنفيذ عملية مع معالجة الأخطاء
export async function safeExecute<T>(
  operation: () => Promise<T> | T,
  errorType: ErrorType,
  context?: any,
  fallbackData?: T
): Promise<{ success: boolean; data?: T; error?: EnhancedError }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const enhancedError = errorManager.createError(
      errorType,
      error as Error,
      context,
      fallbackData
    );
    
    return { 
      success: false, 
      error: enhancedError,
      data: fallbackData
    };
  }
}

// دالة إعادة المحاولة
export async function retryOperation<T>(
  operation: () => Promise<T> | T,
  maxRetries: number = 3,
  delay: number = 1000,
  errorType: ErrorType = ErrorType.UNKNOWN_ERROR,
  context?: any
): Promise<{ success: boolean; data?: T; error?: EnhancedError }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  // فشل جميع المحاولات
  const enhancedError = errorManager.createError(
    errorType,
    lastError!,
    { ...context, attempts: maxRetries }
  );
  
  return { success: false, error: enhancedError };
}

// دالة للتحقق من صحة البيانات
export function validateData<T>(
  data: any,
  validator: (data: any) => data is T,
  errorContext?: any
): { isValid: boolean; data?: T; error?: EnhancedError } {
  try {
    if (validator(data)) {
      return { isValid: true, data };
    } else {
      const error = errorManager.createError(
        ErrorType.VALIDATION_ERROR,
        'البيانات لا تتطابق مع الشكل المطلوب',
        errorContext
      );
      return { isValid: false, error };
    }
  } catch (error) {
    const enhancedError = errorManager.createError(
      ErrorType.VALIDATION_ERROR,
      error as Error,
      errorContext
    );
    return { isValid: false, error: enhancedError };
  }
}

// دالة للتعامل مع أخطاء الذاكرة
export function handleMemoryIntensiveOperation<T>(
  data: T[],
  operation: (chunk: T[]) => any,
  chunkSize: number = 100
): { success: boolean; results?: any[]; error?: EnhancedError } {
  try {
    const results: any[] = [];
    
    // تقسيم البيانات إلى أجزاء صغيرة
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const result = operation(chunk);
      results.push(result);
      
      // فحص استهلاك الذاكرة (تقريبي)
      if (results.length > 1000) {
        throw new Error('تجاوز الحد الأقصى للذاكرة');
      }
    }
    
    return { success: true, results };
  } catch (error) {
    const enhancedError = errorManager.createError(
      ErrorType.MEMORY_ERROR,
      error as Error,
      { dataLength: data.length, chunkSize }
    );
    return { success: false, error: enhancedError };
  }
}

// دالة لحفظ البيانات بأمان
export async function safeSave<T>(
  key: string,
  data: T,
  storage: Storage = localStorage
): Promise<{ success: boolean; error?: EnhancedError }> {
  try {
    const serializedData = JSON.stringify(data);
    storage.setItem(key, serializedData);
    return { success: true };
  } catch (error) {
    const enhancedError = errorManager.createError(
      ErrorType.STORAGE_ERROR,
      error as Error,
      { key, dataSize: JSON.stringify(data).length }
    );
    return { success: false, error: enhancedError };
  }
}

// دالة لتحميل البيانات بأمان
export function safeLoad<T>(
  key: string,
  defaultValue: T,
  storage: Storage = localStorage
): { success: boolean; data: T; error?: EnhancedError } {
  try {
    const item = storage.getItem(key);
    if (item === null) {
      return { success: true, data: defaultValue };
    }
    
    const parsedData = JSON.parse(item);
    return { success: true, data: parsedData };
  } catch (error) {
    const enhancedError = errorManager.createError(
      ErrorType.STORAGE_ERROR,
      error as Error,
      { key }
    );
    return { success: false, data: defaultValue, error: enhancedError };
  }
}
