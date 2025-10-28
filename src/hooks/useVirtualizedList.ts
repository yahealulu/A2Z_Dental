import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface VirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollThreshold?: number;
}

interface VirtualizedListResult<T> {
  visibleItems: Array<{
    index: number;
    item: T;
    style: React.CSSProperties;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    ref: React.RefObject<HTMLDivElement>;
  };
  isScrolling: boolean;
  visibleRange: { start: number; end: number };
}

export function useVirtualizedList<T>(
  items: T[],
  options: VirtualizedListOptions
): VirtualizedListResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollThreshold = 100
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // حساب العناصر المرئية
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // العناصر المرئية مع الأنماط
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          style: {
            position: 'absolute' as const,
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
          }
        });
      }
    }
    return result;
  }, [visibleRange, items, itemHeight]);

  // الارتفاع الإجمالي
  const totalHeight = items.length * itemHeight;

  // معالج التمرير
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // إيقاف حالة التمرير بعد فترة
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // التمرير إلى فهرس معين
  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      const targetScrollTop = index * itemHeight;
      containerRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [itemHeight]);

  // التمرير إلى الأعلى
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, []);

  // تنظيف المؤقتات
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // خصائص الحاوية
  const containerProps = {
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    onScroll: handleScroll,
    ref: containerRef,
  };

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    containerProps,
    isScrolling,
    visibleRange,
  };
}

// Hook للتحميل التدريجي
export function useProgressiveLoading<T>(
  allItems: T[],
  initialBatchSize: number = 20,
  batchSize: number = 10
) {
  const [loadedCount, setLoadedCount] = useState(initialBatchSize);
  const [isLoading, setIsLoading] = useState(false);

  // العناصر المحملة حالياً
  const loadedItems = useMemo(() => {
    return allItems.slice(0, loadedCount);
  }, [allItems, loadedCount]);

  // تحميل المزيد من العناصر
  const loadMore = useCallback(async () => {
    if (isLoading || loadedCount >= allItems.length) return;

    setIsLoading(true);
    
    // محاكاة تأخير التحميل
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setLoadedCount(prev => Math.min(prev + batchSize, allItems.length));
    setIsLoading(false);
  }, [isLoading, loadedCount, allItems.length, batchSize]);

  // إعادة تعيين التحميل
  const reset = useCallback(() => {
    setLoadedCount(initialBatchSize);
    setIsLoading(false);
  }, [initialBatchSize]);

  // تحميل جميع العناصر
  const loadAll = useCallback(() => {
    setLoadedCount(allItems.length);
  }, [allItems.length]);

  const hasMore = loadedCount < allItems.length;
  const progress = allItems.length > 0 ? (loadedCount / allItems.length) * 100 : 0;

  return {
    loadedItems,
    loadedCount,
    totalCount: allItems.length,
    isLoading,
    hasMore,
    progress,
    loadMore,
    reset,
    loadAll
  };
}

// Hook للتحميل عند الحاجة (Intersection Observer)
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options;
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          callback();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [callback, threshold, rootMargin, enabled]);

  return targetRef;
}
