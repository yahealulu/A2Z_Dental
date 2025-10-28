import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { usePerformanceTracking } from '../utils/performanceOptimization';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number; // نسبة الظهور لبدء التحميل (0-1)
  rootMargin?: string;
  className?: string;
  debugName?: string;
  minLoadingTime?: number; // حد أدنى لوقت التحميل لتجنب الوميض
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  debugName = 'LazyComponent',
  minLoadingTime = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);

  // مراقبة الأداء
  usePerformanceTracking(debugName);

  // مكون التحميل الافتراضي
  const defaultFallback = (
    <div className="flex items-center justify-center py-8 animate-pulse">
      <div className="space-y-3 w-full">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && !isVisible) {
          loadStartTime.current = performance.now();
          setIsLoading(true);
          
          // تأخير بسيط لضمان الحد الأدنى لوقت التحميل
          setTimeout(() => {
            setIsVisible(true);
            setIsLoading(false);
            
            if (process.env.NODE_ENV === 'development') {
              const loadTime = performance.now() - loadStartTime.current;
              console.log(`${debugName} loaded in ${loadTime.toFixed(2)}ms`);
            }
          }, Math.max(0, minLoadingTime - (performance.now() - loadStartTime.current)));
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, isVisible, debugName, minLoadingTime]);

  return (
    <div ref={elementRef} className={className}>
      {isLoading && (fallback || defaultFallback)}
      {isVisible && !isLoading && children}
      {!isVisible && !isLoading && (
        <div className="h-32 flex items-center justify-center text-gray-400">
          <span>جاري التحضير...</span>
        </div>
      )}
    </div>
  );
};

// Hook لإنشاء مكونات lazy محسنة
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  debugName?: string
) => {
  const LazyLoadedComponent = lazy(importFunction);
  
  return React.memo((props: React.ComponentProps<T>) => (
    <Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل {debugName}...</span>
      </div>
    }>
      <LazyLoadedComponent {...props} />
    </Suspense>
  ));
};

// مكون للتحميل التدريجي للصور
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(img);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || <span className="text-gray-400 text-sm">جاري التحميل...</span>}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">فشل في التحميل</span>
        </div>
      )}
      
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default LazyComponent;
