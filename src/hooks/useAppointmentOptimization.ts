// Hook محسن للمواعيد

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { appointmentOptimizer } from '../utils/appointmentOptimization';
import type { OptimizedAppointment } from '../utils/appointmentOptimization';
import { useAppointmentStore } from '../store/appointmentStore';
import { usePatientStore } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';

// نوع البيانات لحالة التحميل
interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdate: number;
}

// نوع البيانات للتقويم
interface CalendarState {
  currentDate: Date;
  selectedDate: string;
  viewMode: 'month' | 'week' | 'day';
}

// نوع البيانات للبحث والتصفية
interface FilterState {
  searchTerm: string;
  statusFilter: string;
  doctorFilter: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
}

export const useAppointmentOptimization = () => {
  // البيانات من المتاجر
  const { appointments, updateAppointment } = useAppointmentStore();
  const { patients } = usePatientStore();
  const { doctors } = useDoctorStore();

  // حالة التقويم
  const [calendarState, setCalendarState] = useState<CalendarState>({
    currentDate: new Date(),
    selectedDate: format(new Date(), 'yyyy-MM-dd'),
    viewMode: 'month'
  });

  // حالة التصفية والبحث
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    doctorFilter: 'all',
    dateRange: null
  });

  // حالة التحميل
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdate: 0
  });

  // البيانات المحسنة
  const [optimizedData, setOptimizedData] = useState<{
    currentMonth: OptimizedAppointment[];
    previousMonth: OptimizedAppointment[];
    nextMonth: OptimizedAppointment[];
    calendarData: Map<string, { count: number; hasToday: boolean }>;
    stats: any;
  } | null>(null);

  // مرجع للبيانات السابقة
  const prevDataRef = useRef({
    appointmentsLength: 0,
    currentMonth: format(new Date(), 'yyyy-MM')
  });

  // إنشاء خرائط للبحث السريع
  const patientMap = useMemo(() => 
    new Map(patients.map(p => [p.id, p])),
    [patients]
  );

  const doctorMap = useMemo(() => 
    new Map(doctors.map(d => [d.id, d])),
    [doctors]
  );

  // دمج بيانات المواعيد مع المرضى والأطباء
  const enrichedAppointments = useMemo(() => {
    return appointments.map(apt => ({
      ...apt,
      patientName: patientMap.get(apt.patientId ?? 0)?.name || 'مريض غير معروف',
      doctorName: doctorMap.get(apt.doctorId ?? 0)?.name || 'طبيب غير محدد'
    }));
  }, [appointments, patientMap, doctorMap]);

  // تحميل البيانات المحسنة
  const loadOptimizedData = useCallback(async () => {
    try {
      setLoadingState(prev => ({
        ...prev,
        isLoading: !optimizedData,
        isRefreshing: !!optimizedData,
        error: null
      }));

      // الحصول على بيانات نطاق التواريخ
      const dateRangeData = appointmentOptimizer.getDateRangeAppointments(
        enrichedAppointments,
        calendarState.currentDate
      );

      // الحصول على بيانات التقويم
      const calendarData = appointmentOptimizer.getCalendarData(
        dateRangeData.current,
        calendarState.currentDate.getFullYear(),
        calendarState.currentDate.getMonth() + 1
      );

      // الحصول على الإحصائيات
      const stats = appointmentOptimizer.getAppointmentStats(dateRangeData.current);

      setOptimizedData({
        currentMonth: dateRangeData.current,
        previousMonth: dateRangeData.previous,
        nextMonth: dateRangeData.next,
        calendarData,
        stats
      });

      setLoadingState({
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdate: Date.now()
      });

    } catch (error) {
      console.error('Error loading optimized appointment data:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: 'فشل في تحميل بيانات المواعيد'
      }));
    }
  }, [enrichedAppointments, calendarState.currentDate, optimizedData]);

  // تحميل أولي للبيانات
  useEffect(() => {
    if (enrichedAppointments.length >= 0) {
      loadOptimizedData();
    }
  }, [enrichedAppointments.length, calendarState.currentDate]);

  // مراقبة التغييرات في البيانات
  useEffect(() => {
    const currentMonth = format(calendarState.currentDate, 'yyyy-MM');
    const hasDataChanged = 
      appointments.length !== prevDataRef.current.appointmentsLength ||
      currentMonth !== prevDataRef.current.currentMonth;

    if (hasDataChanged && optimizedData) {
      // إبطال cache للشهر المتأثر
      appointmentOptimizer.invalidateCache('month', currentMonth);
      loadOptimizedData();
      
      prevDataRef.current = {
        appointmentsLength: appointments.length,
        currentMonth
      };
    }
  }, [appointments.length, calendarState.currentDate, optimizedData, loadOptimizedData]);

  // الحصول على مواعيد اليوم المحدد مع ترتيب محسن
  const getSelectedDayAppointments = useCallback(() => {
    if (!optimizedData) return [];

    return appointmentOptimizer.getSortedAppointments(
      optimizedData.currentMonth,
      calendarState.selectedDate
    );
  }, [optimizedData, calendarState.selectedDate]);

  // البحث المحسن
  const searchAppointments = useCallback((searchTerm: string) => {
    if (!optimizedData) return [];

    return appointmentOptimizer.searchAppointments(
      optimizedData.currentMonth,
      searchTerm
    );
  }, [optimizedData]);

  // الحصول على أيام التقويم المرئية
  const getVisibleCalendarDays = useCallback(() => {
    if (!optimizedData) return [];

    return appointmentOptimizer.getVisibleCalendarDays(
      calendarState.currentDate.getFullYear(),
      calendarState.currentDate.getMonth() + 1,
      optimizedData.currentMonth
    );
  }, [optimizedData, calendarState.currentDate]);

  // التنقل في التقويم
  const navigateCalendar = useCallback((direction: 'prev' | 'next') => {
    setCalendarState(prev => ({
      ...prev,
      currentDate: direction === 'next' 
        ? addMonths(prev.currentDate, 1)
        : subMonths(prev.currentDate, 1)
    }));
  }, []);

  // تحديد اليوم المحدد
  const selectDate = useCallback((date: string) => {
    setCalendarState(prev => ({
      ...prev,
      selectedDate: date
    }));
  }, []);

  // تحديث حالة الموعد مع تحسين
  const updateAppointmentStatus = useCallback(async (
    appointmentId: number, 
    newStatus: string
  ) => {
    try {
      // تحديث في المتجر
      await updateAppointment(appointmentId, { status: newStatus as 'scheduled' | 'completed' | 'cancelled' | 'waiting_list' });
      
      // إبطال cache للشهر الحالي
      const currentMonth = format(calendarState.currentDate, 'yyyy-MM');
      appointmentOptimizer.invalidateCache('month', currentMonth);
      
      // إعادة تحميل البيانات
      loadOptimizedData();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  }, [updateAppointment, calendarState.currentDate, loadOptimizedData]);

  // تطبيق الفلاتر
  const applyFilters = useCallback((filters: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...filters }));
  }, []);

  // الحصول على البيانات المفلترة
  const getFilteredAppointments = useCallback(() => {
    if (!optimizedData) return [];

    let filtered = optimizedData.currentMonth;

    // تطبيق البحث
    if (filterState.searchTerm) {
      filtered = appointmentOptimizer.searchAppointments(filtered, filterState.searchTerm);
    }

    // تطبيق فلتر الحالة
    if (filterState.statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterState.statusFilter);
    }

    // تطبيق فلتر الطبيب
    if (filterState.doctorFilter !== 'all') {
      filtered = filtered.filter(apt => apt.doctorId.toString() === filterState.doctorFilter);
    }

    // تطبيق فلتر النطاق الزمني
    if (filterState.dateRange) {
      filtered = filtered.filter(apt => 
        apt.date >= filterState.dateRange!.start && 
        apt.date <= filterState.dateRange!.end
      );
    }

    return filtered;
  }, [optimizedData, filterState]);

  // إعادة التحميل اليدوي
  const refresh = useCallback(() => {
    appointmentOptimizer.invalidateCache('all');
    loadOptimizedData();
  }, [loadOptimizedData]);

  // الحصول على ملخص سريع
  const getQuickSummary = useCallback(() => {
    if (!optimizedData) return null;

    const selectedDayAppointments = getSelectedDayAppointments();
    
    return {
      totalThisMonth: optimizedData.stats.thisMonth,
      todayAppointments: optimizedData.stats.today,
      selectedDayCount: selectedDayAppointments.length,
      byStatus: optimizedData.stats.byStatus,
      selectedDate: calendarState.selectedDate
    };
  }, [optimizedData, getSelectedDayAppointments, calendarState.selectedDate]);

  return {
    // البيانات الرئيسية
    optimizedData,
    
    // حالة التحميل
    ...loadingState,
    
    // حالة التقويم
    calendarState,
    
    // حالة التصفية
    filterState,
    
    // دوال الوصول للبيانات
    getSelectedDayAppointments,
    getVisibleCalendarDays,
    getFilteredAppointments,
    searchAppointments,
    getQuickSummary,
    
    // دوال التحكم
    navigateCalendar,
    selectDate,
    updateAppointmentStatus,
    applyFilters,
    refresh,
    
    // معلومات إضافية
    hasData: !!optimizedData
  };
};
