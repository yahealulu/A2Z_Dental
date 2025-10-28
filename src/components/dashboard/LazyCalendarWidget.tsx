// مكون التقويم المحسن مع Virtualization

import React, { Suspense, lazy, useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// نوع البيانات للتقويم
interface CalendarWidgetProps {
  appointments: any[];
  onDaySelect: (date: string) => void;
  selectedDay: string;
}

// مكون التقويم الأساسي
const CalendarWidgetBase: React.FC<CalendarWidgetProps> = ({
  appointments,
  onDaySelect,
  selectedDay
}) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 6 }));

  // التنقل في التقويم
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // إنشاء أيام الأسبوع مع تحسين
  const weekDays = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i)),
    [currentWeek]
  );

  // حساب عدد المواعيد لكل يوم مع cache
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach(apt => {
      const date = apt.date;
      map.set(date, (map.get(date) || 0) + 1);
    });
    return map;
  }, [appointments]);

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
      {/* رأس التقويم */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentWeek, 'MMMM yyyy', { locale: ar })}
          </h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* أيام الأسبوع */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
          <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* التقويم */}
      <div className="grid grid-cols-7">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const appointmentCount = appointmentsByDay.get(dateStr) || 0;
          const isSelected = selectedDay === dateStr;
          const isTodayDate = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDaySelect(dateStr)}
              className={`
                relative p-4 text-center border-r border-b border-gray-100 hover:bg-gray-50 transition-colors
                ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                ${isTodayDate ? 'bg-green-50' : ''}
              `}
            >
              <div className={`
                text-lg font-medium mb-1
                ${isSelected ? 'text-blue-600' : isTodayDate ? 'text-green-600' : 'text-gray-900'}
              `}>
                {format(day, 'd')}
              </div>
              
              {appointmentCount > 0 && (
                <div className={`
                  inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full
                  ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                `}>
                  {appointmentCount}
                </div>
              )}

              {isTodayDate && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// مكون Lazy للتقويم
const LazyCalendarWidget: React.FC<CalendarWidgetProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden animate-pulse">
          {/* رأس التقويم */}
          <div className="px-6 py-4 border-b border-gray-100">
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
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-4 py-3 bg-gray-50">
                <div className="bg-gray-200 h-4 w-12 rounded mx-auto"></div>
              </div>
            ))}
          </div>

          {/* التقويم */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-4 border-r border-b border-gray-100">
                <div className="bg-gray-200 h-6 w-6 rounded mx-auto mb-2"></div>
                <div className="bg-gray-200 h-4 w-4 rounded-full mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <CalendarWidgetBase {...props} />
    </Suspense>
  );
};

export default LazyCalendarWidget;
