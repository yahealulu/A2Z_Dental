import React, { useState, useEffect, memo } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BanknotesIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { AdvancedExpenseFilters } from '../utils/expenseFiltering';
import { AMOUNT_RANGES, getDateRanges } from '../utils/expenseFiltering';
import {
  useOptimizedDebounce,
  useOptimizedCallback,
  useOptimizedMemo,
  usePerformanceTracking
} from '../utils/performanceOptimization';

interface ExpenseAdvancedFilterProps {
  filters: AdvancedExpenseFilters;
  onFiltersChange: (filters: AdvancedExpenseFilters) => void;
  categories: string[];
  isOpen: boolean;
  onToggle: () => void;
  onReset: () => void;
  totalResults: number;
}

const ExpenseAdvancedFilter: React.FC<ExpenseAdvancedFilterProps> = ({
  filters,
  onFiltersChange,
  categories,
  isOpen,
  onToggle,
  onReset,
  totalResults
}) => {
  // مراقبة الأداء
  usePerformanceTracking('ExpenseAdvancedFilter');

  const [localFilters, setLocalFilters] = useState<AdvancedExpenseFilters>(filters);

  // استخدام debouncing محسن للبحث
  const debouncedSearchTerm = useOptimizedDebounce(
    localFilters.searchTerm || '',
    300,
    'ExpenseAdvancedFilter-search'
  );

  // تطبيق التصفية مع debouncing محسن
  useEffect(() => {
    const filtersWithDebouncedSearch = {
      ...localFilters,
      searchTerm: debouncedSearchTerm
    };
    onFiltersChange(filtersWithDebouncedSearch);
  }, [localFilters, debouncedSearchTerm]); // إزالة onFiltersChange من dependencies

  // معالجات محسنة مع useCallback
  const handleFilterChange = useOptimizedCallback((key: keyof AdvancedExpenseFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, [], 'ExpenseAdvancedFilter-filterChange');

  const handleReset = useOptimizedCallback(() => {
    const resetFilters: AdvancedExpenseFilters = {
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    onReset();
  }, [onReset], 'ExpenseAdvancedFilter-reset');

  // حسابات محسنة مع useMemo
  const dateRanges = useOptimizedMemo(() => getDateRanges(), [], 'ExpenseAdvancedFilter-dateRanges');

  const hasActiveFilters = useOptimizedMemo(() =>
    Object.keys(localFilters).some(key =>
      key !== 'sortBy' && key !== 'sortOrder' && localFilters[key as keyof AdvancedExpenseFilters]
    ), [localFilters], 'ExpenseAdvancedFilter-hasActiveFilters');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
      {/* رأس التصفية */}
      <div className="p-4 border-b border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
        }}></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">تصفية متقدمة</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {totalResults} نتيجة
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                مسح الكل
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isOpen ? (
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <FunnelIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* محتوى التصفية */}
      {isOpen && (
        <div className="p-6 space-y-6">
          {/* البحث النصي */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline ml-1" />
              البحث
            </label>
            <input
              type="text"
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="ابحث في الوصف أو الفئة..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* تصفية الفئة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TagIcon className="h-4 w-4 inline ml-1" />
                الفئة
              </label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* حالة الدفع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة الدفع
              </label>
              <select
                value={localFilters.isPaid === undefined ? '' : localFilters.isPaid.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('isPaid', value === '' ? undefined : value === 'true');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">الكل</option>
                <option value="true">مدفوع</option>
                <option value="false">غير مدفوع</option>
              </select>
            </div>

            {/* نطاق التاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline ml-1" />
                نطاق التاريخ
              </label>
              <select
                value={localFilters.dateRange || 'custom'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    handleFilterChange('dateRange', undefined);
                  } else {
                    handleFilterChange('dateRange', value);
                    handleFilterChange('dateFrom', undefined);
                    handleFilterChange('dateTo', undefined);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="custom">مخصص</option>
                {Object.entries(dateRanges).map(([key, range]) => (
                  <option key={key} value={key}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* التاريخ المخصص */}
          {(!localFilters.dateRange || localFilters.dateRange === 'custom') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نطاق المبلغ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BanknotesIcon className="h-4 w-4 inline ml-1" />
                نطاق المبلغ
              </label>
              <select
                value={localFilters.amountRange || 'custom'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    handleFilterChange('amountRange', undefined);
                  } else {
                    handleFilterChange('amountRange', value);
                    handleFilterChange('amountMin', undefined);
                    handleFilterChange('amountMax', undefined);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="custom">مخصص</option>
                {Object.entries(AMOUNT_RANGES).map(([key, range]) => (
                  <option key={key} value={key}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* الترتيب */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ترتيب حسب
              </label>
              <div className="flex gap-2">
                <select
                  value={localFilters.sortBy || 'date'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">التاريخ</option>
                  <option value="amount">المبلغ</option>
                  <option value="category">الفئة</option>
                </select>
                <select
                  value={localFilters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">تنازلي</option>
                  <option value="asc">تصاعدي</option>
                </select>
              </div>
            </div>
          </div>

          {/* المبلغ المخصص */}
          {(!localFilters.amountRange || localFilters.amountRange === 'custom') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أقل مبلغ
                </label>
                <input
                  type="number"
                  value={localFilters.amountMin || ''}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أعلى مبلغ
                </label>
                <input
                  type="number"
                  value={localFilters.amountMax || ''}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="بدون حد أقصى"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(ExpenseAdvancedFilter);
