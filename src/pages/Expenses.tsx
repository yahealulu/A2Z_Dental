import { useState, useMemo, useEffect, useCallback, useReducer } from 'react';
import { format } from 'date-fns';
import {
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  TagIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useExpenseStore, type ExpenseCategory } from '../store/expenseStore';
import { useExpenseOptimization } from '../hooks/useExpenseOptimization';
import ExpensePagination from '../components/ExpensePagination';
import ExpenseAdvancedFilter from '../components/ExpenseAdvancedFilter';
import type { AdvancedExpenseFilters } from '../utils/expenseFiltering';

const Expenses = () => {
  // إجبار إعادة الرندر عند تغيير البيانات
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const {
    categories,
    addExpense,
    addCategory,
    deleteCategory,
    canDeleteCategory,
    togglePaymentStatus
  } = useExpenseStore();

  // استخدام الـ hook المحسن
  const {
    getOptimizedCategoryAggregation,
    getOptimizedMonthlySummary,
    preloadAdjacentMonths,
    getPaginatedExpenses,
    getAdvancedPaginatedExpenses,
    preloadAdjacentPages,
    getFilteredExpenses,
    searchExpenses,
    getTopCategories,
    getCategoryQuickStats,
    getDailyExpensesList,
    getMonthlyExpensesList,
    getMonthlyCategorySummary,
    getUnpaidExpenses,
    loadingState
  } = useExpenseOptimization();

  // حالة المودال
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const [expenseToMarkPaid, setExpenseToMarkPaid] = useState<string | null>(null);

  // حالة النماذج
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: categories[0]?.name || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isPaid: true
  });
  const [newCategoryName, setNewCategoryName] = useState('');

  // حالة التاريخ والشهر
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // حالة pagination والتصفية المتقدمة
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedExpenseFilters>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // بيانات اليوم المحدد - محسنة للأداء
  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const selectedDateExpenses = useMemo(() => {
    return getDailyExpensesList(selectedDateString);
  }, [selectedDateString, getDailyExpensesList]);

  const selectedDateTotal = useMemo(() => {
    return selectedDateExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [selectedDateExpenses]);

  // بيانات الشهر المحدد - محسنة للأداء
  const selectedMonthKey = useMemo(() => ({
    year: selectedMonth.getFullYear(),
    month: selectedMonth.getMonth() + 1
  }), [selectedMonth]);

  const monthlyExpenses = useMemo(() => {
    return getMonthlyExpensesList(selectedMonthKey.year, selectedMonthKey.month);
  }, [selectedMonthKey.year, selectedMonthKey.month, getMonthlyExpensesList]);

  // الملخص الشهري المحسن
  const monthlySummary = useMemo(() => {
    return getOptimizedMonthlySummary(selectedMonthKey.year, selectedMonthKey.month);
  }, [selectedMonthKey.year, selectedMonthKey.month, getOptimizedMonthlySummary, monthlyExpenses.length]);

  // استخدام التجميع المحسن للفئات الشهرية
  const monthlyCategorySummary = useMemo(() => {
    const aggregation = getOptimizedCategoryAggregation(selectedMonthKey.year, selectedMonthKey.month);
    const summary: Record<string, number> = {};

    Object.values(aggregation).forEach(categoryStats => {
      summary[categoryStats.categoryName] = categoryStats.totalAmount;
    });

    return summary;
  }, [selectedMonthKey.year, selectedMonthKey.month, getOptimizedCategoryAggregation, monthlyExpenses.length]);

  const monthlyTotal = useMemo(() => {
    return monthlySummary.totalAmount;
  }, [monthlySummary.totalAmount, monthlyExpenses.length]);

  // بيانات المصاريف غير المدفوعة مع pagination وتصفية متقدمة
  const paginatedUnpaidExpenses = useMemo(() => {
    const filters: AdvancedExpenseFilters = {
      ...advancedFilters,
      isPaid: false
    };
    return getAdvancedPaginatedExpenses(currentPage, itemsPerPage, filters);
  }, [getAdvancedPaginatedExpenses, currentPage, itemsPerPage, advancedFilters]);

  // بيانات المصاريف غير المدفوعة - محسنة للأداء (للتوافق)
  const unpaidExpenses = useMemo(() => {
    return paginatedUnpaidExpenses.expenses;
  }, [paginatedUnpaidExpenses.expenses]);

  // التحميل المسبق للأشهر المجاورة
  useEffect(() => {
    preloadAdjacentMonths(selectedMonthKey.year, selectedMonthKey.month);
  }, [selectedMonthKey.year, selectedMonthKey.month, preloadAdjacentMonths]);

  // إجبار التحديث عند تغيير المصاريف
  useEffect(() => {
    forceUpdate();
  }, [monthlyExpenses.length, selectedDateExpenses.length]);

  // التحميل المسبق للصفحات المجاورة
  useEffect(() => {
    const filters: AdvancedExpenseFilters = { ...advancedFilters, isPaid: false };
    preloadAdjacentPages(currentPage, itemsPerPage, filters);
  }, [currentPage, itemsPerPage, preloadAdjacentPages]); // إزالة advancedFilters من dependencies

  // دوال معالجة pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // العودة للصفحة الأولى عند تغيير عدد العناصر
  };

  // دوال معالجة التصفية المتقدمة مع useCallback
  const handleFiltersChange = useCallback((filters: AdvancedExpenseFilters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1); // العودة للصفحة الأولى عند تغيير التصفية
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters({
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
  }, [isFilterOpen]);

  // فتح مودال إضافة مصروف
  const handleOpenAddExpenseModal = () => {
    setIsAddExpenseModalOpen(true);
    setTimeout(() => setIsModalAnimating(true), 50);
  };

  // إغلاق مودال إضافة مصروف
  const handleCloseAddExpenseModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setIsAddExpenseModalOpen(false);
      setNewExpense({
        amount: '',
        category: categories[0]?.name || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        isPaid: true
      });
    }, 300);
  };

  // إضافة مصروف جديد
  const handleAddExpense = async () => {
    try {
      if (!newExpense.amount || !newExpense.category || !newExpense.date) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      await addExpense({
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
        isPaid: newExpense.isPaid
      });

      handleCloseAddExpenseModal();
    } catch (error) {
      alert('حدث خطأ في إضافة المصروف');
    }
  };

  // إضافة فئة جديدة
  const handleAddCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        alert('يرجى إدخال اسم الفئة');
        return;
      }

      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddCategoryModalOpen(false);
    } catch (error) {
      alert('حدث خطأ في إضافة الفئة');
    }
  };

  // حذف فئة
  const handleDeleteCategory = async () => {
    try {
      if (!categoryToDelete) return;

      await deleteCategory(categoryToDelete.id);
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      alert('حدث خطأ في حذف الفئة');
    }
  };

  // تغيير التاريخ
  const handlePreviousDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  // تغيير الشهر
  const handlePreviousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // تبديل حالة الدفع مباشرة (بدون تأكيد)
  const handleTogglePaymentStatus = async (expenseId: string) => {
    await togglePaymentStatus(expenseId);
  };

  // فتح مودال تأكيد الدفع
  const handleOpenPaymentConfirmModal = (expenseId: string) => {
    setExpenseToMarkPaid(expenseId);
    setIsPaymentConfirmModalOpen(true);
    setTimeout(() => setIsModalAnimating(true), 50);
  };

  // إغلاق مودال تأكيد الدفع
  const handleClosePaymentConfirmModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setIsPaymentConfirmModalOpen(false);
      setExpenseToMarkPaid(null);
    }, 300);
  };

  // تأكيد الدفع
  const handleConfirmPayment = async () => {
    if (expenseToMarkPaid) {
      await togglePaymentStatus(expenseToMarkPaid);
      handleClosePaymentConfirmModal();
    }
  };

  return (
    <div className="p-6 min-h-screen">
      {/* زر إضافة مصروف جديد */}
      <div className="flex justify-end mb-8">
        <button
          onClick={handleOpenAddExpenseModal}
          className="flex items-center px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          style={{ 
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' 
          }}
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة مصروف جديد
        </button>
      </div>

      {/* قسم مصاريف اليوم */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 relative overflow-hidden">
          {/* خلفية تدرج */}
          <div className="absolute inset-0 opacity-10" style={{
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
          }}></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-1 h-6 rounded-sm ml-3" style={{
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)'
                }}></div>
                مصاريف اليوم
              </h2>

              {/* منتقي التاريخ */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={handlePreviousDay}
                  className="p-2 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #4A90A4 100%)'
                  }}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>

                <div className="px-4 py-2 bg-gray-100 rounded-lg min-w-[180px] text-center">
                  <span className="text-sm font-semibold text-gray-800">
                    {format(selectedDate, 'dd/MM/yyyy')}
                  </span>
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #4A90A4 100%)'
                  }}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {selectedDateExpenses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-right" style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">الفئة</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">المبلغ</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">حالة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedDateExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {expense.amount.toLocaleString()} أ.ل.س
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleTogglePaymentStatus(expense.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              expense.isPaid
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {expense.isPaid ? 'مدفوع' : 'غير مدفوع'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">الإجمالي:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {selectedDateTotal.toLocaleString()} أ.ل.س
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد مصاريف لهذا اليوم</p>
            </div>
          )}
        </div>
      </div>

      {/* قسم ملخص المصاريف الشهرية */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 relative overflow-hidden">
          {/* خلفية تدرج */}
          <div className="absolute inset-0 opacity-10" style={{ 
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' 
          }}></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-1 h-6 rounded-sm ml-3" style={{ 
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' 
                }}></div>
                ملخص المصاريف الشهرية
              </h2>
              
              {/* منتقي الشهر */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #4A90A4 100%)' 
                  }}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
                
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <span className="text-sm font-semibold text-gray-800">
                    شهر {format(selectedMonth, 'MM yyyy')}
                  </span>
                </div>
                
                <button
                  onClick={handleNextMonth}
                  className="p-2 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #4A90A4 100%)' 
                  }}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* مؤشر التحميل للملخص الشهري */}
          {loadingState.isLoadingMonthly && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">جاري تحميل الملخص الشهري...</span>
                <span className="text-sm text-blue-600">{loadingState.loadingProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingState.loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* رسالة خطأ */}
          {loadingState.error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="text-sm text-red-700">{loadingState.error}</span>
            </div>
          )}

          {Object.keys(monthlyCategorySummary).length > 0 && !monthlySummary.isLoading ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-right" style={{ 
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' 
                    }}>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">الفئة</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">إجمالي المبلغ</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">عدد المصاريف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(monthlySummary.categoryBreakdown).map(([category, categoryStats]) => {
                      return (
                        <tr key={category} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{category}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {categoryStats.totalAmount.toLocaleString()} أ.ل.س
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {categoryStats.expenseCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">الإجمالي العام:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {monthlyTotal.toLocaleString()} أ.ل.س
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد مصاريف لهذا الشهر</p>
            </div>
          )}
        </div>
      </div>

      {/* مكون التصفية المتقدمة */}
      <ExpenseAdvancedFilter
        filters={advancedFilters}
        onFiltersChange={handleFiltersChange}
        categories={categories.map(cat => cat.name)}
        isOpen={isFilterOpen}
        onToggle={toggleFilterPanel}
        onReset={handleResetFilters}
        totalResults={paginatedUnpaidExpenses.totalItems}
      />

      {/* قسم المصاريف غير المدفوعة */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 relative overflow-hidden">
          {/* خلفية تدرج */}
          <div className="absolute inset-0 opacity-10" style={{
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
          }}></div>
          <div className="relative">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="w-1 h-6 rounded-sm ml-3" style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)'
              }}></div>
              المصاريف غير المدفوعة ({paginatedUnpaidExpenses.totalItems})
            </h2>
          </div>
        </div>

        <div className="p-6">
          {/* مؤشر التحميل للصفحات */}
          {loadingState.isLoadingPagination && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">جاري تحميل الصفحة...</span>
                <span className="text-sm text-blue-600">{loadingState.loadingProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingState.loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {paginatedUnpaidExpenses.totalItems > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-right" style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">التاريخ</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">الفئة</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">المبلغ</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {unpaidExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(expense.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{expense.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {expense.amount.toLocaleString()} أ.ل.س
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleOpenPaymentConfirmModal(expense.id)}
                            className="px-3 py-1 text-white rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 text-xs"
                            style={{
                              background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)'
                            }}
                          >
                            تم الدفع
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* مكون pagination */}
              {paginatedUnpaidExpenses.totalPages > 1 && (
                <div className="mt-6">
                  <ExpensePagination
                    currentPage={paginatedUnpaidExpenses.currentPage}
                    totalPages={paginatedUnpaidExpenses.totalPages}
                    totalItems={paginatedUnpaidExpenses.totalItems}
                    itemsPerPage={paginatedUnpaidExpenses.itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    isLoading={loadingState.isLoadingPagination}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">جميع المصاريف مدفوعة</p>
            </div>
          )}
        </div>
      </div>

      {/* قسم إدارة فئات المصاريف */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 relative overflow-hidden">
          {/* خلفية تدرج */}
          <div className="absolute inset-0 opacity-10" style={{ 
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' 
          }}></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-1 h-6 rounded-sm ml-3" style={{ 
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' 
                }}></div>
                إدارة فئات المصاريف
              </h2>
              
              <button
                onClick={() => setIsAddCategoryModalOpen(true)}
                className="flex items-center px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)' 
                }}
              >
                <PlusIcon className="h-4 w-4 ml-2" />
                إضافة فئة جديدة
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <TagIcon className="h-5 w-5 text-gray-400 ml-2" />
                  <span className="text-sm font-medium text-gray-800">{category.name}</span>
                </div>
                
                {canDeleteCategory(category.id) && (
                  <button
                    onClick={() => {
                      setCategoryToDelete(category);
                      setIsDeleteCategoryModalOpen(true);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف الفئة"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* مودال إضافة مصروف */}
      {isAddExpenseModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            margin: 0, padding: 0
          }}
          onClick={handleCloseAddExpenseModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ${
              isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">إضافة مصروف جديد</h3>
              <button
                onClick={handleCloseAddExpenseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* حقل الفئة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* حقل المبلغ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* حقل التاريخ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* حقل حالة الدفع */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    حالة الدفع *
                  </label>
                  <select
                    value={newExpense.isPaid ? 'paid' : 'unpaid'}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, isPaid: e.target.value === 'paid' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="paid">مدفوع</option>
                    <option value="unpaid">غير مدفوع</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse mt-6">
                <button
                  onClick={handleCloseAddExpenseModal}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddExpense}
                  className="px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' 
                  }}
                >
                  إضافة المصروف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة فئة */}
      {isAddCategoryModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsAddCategoryModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">إضافة فئة جديدة</h3>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفئة *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم الفئة"
                />
              </div>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)' 
                  }}
                >
                  إضافة الفئة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد حذف الفئة */}
      {isDeleteCategoryModalOpen && categoryToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsDeleteCategoryModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">تأكيد الحذف</h3>
              <button
                onClick={() => setIsDeleteCategoryModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">
                هل أنت متأكد من حذف فئة "{categoryToDelete.name}"؟
              </p>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button
                  onClick={() => setIsDeleteCategoryModalOpen(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الدفع */}
      {isPaymentConfirmModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            margin: 0, padding: 0
          }}
          onClick={handleClosePaymentConfirmModal}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
              isModalAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)'
              }}>
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">تأكيد الدفع</h3>
              <p className="text-gray-600 mb-6">
                هل تريد تأكيد دفع هذا المصروف؟
              </p>

              <div className="flex justify-center space-x-3 rtl:space-x-reverse">
                <button
                  onClick={handleClosePaymentConfirmModal}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-6 py-2 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)'
                  }}
                >
                  تأكيد الدفع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
