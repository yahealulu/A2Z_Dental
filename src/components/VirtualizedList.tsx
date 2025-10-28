import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useVirtualizedList, usePerformanceTracking } from '../utils/performanceOptimization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}

const VirtualizedList = React.memo(<T,>({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  getItemKey = (_, index) => index
}: VirtualizedListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // مراقبة الأداء
  usePerformanceTracking('VirtualizedList');

  // استخدام hook التمرير الافتراضي
  const {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  } = useVirtualizedList(items, itemHeight, height, overscan);

  // معالجة التمرير مع تحسين الأداء
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    
    // تحديث حالة التمرير
    setIsScrolling(true);
    
    // مسح timeout السابق
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // إيقاف حالة التمرير بعد 150ms من التوقف
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // استدعاء callback الخارجي
    if (onScroll) {
      onScroll(scrollTop);
    }
  }, [setScrollTop, onScroll]);

  // تنظيف timeout عند إلغاء التحميل
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // مكون التحميل
  const defaultLoadingComponent = useMemo(() => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="mr-3 text-gray-600">جاري التحميل...</span>
    </div>
  ), []);

  // مكون القائمة الفارغة
  const defaultEmptyComponent = useMemo(() => (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <span>لا توجد عناصر للعرض</span>
    </div>
  ), []);

  // عرض التحميل
  if (loading) {
    return (
      <div className={`${className}`} style={{ height }}>
        {loadingComponent || defaultLoadingComponent}
      </div>
    );
  }

  // عرض القائمة الفارغة
  if (items.length === 0) {
    return (
      <div className={`${className}`} style={{ height }}>
        {emptyComponent || defaultEmptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* الحاوية الكاملة للحفاظ على ارتفاع التمرير */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* الحاوية المرئية للعناصر */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            const key = getItemKey(item, actualIndex);
            
            return (
              <div
                key={key}
                style={{
                  height: itemHeight,
                  overflow: 'hidden'
                }}
                className={`${isScrolling ? 'pointer-events-none' : ''}`}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>

      {/* مؤشر التمرير (اختياري) */}
      {isScrolling && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {visibleRange.startIndex + 1} - {Math.min(visibleRange.endIndex + 1, items.length)} من {items.length}
        </div>
      )}
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => JSX.Element;

VirtualizedList.displayName = 'VirtualizedList';

export default VirtualizedList;
