import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CalendarIcon,
  UserGroupIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAppointmentStore, type Appointment } from '../store/appointmentStore';
import { usePatientStore } from '../store/patientStore';
import { useExpenseStore } from '../store/expenseStore';
import { useDashboardOptimization } from '../hooks/useDashboardOptimization';
import Table from '../components/Table';

const Dashboard = () => {
  // Store hooks
  const { appointments, updateAppointment } = useAppointmentStore();
  const { patients } = usePatientStore();
  const { expenses } = useExpenseStore();

  // Hook محسن للوحة التحكم
  const {
    stats,
    isLoading,
    isRefreshing,
    error,
    getTodayRevenue,
    getTodayAppointmentsCount,
    getMonthlyProfit,
    getTodayAppointmentsList,
    getQuickSummary,
    refresh,
    hasData
  } = useDashboardOptimization();

  // State for calendar
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 6 }));
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calendar navigation
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  // مراقبة تغييرات المواعيد وتنظيف cache
  useEffect(() => {
    // تنظيف cache المواعيد عند تغيير البيانات
    const { appointments } = useAppointmentStore.getState();
    if (appointments.length > 0) {
      // استيراد dashboardOptimizer بشكل ديناميكي لتجنب circular imports
      import('../utils/dashboardOptimization').then(({ dashboardOptimizer }) => {
        dashboardOptimizer.invalidateCache('appointments');
      });
    }
  }, [useAppointmentStore().appointments.length]);



  const handleChangeStatus = (appointmentId: number, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    // تحديث حالة الموعد باستخدام المتجر
    updateAppointment(appointmentId, { status: newStatus });
  };

  // تصفية المواعيد حسب اليوم المحدد - محسنة
  const selectedDayAppointments = useMemo(() => {
    // إذا كان اليوم المحدد هو اليوم الحالي، استخدم البيانات المحسنة
    const today = format(new Date(), 'yyyy-MM-dd');
    if (selectedDay === today && hasData && stats) {
      // تحويل البيانات المحسنة إلى تنسيق المواعيد
      return stats.todayAppointments.map(apt => ({
        id: apt.id,
        patientName: apt.patientName,
        time: apt.time,
        status: apt.status,
        doctorName: apt.doctorName,
        date: selectedDay,
        patientId: apt.patientId,
        isNewPatient: apt.isNewPatient,
        treatment: apt.treatment
      }));
    }

    // للأيام الأخرى، استخدم التصفية العادية
    return appointments.filter(appointment => appointment.date === selectedDay);
  }, [selectedDay, hasData, stats, appointments]);



  // Statistics data - محسنة مع cache
  const updatedStats = useMemo(() => {
    if (!hasData || !stats) {
      return [
        {
          title: 'إجمالي المرضى',
          value: '...',
          subtitle: 'جاري التحميل',
          icon: UserGroupIcon
        },
        {
          title: 'المواعيد اليوم',
          value: '...',
          subtitle: 'جاري التحميل',
          icon: CalendarIcon
        },
        {
          title: 'إجمالي المصاريف',
          value: '...',
          subtitle: 'جاري التحميل',
          icon: BanknotesIcon
        }
      ];
    }

    return [
      {
        title: 'إجمالي المرضى',
        value: stats.quickStats.totalPatients.toString(),
        subtitle: 'مريض مسجل في النظام',
        icon: UserGroupIcon
      },
      {
        title: 'المواعيد اليوم',
        value: stats.todayStats.appointmentsCount.toString(),
        subtitle: 'موعد مجدول لهذا اليوم',
        icon: CalendarIcon
      },
      {
        title: 'إجمالي المصاريف',
        value: `${stats.monthlyStats.totalExpenses.toLocaleString()} أ.ل.س`,
        subtitle: 'مصروف هذا الشهر',
        icon: BanknotesIcon
      }
    ];
  }, [hasData, stats]);

  // Appointment columns for table
  const appointmentColumns: Array<{
    header: string;
    accessor: (appointment: Appointment) => any;
    className?: string;
  }> = [
    {
      header: 'الوقت',
      accessor: (appointment: Appointment) => appointment.time,
      className: 'font-medium text-gray-900'
    },
    {
      header: 'المريض',
      accessor: (appointment: Appointment) => {
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
      accessor: (appointment: Appointment) => appointment.doctorName
    },
    {
      header: 'العلاج',
      accessor: (appointment: Appointment) => appointment.treatment
    },
    {
      header: 'الحالة',
      accessor: (appointment: Appointment) => {
        const statusClasses = {
          scheduled: 'bg-blue-100 text-blue-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800'
        };

        const statusLabels = {
          scheduled: 'مجدول',
          completed: 'مكتمل',
          cancelled: 'ملغي'
        };

        return (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[appointment.status]}`}>
              {statusLabels[appointment.status]}
            </span>
            <select
              className="text-xs border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={appointment.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const newStatus = e.target.value as 'scheduled' | 'completed' | 'cancelled';
                handleChangeStatus(appointment.id, newStatus);
              }}
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



  // معالجة حالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* مؤشر التحديث */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50 bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
          <span className="text-blue-800 text-sm">جاري تحديث البيانات...</span>
        </div>
      )}

      <div className="px-6 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* بطاقة المرضى */}
          <div className="card card-blue animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{updatedStats[0].title}</h3>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                    ) : (
                      updatedStats[0].value
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-white/80">{updatedStats[0].subtitle}</p>
                <div className="w-full h-2 bg-white/20 rounded-full mt-2">
                  <div className="h-2 bg-white/60 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة المواعيد */}
          <div className="card card-purple animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{updatedStats[1].title}</h3>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                    ) : (
                      updatedStats[1].value
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-white/80">{updatedStats[1].subtitle}</p>
                <div className="w-full h-2 bg-white/20 rounded-full mt-2">
                  <div className="h-2 bg-white/60 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* بطاقة المصاريف */}
          <div className="card card-pink animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{updatedStats[2].title}</h3>
                  <div className="text-3xl font-bold text-white">
                    {isLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-20 rounded"></div>
                    ) : (
                      updatedStats[2].value
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <BanknotesIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-white/80">{updatedStats[2].subtitle}</p>
                <div className="w-full h-2 bg-white/20 rounded-full mt-2">
                  <div className="h-2 bg-white/60 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl ml-3">
                  <CalendarIcon className="h-6 w-6" style={{ color: '#2A7B9B' }} />
                </div>
                التقويم الأسبوعي
              </h2>

              {/* Calendar Navigation */}
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button
                  type="button"
                  onClick={goToPreviousWeek}
                  className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:scale-105 shadow-sm"
                >
                  <ChevronRightIcon className="h-5 w-5" style={{ color: '#2A7B9B' }} />
                </button>
                <div className="px-6 py-3 rounded-xl text-white font-bold text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' }}>
                  {format(currentWeek, 'MMMM yyyy', { locale: ar })}
                </div>
                <button
                  type="button"
                  onClick={goToNextWeek}
                  className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:scale-105 shadow-sm"
                >
                  <ChevronLeftIcon className="h-5 w-5" style={{ color: '#A472AE' }} />
                </button>
              </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
              <div className="grid grid-cols-7 gap-0">
                {weekDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDay === dayStr;
                  const dayAppointments = appointments.filter((a: Appointment) => a.date === dayStr);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dayStr}
                      className={`p-4 border-l border-gray-100 last:border-l-0 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-gray-100'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDay(dayStr)}
                    >
                      <div className="text-center">
                        <div className="text-base font-semibold mb-2 text-gray-700">
                          {format(day, 'EEEE', { locale: ar })}
                        </div>
                        <div className="text-2xl font-bold mb-3 text-gray-900">
                          {format(day, 'd')}
                        </div>
                        {dayAppointments.length > 0 && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                              {dayAppointments.length} {dayAppointments.length === 1 ? 'موعد' : 'مواعيد'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Appointments Table */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl ml-3">
                  <ClipboardDocumentListIcon className="h-6 w-6" style={{ color: '#8A85B3' }} />
                </div>
                مواعيد {format(new Date(selectedDay), 'EEEE d MMMM', { locale: ar })}
              </h2>

              {selectedDayAppointments.length > 0 && (
                <div className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' }}>
                  {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'موعد' : 'مواعيد'}
                </div>
              )}
            </div>

            <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
              <Table
                columns={appointmentColumns}
                data={selectedDayAppointments}
                keyExtractor={(item) => item.id}
                emptyMessage="لا توجد مواعيد في هذا اليوم"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
