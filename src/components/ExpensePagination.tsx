import React, { memo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import {
  useOptimizedCallback,
  useOptimizedMemo,
  usePerformanceTracking
} from '../utils/performanceOptimization';

interface ExpensePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  isLoading?: boolean;
}

const ExpensePagination: React.FC<ExpensePaginationProps> = React.memo(({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false
}) => {
  // مراقبة الأداء
  usePerformanceTracking('ExpensePagination');
  // حساب نطاق العناصر المعروضة مع memoization
  const { startItem, endItem } = useOptimizedMemo(() => ({
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalItems)
  }), [currentPage, itemsPerPage, totalItems], 'ExpensePagination-itemRange');

  // إنشاء قائمة أرقام الصفحات للعرض مع memoization
  const pageNumbers = useOptimizedMemo(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // إذا كان العدد الكلي للصفحات قليل، اعرض جميع الصفحات
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // إذا كان العدد كبير، اعرض نطاق محدود
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);
      
      // تعديل النطاق إذا كان قريباً من البداية أو النهاية
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      if (currentPage > totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      // إضافة الصفحة الأولى و ... إذا لزم الأمر
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // إضافة الصفحات في النطاق
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // إضافة ... والصفحة الأخيرة إذا لزم الأمر
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages], 'ExpensePagination-pageNumbers');

  // خيارات عدد العناصر في الصفحة مع memoization
  const itemsPerPageOptions = useOptimizedMemo(() => [10, 20, 30, 50, 100], [], 'ExpensePagination-options');

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* معلومات العناصر المعروضة */}
      <div className="flex items-center text-sm text-gray-600">
        <span>
          عرض {startItem} إلى {endItem} من أصل {totalItems.toLocaleString()} عنصر
        </span>
      </div>

      {/* أزرار التنقل */}
      <div className="flex items-center gap-2">
        {/* الذهاب إلى الصفحة الأولى */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === 1 || isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-white hover:shadow-md'
          }`}
          title="الصفحة الأولى"
        >
          <ChevronDoubleRightIcon className="h-4 w-4" />
        </button>

        {/* الصفحة السابقة */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === 1 || isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-white hover:shadow-md'
          }`}
          title="الصفحة السابقة"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:bg-white hover:shadow-md'
                  } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  style={
                    currentPage === page
                      ? {
                          background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                        }
                      : {}
                  }
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* الصفحة التالية */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === totalPages || isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-white hover:shadow-md'
          }`}
          title="الصفحة التالية"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* الذهاب إلى الصفحة الأخيرة */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            currentPage === totalPages || isLoading
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:bg-white hover:shadow-md'
          }`}
          title="الصفحة الأخيرة"
        >
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        </button>
      </div>

      {/* اختيار عدد العناصر في الصفحة */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="itemsPerPage" className="text-gray-600">
          عناصر في الصفحة:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          disabled={isLoading}
          className={`px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isLoading ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

ExpensePagination.displayName = 'ExpensePagination';

export default ExpensePagination;
