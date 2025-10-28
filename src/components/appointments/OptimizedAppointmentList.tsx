// مكون قائمة المواعيد المحسن

import React, { useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ClockIcon, 
  UserIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import type { OptimizedAppointment } from '../../utils/appointmentOptimization';

// نوع البيانات للمكون
interface OptimizedAppointmentListProps {
  appointments: OptimizedAppointment[];
  selectedDate: string;
  onStatusChange: (appointmentId: number, newStatus: string) => void;
  isLoading?: boolean;
  showSearch?: boolean;
  onSearch?: (term: string) => void;
}

// مكون بطاقة الموعد المحسن
const AppointmentCard: React.FC<{
  appointment: OptimizedAppointment;
  onStatusChange: (id: number, status: string) => void;
}> = ({ appointment, onStatusChange }) => {
  const handleStatusChange = useCallback((newStatus: string) => {
    onStatusChange(appointment.id, newStatus);
  }, [appointment.id, onStatusChange]);

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'scheduled':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      case 'scheduled':
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
      <div className="flex items-start justify-between">
        {/* معلومات الموعد */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 space-x-reverse mb-2">
            {/* الوقت */}
            <div className="flex items-center text-gray-600">
              <ClockIcon className="h-4 w-4 ml-1" />
              <span className="text-sm font-medium">{appointment.time}</span>
            </div>
            
            {/* الحالة */}
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              <span className="mr-1">
                {appointment.status === 'completed' ? 'مكتمل' : 
                 appointment.status === 'cancelled' ? 'ملغي' : 'مجدول'}
              </span>
            </div>
          </div>

          {/* اسم المريض */}
          <div className="flex items-center mb-2">
            <UserIcon className="h-4 w-4 text-gray-400 ml-2" />
            {appointment.isNewPatient ? (
              <span className="text-red-600 font-medium">
                {appointment.patientName} (جديد)
              </span>
            ) : (
              <button
                onClick={() => window.location.href = `/patients/${appointment.patientId}`}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
              >
                {appointment.patientName}
              </button>
            )}
          </div>

          {/* اسم الطبيب */}
          <div className="flex items-center text-gray-600">
            <UserGroupIcon className="h-4 w-4 ml-2" />
            <span className="text-sm">{appointment.doctorName}</span>
          </div>

          {/* الملاحظات إذا وجدت */}
          {appointment.notes && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {appointment.notes}
            </div>
          )}
        </div>

        {/* تحديث الحالة */}
        <div className="mr-4">
          <select
            value={appointment.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="scheduled">مجدول</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const OptimizedAppointmentList: React.FC<OptimizedAppointmentListProps> = ({
  appointments,
  selectedDate,
  onStatusChange,
  isLoading = false,
  showSearch = false,
  onSearch
}) => {
  // تصفية المواعيد للتاريخ المحدد مع ترتيب محسن
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === selectedDate)
      .sort((a, b) => a.timeSlot - b.timeSlot);
  }, [appointments, selectedDate]);

  // معالج البحث
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(e.target.value);
    }
  }, [onSearch]);

  // تنسيق عرض التاريخ
  const formattedDate = useMemo(() => {
    try {
      return format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: ar });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  if (isLoading) {
    return (
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

        {/* قائمة المواعيد */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-gray-200 h-4 w-16 rounded"></div>
                    <div className="bg-gray-200 h-6 w-20 rounded-full"></div>
                  </div>
                  <div className="bg-gray-200 h-4 w-32 rounded"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded"></div>
                </div>
                <div className="bg-gray-200 h-8 w-20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <div className="p-2 rounded-xl mr-3" style={{ background: 'linear-gradient(135deg, #8A85B3 0%, #A472AE 100%)' }}>
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
          </div>
          مواعيد {formattedDate}
        </h2>

        {filteredAppointments.length > 0 && (
          <div className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' }}>
            {filteredAppointments.length} {filteredAppointments.length === 1 ? 'موعد' : 'مواعيد'}
          </div>
        )}
      </div>

      {/* شريط البحث */}
      {showSearch && onSearch && (
        <div className="relative">
          <input
            type="text"
            placeholder="البحث في المواعيد..."
            onChange={handleSearch}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* قائمة المواعيد */}
      {filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مواعيد</h3>
          <p className="text-gray-500">لا توجد مواعيد مجدولة في هذا اليوم</p>
        </div>
      )}
    </div>
  );
};

export default OptimizedAppointmentList;
