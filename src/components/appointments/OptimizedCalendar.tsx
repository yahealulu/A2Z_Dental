// مكون التقويم المحسن للمواعيد

import React, { useMemo, useCallback } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

// نوع البيانات لليوم في التقويم
interface CalendarDay {
  date: string;
  day: number;
  isToday: boolean;
  appointmentCount: number;
  appointments: any[];
}

// نوع البيانات للمكون
interface OptimizedCalendarProps {
  currentDate: Date;
  selectedDate: string;
  calendarDays: CalendarDay[];
  onDateSelect: (date: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  isLoading?: boolean;
}

const OptimizedCalendar: React.FC<OptimizedCalendarProps> = ({
  currentDate,
  selectedDate,
  calendarDays,
  onDateSelect,
  onNavigate,
  isLoading = false
}) => {
  // أسماء أيام الأسبوع
  const weekDays = useMemo(() => [
    'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'
  ], []);

  // التنقل في الشهور
  const handlePrevMonth = useCallback(() => {
    onNavigate('prev');
  }, [onNavigate]);

  const handleNextMonth = useCallback(() => {
    onNavigate('next');
  }, [onNavigate]);

  // تحديد اليوم
  const handleDayClick = useCallback((date: string) => {
    onDateSelect(date);
  }, [onDateSelect]);

  // تنسيق عرض الشهر والسنة
  const monthYearDisplay = useMemo(() => {
    return format(currentDate, 'MMMM yyyy', { locale: ar });
  }, [currentDate]);

  // تجميع الأيام في أسابيع للعرض
  const weekRows = useMemo(() => {
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // إضافة أيام فارغة في بداية الشهر إذا لزم الأمر
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7; // تعديل لبداية الأسبوع من السبت

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        day: 0,
        isToday: false,
        appointmentCount: 0,
        appointments: []
      });
    }

    // إضافة أيام الشهر
    calendarDays.forEach(day => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // إكمال الأسبوع الأخير إذا لزم الأمر
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({
        date: '',
        day: 0,
        isToday: false,
        appointmentCount: 0,
        appointments: []
      });
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [calendarDays, currentDate]);

  if (isLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden animate-pulse">
        {/* رأس التقويم */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="bg-gray-200 h-6 w-32 rounded"></div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="bg-gray-200 h-8 w-8 rounded-lg"></div>
              <div className="bg-gray-200 h-8 w-8 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* أيام الأسبوع */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((_, i) => (
            <div key={i} className="px-4 py-3 bg-gray-50">
              <div className="bg-gray-200 h-4 w-12 rounded mx-auto"></div>
            </div>
          ))}
        </div>

        {/* التقويم */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="p-4 border-r border-b border-gray-100 h-20">
              <div className="bg-gray-200 h-6 w-6 rounded mx-auto mb-2"></div>
              <div className="bg-gray-200 h-4 w-4 rounded-full mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
      {/* رأس التقويم */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarIcon className="h-6 w-6 text-blue-600 ml-2" />
            <h2 className="text-xl font-bold text-gray-800">
              {monthYearDisplay}
            </h2>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="الشهر السابق"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="الشهر التالي"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* أيام الأسبوع */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map((day) => (
          <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* التقويم - عرض محسن */}
      <div className="divide-y divide-gray-100">
        {weekRows.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-100">
            {week.map((day, dayIndex) => {
              if (!day.date) {
                // يوم فارغ
                return (
                  <div key={dayIndex} className="h-20 bg-gray-25"></div>
                );
              }

              const isSelected = selectedDate === day.date;
              const hasAppointments = day.appointmentCount > 0;

              return (
                <button
                  key={day.date}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    relative h-20 p-2 text-center hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                    ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                    ${day.isToday ? 'bg-green-50' : ''}
                    ${hasAppointments ? 'hover:bg-blue-25' : ''}
                  `}
                >
                  {/* رقم اليوم */}
                  <div className={`
                    text-lg font-medium mb-1 transition-colors duration-200
                    ${isSelected ? 'text-blue-600' : day.isToday ? 'text-green-600' : 'text-gray-900'}
                  `}>
                    {day.day}
                  </div>
                  
                  {/* عدد المواعيد */}
                  {hasAppointments && (
                    <div className={`
                      inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : day.isToday 
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}>
                      {day.appointmentCount}
                    </div>
                  )}

                  {/* مؤشر اليوم الحالي */}
                  {day.isToday && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}

                  {/* مؤشر اليوم المحدد */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* إحصائيات سريعة */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            إجمالي المواعيد: {calendarDays.reduce((sum, day) => sum + day.appointmentCount, 0)}
          </span>
          <span>
            {format(new Date(selectedDate), 'EEEE d MMMM', { locale: ar })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OptimizedCalendar;
