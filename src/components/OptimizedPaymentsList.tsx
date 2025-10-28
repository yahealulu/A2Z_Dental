import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { usePaymentStore, type Payment } from '../store/paymentStore';
import { useDataPagination } from '../hooks/usePatientDetailsOptimization';

interface OptimizedPaymentsListProps {
  patientId: number;
  itemsPerPage?: number;
}

const OptimizedPaymentsList: React.FC<OptimizedPaymentsListProps> = ({
  patientId,
  itemsPerPage = 5
}) => {
  const { getPaymentsByPatientId } = usePaymentStore();
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // الحصول على الدفعات
  const payments = useMemo(() => {
    return getPaymentsByPatientId(patientId);
  }, [patientId, getPaymentsByPatientId]);

  // ترتيب الدفعات
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const getValidPaymentDate = (payment: any) => {
            try {
              const date = new Date(payment.paymentDate);
              return isNaN(date.getTime()) ? new Date(0) : date;
            } catch (error) {
              return new Date(0);
            }
          };

          comparison = getValidPaymentDate(a).getTime() - getValidPaymentDate(b).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [payments, sortBy, sortOrder]);

  // استخدام التقسيم إلى صفحات
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPayments,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage
  } = useDataPagination(sortedPayments, itemsPerPage);

  // حساب إجمالي المبلغ المدفوع
  const totalPaid = useMemo(() => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  // دالة تغيير الترتيب
  const handleSort = (newSortBy: 'date' | 'amount') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // دالة الحصول على أيقونة الترتيب
  const getSortIcon = (column: 'date' | 'amount') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <BanknotesIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دفعات</h3>
        <p className="text-gray-500">لم يتم تسجيل أي دفعات لهذا المريض بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* عنوان القسم مع إحصائيات */}
      <div className="flex justify-between items-center">
        <h4 className="text-base font-medium text-gray-900">
          الدفعات ({payments.length})
        </h4>
        <div className="text-sm text-gray-500">
          صفحة {currentPage} من {totalPages}
        </div>
      </div>

      {/* جدول الدفعات */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="text-right" style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}>
              <th 
                scope="col" 
                className="py-3.5 pl-4 pr-3 text-sm font-bold text-white border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('date')}
              >
                التاريخ {getSortIcon('date')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('amount')}
              >
                المبلغ {getSortIcon('amount')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20">طريقة الدفع</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20">الملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedPayments.map((payment, index) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                  {(() => {
                    try {
                      const date = new Date(payment.paymentDate);
                      return isNaN(date.getTime()) ? 'تاريخ غير صالح' : format(date, 'dd/MM/yyyy');
                    } catch (error) {
                      return 'تاريخ غير صالح';
                    }
                  })()}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                  <span className="text-green-600 font-semibold">
                    {payment.amount.toLocaleString()} أ.ل.س
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <span className="inline-flex items-center">
                    <BanknotesIcon className="h-4 w-4 ml-1 text-gray-500" />
                    نقداً
                  </span>
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                  <div className="truncate" title={payment.notes || ''}>
                    {payment.notes || '-'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* أزرار التنقل بين الصفحات */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between flex-1 sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={!hasPreviousPage}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <button
              onClick={goToNextPage}
              disabled={!hasNextPage}
              className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                عرض{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}إلى{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, payments.length)}
                </span>
                {' '}من{' '}
                <span className="font-medium">{payments.length}</span>
                {' '}دفعة
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={!hasPreviousPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* أرقام الصفحات */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedPaymentsList;
