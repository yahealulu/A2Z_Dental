import React, { useMemo, useCallback } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import PatientCard from './PatientCard';
import { useVirtualizedList, useProgressiveLoading } from '../hooks/useVirtualizedList';
import type { Patient } from '../store/patientStore';

interface VirtualizedPatientListProps {
  patients: Patient[];
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  searchQuery?: string;
  containerHeight?: number;
  enableVirtualization?: boolean;
  enableProgressiveLoading?: boolean;
}

const VirtualizedPatientList: React.FC<VirtualizedPatientListProps> = ({
  patients,
  onEdit,
  onDelete,
  searchQuery = '',
  containerHeight = 600,
  enableVirtualization = true,
  enableProgressiveLoading = true
}) => {
  // التحميل التدريجي
  const {
    loadedItems,
    loadedCount,
    totalCount,
    isLoading,
    hasMore,
    loadMore,
    progress
  } = useProgressiveLoading(patients, 20, 10);

  // استخدام البيانات المحملة أو جميع البيانات
  const displayPatients = enableProgressiveLoading ? loadedItems : patients;

  // حساب ارتفاع العنصر الواحد (تقدير)
  const itemHeight = 280; // ارتفاع PatientCard تقريباً

  // Virtualized List
  const {
    visibleItems,
    totalHeight,
    containerProps,
    isScrolling,
    visibleRange,
    scrollToTop
  } = useVirtualizedList(displayPatients, {
    itemHeight,
    containerHeight,
    overscan: 3
  });

  // تحويل العناصر المرئية إلى شبكة
  const gridItems = useMemo(() => {
    if (!enableVirtualization) {
      return displayPatients.map((patient, index) => ({
        index,
        patient,
        style: {}
      }));
    }

    const itemsPerRow = 3; // عدد الأعمدة في الشبكة
    const gridRows: Array<{
      index: number;
      patients: Patient[];
      style: React.CSSProperties;
    }> = [];

    for (let i = 0; i < visibleItems.length; i += itemsPerRow) {
      const rowPatients = visibleItems.slice(i, i + itemsPerRow).map(item => item.item);
      const rowIndex = Math.floor(visibleItems[i]?.index / itemsPerRow) || 0;
      
      gridRows.push({
        index: rowIndex,
        patients: rowPatients,
        style: {
          position: 'absolute',
          top: rowIndex * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        }
      });
    }

    return gridRows;
  }, [visibleItems, displayPatients, enableVirtualization, itemHeight]);

  // معالج التمرير للتحميل التدريجي
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (containerProps.onScroll) {
      containerProps.onScroll(e);
    }

    // تحميل المزيد عند الوصول لنهاية القائمة
    if (enableProgressiveLoading && hasMore && !isLoading) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMore();
      }
    }
  }, [containerProps.onScroll, enableProgressiveLoading, hasMore, isLoading, loadMore]);

  // عرض حالة فارغة
  if (displayPatients.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, rgba(138, 133, 179, 0.1) 0%, rgba(164, 114, 174, 0.1) 100%)'
        }}>
          <UserGroupIcon className="h-12 w-12" style={{ color: '#8A85B3' }} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {searchQuery ? 'لا توجد نتائج' : 'لا يوجد مرضى'}
        </h3>
        <p className="text-lg text-gray-600 mb-8">
          {searchQuery 
            ? `لم يتم العثور على مرضى يطابقون "${searchQuery}"`
            : 'ابدأ بإضافة مريض جديد لبناء قاعدة بيانات المرضى'
          }
        </p>
      </div>
    );
  }

  // عرض قائمة عادية (بدون virtualization)
  if (!enableVirtualization) {
    return (
      <div className="space-y-6">
        {/* شريط التقدم للتحميل التدريجي */}
        {enableProgressiveLoading && totalCount > loadedCount && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                تم تحميل {loadedCount} من أصل {totalCount} مريض
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* شبكة المرضى */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              id={patient.id}
              name={patient.name}
              phone={patient.phone}
              birthdate={patient.birthDate}
              // تم إزالة lastVisit لتحسين الأداء
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* زر تحميل المزيد */}
        {enableProgressiveLoading && hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // عرض قائمة virtualized
  return (
    <div className="space-y-4">
      {/* معلومات الأداء */}
      {isScrolling && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            عرض العناصر {visibleRange.start + 1} - {visibleRange.end + 1} من أصل {displayPatients.length}
          </p>
        </div>
      )}

      {/* شريط التقدم للتحميل التدريجي */}
      {enableProgressiveLoading && totalCount > loadedCount && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              تم تحميل {loadedCount} من أصل {totalCount} مريض
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* الحاوية المُحسَّنة */}
      <div
        {...containerProps}
        onScroll={handleScroll}
        className="relative border border-gray-200 rounded-lg bg-gray-50"
        style={{
          ...containerProps.style,
          height: containerHeight,
        }}
      >
        {/* المحتوى الداخلي */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {gridItems.map((row) => (
            <div
              key={row.index}
              style={row.style}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 px-4"
            >
              {row.patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  id={patient.id}
                  name={patient.name}
                  phone={patient.phone}
                  birthdate={patient.birthDate}
                  // تم إزالة lastVisit لتحسين الأداء
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))}
        </div>

        {/* مؤشر التحميل */}
        {isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2 space-x-reverse">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">جاري التحميل...</span>
            </div>
          </div>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="flex justify-between items-center">
        <button
          onClick={scrollToTop}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          العودة للأعلى
        </button>
        
        {enableProgressiveLoading && hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VirtualizedPatientList;
