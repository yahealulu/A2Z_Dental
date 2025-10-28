import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { errorManager, ErrorType } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // تسجيل الخطأ في نظام إدارة الأخطاء
    const enhancedError = errorManager.createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      {
        componentName: this.props.componentName || 'Unknown Component',
        errorInfo,
        props: this.props
      }
    );

    this.setState({ errorInfo });

    // استدعاء callback إضافي إذا تم توفيره
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // في بيئة التطوير، طباعة تفاصيل إضافية
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // إذا تم توفير fallback مخصص
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // العرض الافتراضي للخطأ
      return (
        <div className="min-h-64 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                حدث خطأ غير متوقع
              </h2>
              <p className="text-gray-600 mb-4">
                عذراً، حدث خطأ في هذا الجزء من التطبيق. يمكنك المحاولة مرة أخرى أو الانتقال لصفحة أخرى.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 100%)'
                }}
              >
                <ArrowPathIcon className="h-4 w-4 inline ml-2" />
                إعادة المحاولة
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </div>

            {/* تفاصيل الخطأ للمطورين */}
            {this.props.showDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  تفاصيل الخطأ (للمطورين)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div className="mb-2">
                    <strong>Component:</strong> {this.props.componentName || 'Unknown'}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// مكون Error Boundary مبسط للاستخدام السريع
export const SimpleErrorBoundary: React.FC<{
  children: ReactNode;
  message?: string;
  componentName?: string;
}> = ({ children, message = "حدث خطأ في هذا القسم", componentName }) => (
  <ErrorBoundary
    componentName={componentName}
    fallback={
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 ml-2" />
          <span className="text-red-700">{message}</span>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// Hook لاستخدام Error Boundary في functional components
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: any) => {
    errorManager.createError(
      ErrorType.UNKNOWN_ERROR,
      error,
      context
    );
  };

  return { handleError };
};

export default ErrorBoundary;
