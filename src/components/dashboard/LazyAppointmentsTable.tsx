// مكون جدول المواعيد مع Lazy Loading

import React, { Suspense, lazy, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Table from '../Table';

// نوع البيانات للمواعيد
interface AppointmentsTableProps {
  appointments: any[];
  selectedDay: string;
  onStatusChange: (appointmentId: number, newStatus: string) => void;
  isLoading?: boolean;
}

// أعمدة الجدول مع تحسين
const createAppointmentColumns = (onStatusChange: (id: number, status: string) => void) => [
  {
    header: 'الوقت',
    accessor: (appointment: any) => appointment.time,
    className: 'font-medium text-gray-900'
  },
  {
    header: 'المريض',
    accessor: (appointment: any) => {
      // إذا كان المريض جديد، نعرضه باللون الأحمر وبدون رابط
      if (appointment.isNewPatient) {
        return (
          <span className="text-red-600 font-medium">
            {appointment.patientName} (جديد)
          </span>
        );
      }

      // إذا كان المريض موجود، نعرضه برابط للانتقال إلى صفحته
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/patients/${appointment.patientId}`;
          }}
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
        >
          {appointment.patientName}
        </button>
      );
    }
  },
  {
    header: 'الطبيب',
    accessor: (appointment: any) => appointment.doctorName || 'غير محدد',
    className: 'text-gray-600'
  },
  {
    header: 'الحالة',
    accessor: (appointment: any) => {
      return (
        <div className="flex items-center">
          <select
            value={appointment.status}
            onChange={(e) => {
              e.stopPropagation();
              const newStatus = e.target.value as 'scheduled' | 'completed' | 'cancelled';
              onStatusChange(appointment.id, newStatus);
            }}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="scheduled">مجدول</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      );
    }
  }
];

// مكون جدول المواعيد الأساسي
const AppointmentsTableBase: React.FC<AppointmentsTableProps> = ({
  appointments,
  selectedDay,
  onStatusChange,
  isLoading = false
}) => {
  // أعمدة الجدول مع memoization
  const appointmentColumns = useMemo(
    () => createAppointmentColumns(onStatusChange),
    [onStatusChange]
  );

  // تصفية المواعيد مع memoization
  const filteredAppointments = useMemo(
    () => appointments.filter(apt => apt.date === selectedDay),
    [appointments, selectedDay]
  );

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="p-2 rounded-xl mr-3" style={{ background: 'linear-gradient(135deg, #8A85B3 0%, #A472AE 100%)' }}>
            <ClipboardDocumentListIcon className="h-6 w-6" style={{ color: '#8A85B3' }} />
          </div>
          مواعيد {format(new Date(selectedDay), 'EEEE d MMMM', { locale: ar })}
        </h2>

        {filteredAppointments.length > 0 && !isLoading && (
          <div className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' }}>
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'موعد' : 'مواعيد'}
          </div>
        )}
      </div>

      {/* الجدول */}
      <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4 space-x-reverse">
                <div className="bg-gray-200 h-4 w-16 rounded"></div>
                <div className="bg-gray-200 h-4 w-32 rounded"></div>
                <div className="bg-gray-200 h-4 w-24 rounded"></div>
                <div className="bg-gray-200 h-4 w-20 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <Table
            columns={appointmentColumns}
            data={filteredAppointments}
            keyExtractor={(item) => item.id}
            emptyMessage="لا توجد مواعيد في هذا اليوم"
          />
        )}
      </div>
    </div>
  );
};

// مكون Lazy لجدول المواعيد
const LazyAppointmentsTable: React.FC<AppointmentsTableProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="space-y-6">
          {/* رأس القسم */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 rounded-xl mr-3 bg-gray-200 animate-pulse">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>
              <div className="bg-gray-200 h-8 w-48 rounded animate-pulse"></div>
            </div>
            <div className="bg-gray-200 h-8 w-24 rounded-xl animate-pulse"></div>
          </div>

          {/* الجدول */}
          <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 space-x-reverse">
                  <div className="bg-gray-200 h-4 w-16 rounded"></div>
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <AppointmentsTableBase {...props} />
    </Suspense>
  );
};

export default LazyAppointmentsTable;
