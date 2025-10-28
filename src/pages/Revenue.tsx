import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BanknotesIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useRevenueOptimization } from '../hooks/useRevenueOptimization';


const Revenue = () => {
  // استخدام الـ hook المحسن مع التحميل التدريجي والفهرسة
  const {
    getOptimizedDailyRevenue,
    getOptimizedMonthlyStats,
    calculateDailyTotal,
    preloadAdjacentDates,
    preloadAdjacentMonths,
    loadingState,
    buildDateIndexes
  } = useRevenueOptimization();

  // حالة التاريخ والشهر
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // بيانات إيرادات اليوم المحدد - محسنة للأداء مع cache ذكي
  const selectedDateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  const selectedDateRevenue = useMemo(() => {
    return getOptimizedDailyRevenue(selectedDateString);
  }, [selectedDateString, getOptimizedDailyRevenue]);

  const selectedDateTotal = useMemo(() => {
    return calculateDailyTotal(selectedDateRevenue);
  }, [selectedDateRevenue, calculateDailyTotal]);

  // بيانات الشهر المحدد - محسنة للأداء مع cache ذكي
  const selectedMonthKey = useMemo(() => ({
    year: selectedMonth.getFullYear(),
    month: selectedMonth.getMonth() + 1
  }), [selectedMonth]);

  const monthlyStats = useMemo(() => {
    return getOptimizedMonthlyStats(selectedMonthKey.year, selectedMonthKey.month);
  }, [selectedMonthKey.year, selectedMonthKey.month, getOptimizedMonthlyStats]);

  // استخراج القيم من الإحصائيات المحسنة
  const monthlyRevenue = monthlyStats.revenue;
  const monthlyExpenses = monthlyStats.expenses;
  const monthlyNetProfit = monthlyStats.netProfit;

  // التحميل المسبق للبيانات المجاورة
  useEffect(() => {
    // تحميل مسبق للتواريخ المجاورة
    preloadAdjacentDates(selectedDateString);
  }, [selectedDateString, preloadAdjacentDates]);

  useEffect(() => {
    // تحميل مسبق للأشهر المجاورة
    preloadAdjacentMonths(selectedMonthKey.year, selectedMonthKey.month);
  }, [selectedMonthKey.year, selectedMonthKey.month, preloadAdjacentMonths]);

  // إعادة بناء الفهارس عند تغيير البيانات (مرة واحدة عند التحميل)
  useEffect(() => {
    buildDateIndexes();
  }, [buildDateIndexes]);

  // دوال التنقل بين التواريخ
  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const handlePreviousMonth = () => {
    const previousMonth = new Date(selectedMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setSelectedMonth(previousMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedMonth(nextMonth);
  };

  return (
    <div className="p-6 min-h-screen">
      {/* جدول إيرادات اليوم */}
      <div className="bg-white rounded-2xl shadow-lg mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 ml-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">إيرادات اليوم</h2>
                <p className="text-sm text-gray-500">
                  {format(selectedDate, 'EEEE، dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handlePreviousDay}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* مؤشر التحميل للبيانات اليومية */}
          {loadingState.isLoadingDaily && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">جاري تحميل البيانات...</span>
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

          {selectedDateRevenue.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-right" style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">قيمة الدفعة</th>
                      <th className="px-4 py-4 text-sm font-bold text-white border-b border-white/20">اسم المريض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedDateRevenue.map((revenue) => (
                      <tr key={revenue.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {revenue.amount.toLocaleString()} أ.ل.س
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{revenue.patientName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">إجمالي إيرادات اليوم:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {selectedDateTotal.toLocaleString()} أ.ل.س
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BanknotesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد إيرادات لهذا اليوم</p>
            </div>
          )}
        </div>
      </div>

      {/* جدول الإيرادات الشهرية */}
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 ml-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">الإيرادات الشهرية</h2>
                <p className="text-sm text-gray-500">
                  {format(selectedMonth, 'MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handlePreviousMonth}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* مؤشر التحميل للإحصائيات الشهرية */}
          {loadingState.isLoadingMonthly && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">جاري تحميل الإحصائيات الشهرية...</span>
                <span className="text-sm text-green-600">{loadingState.loadingProgress}%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingState.loadingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {monthlyRevenue.toLocaleString()} أ.ل.س
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">إجمالي المصاريف</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {monthlyExpenses.toLocaleString()} أ.ل.س
                  </p>
                </div>
                <BanknotesIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className={`bg-gradient-to-br ${monthlyNetProfit >= 0 ? 'from-blue-50 to-blue-100' : 'from-orange-50 to-orange-100'} p-6 rounded-xl border ${monthlyNetProfit >= 0 ? 'border-blue-200' : 'border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${monthlyNetProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>صافي الربح</p>
                  <p className={`text-2xl font-bold ${monthlyNetProfit >= 0 ? 'text-blue-700' : 'text-orange-700'} mt-1`}>
                    {monthlyNetProfit.toLocaleString()} أ.ل.س
                  </p>
                </div>
                <ArrowTrendingUpIcon className={`h-8 w-8 ${monthlyNetProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
