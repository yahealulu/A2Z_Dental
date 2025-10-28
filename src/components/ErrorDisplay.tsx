import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { errorManager, type EnhancedError, ErrorSeverity } from '../utils/errorHandling';

interface ErrorDisplayProps {
  error: EnhancedError;
  onDismiss?: () => void;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = React.memo(({
  error,
  onDismiss,
  onRetry,
  autoHide = false,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // إخفاء تلقائي للأخطاء البسيطة
  useEffect(() => {
    if (autoHide && error.severity === ErrorSeverity.LOW) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error.severity, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const getErrorIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return <InformationCircleIcon className="h-5 w-5" />;
      case ErrorSeverity.MEDIUM:
        return <ExclamationCircleIcon className="h-5 w-5" />;
      case ErrorSeverity.HIGH:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case ErrorSeverity.CRITICAL:
        return <ShieldExclamationIcon className="h-5 w-5" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  const getErrorStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          button: 'text-blue-600 hover:text-blue-800'
        };
      case ErrorSeverity.MEDIUM:
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-500',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case ErrorSeverity.HIGH:
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: 'text-orange-500',
          button: 'text-orange-600 hover:text-orange-800'
        };
      case ErrorSeverity.CRITICAL:
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          button: 'text-red-600 hover:text-red-800'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-500',
          button: 'text-gray-600 hover:text-gray-800'
        };
    }
  };

  if (!isVisible) return null;

  const styles = getErrorStyles();

  return (
    <div className={`border rounded-lg p-4 mb-4 ${styles.container}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getErrorIcon()}
        </div>
        
        <div className="mr-3 flex-1">
          <h3 className="text-sm font-medium mb-1">
            {error.userMessage}
          </h3>
          
          {/* تفاصيل إضافية للأخطاء الخطيرة */}
          {error.severity === ErrorSeverity.CRITICAL && (
            <p className="text-xs opacity-75 mb-2">
              يرجى حفظ عملك والاتصال بالدعم الفني إذا استمرت المشكلة.
            </p>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex items-center space-x-4 space-x-reverse mt-2">
            {error.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`text-xs font-medium ${styles.button} transition-colors`}
              >
                إعادة المحاولة
              </button>
            )}
            
            {error.severity !== ErrorSeverity.CRITICAL && (
              <button
                onClick={handleDismiss}
                className={`text-xs font-medium ${styles.button} transition-colors`}
              >
                تجاهل
              </button>
            )}
          </div>
        </div>

        {/* زر الإغلاق */}
        <div className="flex-shrink-0 mr-2">
          <button
            onClick={handleDismiss}
            className={`${styles.button} transition-colors`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

// مكون لعرض قائمة الأخطاء
export const ErrorList: React.FC<{
  maxErrors?: number;
  showOnlyRecent?: boolean;
  onErrorDismiss?: (error: EnhancedError) => void;
  onErrorRetry?: (error: EnhancedError) => void;
}> = ({ 
  maxErrors = 5, 
  showOnlyRecent = true,
  onErrorDismiss,
  onErrorRetry 
}) => {
  const [errors, setErrors] = useState<EnhancedError[]>([]);

  useEffect(() => {
    const updateErrors = () => {
      let allErrors = errorManager.getErrorLog();

      // إظهار الأخطاء الحرجة والعالية فقط
      allErrors = allErrors.filter(error =>
        error.severity === ErrorSeverity.CRITICAL ||
        error.severity === ErrorSeverity.HIGH
      );

      if (showOnlyRecent) {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        allErrors = allErrors.filter(error => error.timestamp > fiveMinutesAgo);
      }

      setErrors(allErrors.slice(0, maxErrors));
    };

    // تحديث فوري
    updateErrors();

    // إضافة مستمع للأخطاء الجديدة
    const handleNewError = () => {
      updateErrors();
    };

    // ربط مع نظام إدارة الأخطاء
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleNewError);
      window.addEventListener('unhandledrejection', handleNewError);
    }

    // تنظيف Event Listeners عند إلغاء التحميل
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleNewError);
        window.removeEventListener('unhandledrejection', handleNewError);
      }
    };

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleNewError);
        window.removeEventListener('unhandledrejection', handleNewError);
      }
    };
  }, [maxErrors, showOnlyRecent]);

  const handleDismiss = (errorToRemove: EnhancedError) => {
    setErrors(prev => prev.filter(error => error.timestamp !== errorToRemove.timestamp));
    if (onErrorDismiss) onErrorDismiss(errorToRemove);
  };

  const handleRetry = (error: EnhancedError) => {
    if (onErrorRetry) onErrorRetry(error);
  };

  if (errors.length === 0) return null;

  return (
    <div className="space-y-2">
      {errors.map((error) => (
        <ErrorDisplay
          key={error.timestamp}
          error={error}
          onDismiss={() => handleDismiss(error)}
          onRetry={error.canRetry ? () => handleRetry(error) : undefined}
          autoHide={error.severity === ErrorSeverity.LOW}
        />
      ))}
    </div>
  );
};

// Hook لاستخدام عرض الأخطاء
export const useErrorDisplay = () => {
  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);

  const showError = (error: EnhancedError) => {
    setCurrentError(error);
  };

  const hideError = () => {
    setCurrentError(null);
  };

  const ErrorComponent = currentError ? (
    <ErrorDisplay
      error={currentError}
      onDismiss={hideError}
      autoHide={currentError.severity === ErrorSeverity.LOW}
    />
  ) : null;

  return {
    showError,
    hideError,
    ErrorComponent,
    hasError: !!currentError
  };
};

export default ErrorDisplay;
