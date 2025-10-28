import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTreatmentStore, type Treatment } from '../store/treatmentStore';
import { useDataPagination } from '../hooks/usePatientDetailsOptimization';

interface OptimizedTreatmentsListProps {
  patientId: number;
  paymentDistribution: any;
  totalPaid: number;
  itemsPerPage?: number;
}

const OptimizedTreatmentsList: React.FC<OptimizedTreatmentsListProps> = ({
  patientId,
  paymentDistribution,
  totalPaid,
  itemsPerPage = 5
}) => {
  const { getCompletedTreatmentsByPatient } = useTreatmentStore();
  const [sortBy, setSortBy] = useState<'date' | 'cost' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // الحصول على العلاجات المكتملة (باستثناء العلاجات القديمة التي تكلفتها 0)
  const treatments = useMemo(() => {
    return getCompletedTreatmentsByPatient(patientId).filter(treatment => treatment.cost > 0);
  }, [patientId, getCompletedTreatmentsByPatient]);

  // ترتيب العلاجات
  const sortedTreatments = useMemo(() => {
    return [...treatments].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const getValidDate = (treatment: any) => {
            try {
              if (treatment.status === 'completed' && treatment.endDate) {
                const endDate = new Date(treatment.endDate);
                return isNaN(endDate.getTime()) ? new Date(0) : endDate;
              } else if (treatment.startDate) {
                const startDate = new Date(treatment.startDate);
                return isNaN(startDate.getTime()) ? new Date(0) : startDate;
              }
              return new Date(0);
            } catch (error) {
              return new Date(0);
            }
          };

          const dateA = getValidDate(a);
          const dateB = getValidDate(b);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [treatments, sortBy, sortOrder]);

  // استخدام التقسيم إلى صفحات
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedTreatments,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage
  } = useDataPagination(sortedTreatments, itemsPerPage);

  // دالة تغيير الترتيب
  const handleSort = (newSortBy: 'date' | 'cost' | 'name') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // دالة الحصول على أيقونة الترتيب
  const getSortIcon = (column: 'date' | 'cost' | 'name') => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (treatments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد علاجات مكتملة</h3>
        <p className="text-gray-500">لم يتم إكمال أي علاجات لهذا المريض بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* عنوان القسم مع إحصائيات */}
      <div className="flex justify-between items-center">
        <h4 className="text-base font-medium text-gray-900">
          العلاجات ({treatments.length})
        </h4>
        <div className="text-sm text-gray-500">
          صفحة {currentPage} من {totalPages}
        </div>
      </div>

      {/* جدول العلاجات */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="text-right" style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}>
              <th 
                scope="col" 
                className="py-3.5 pl-4 pr-3 text-sm font-bold text-white border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('name')}
              >
                العلاج {getSortIcon('name')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('date')}
              >
                التاريخ {getSortIcon('date')}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => handleSort('cost')}
              >
                التكلفة {getSortIcon('cost')}
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20">الطبيب</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20">الأسنان</th>
              <th scope="col" className="px-3 py-3.5 text-sm font-bold text-white border-b border-white/20">الملاحظات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedTreatments.map(treatment => {
              // تحديد حالة الدفع للعلاج
              const isFullyPaidTreatment = paymentDistribution.fullyPaidTreatments?.some((t: Treatment) => t.id === treatment.id);
              const isPartiallyPaidTreatment = paymentDistribution.partiallyPaidTreatments?.some((t: Treatment) => t.id === treatment.id);
              
              return (
                <tr key={treatment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <span>{treatment.name}</span>
                      {isFullyPaidTreatment && (
                        <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          مدفوع
                        </span>
                      )}
                      {isPartiallyPaidTreatment && (
                        <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          جزئي
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {(() => {
                      try {
                        if (treatment.status === 'completed' && treatment.endDate) {
                          const endDate = new Date(treatment.endDate);
                          return isNaN(endDate.getTime()) ? 'تاريخ غير صالح' : format(endDate, 'dd/MM/yyyy');
                        } else if (treatment.startDate) {
                          const startDate = new Date(treatment.startDate);
                          return isNaN(startDate.getTime()) ? 'تاريخ غير صالح' : format(startDate, 'dd/MM/yyyy');
                        }
                        return 'غير محدد';
                      } catch (error) {
                        return 'تاريخ غير صالح';
                      }
                    })()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    {treatment.cost.toLocaleString()} أ.ل.س
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {treatment.doctorName || 'غير محدد'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {treatment.teethNumbers && treatment.teethNumbers.length > 0
                      ? treatment.teethNumbers.join(', ')
                      : 'غير محدد'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={(() => {
                      const notes = treatment.finalNotes || treatment.notes || '';
                      return typeof notes === 'string' ? notes : '';
                    })()}>
                      {(() => {
                        const notes = treatment.finalNotes || treatment.notes;
                        if (!notes || typeof notes !== 'string' || notes.trim() === '') {
                          return '-';
                        }
                        return notes;
                      })()}
                    </div>
                  </td>
                </tr>
              );
            })}
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
                  {Math.min(currentPage * itemsPerPage, treatments.length)}
                </span>
                {' '}من{' '}
                <span className="font-medium">{treatments.length}</span>
                {' '}علاج
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}
                
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

export default OptimizedTreatmentsList;
