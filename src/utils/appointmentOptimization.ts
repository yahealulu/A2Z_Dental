// نظام تحسين صفحة المواعيد

import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

// نوع البيانات للموعد المحسن
export interface OptimizedAppointment {
  id: number;
  patientName: string;
  patientId: number;
  doctorName: string;
  doctorId: number;
  date: string;
  time: string;
  status: string;
  isNewPatient: boolean;
  notes?: string;
  // حقول محسنة
  sortKey: string; // للترتيب السريع
  searchText: string; // للبحث السريع
  timeSlot: number; // رقم الفترة الزمنية
}

// نوع البيانات لـ cache المواعيد
interface AppointmentCacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  monthKey: string;
}

// إعدادات الـ cache
const CACHE_CONFIG = {
  SORTED_APPOINTMENTS_TTL: 5 * 60 * 1000,    // 5 دقائق
  MONTHLY_APPOINTMENTS_TTL: 10 * 60 * 1000,  // 10 دقائق
  TIME_CONVERSION_TTL: 30 * 60 * 1000,       // 30 دقيقة
  CALENDAR_DATA_TTL: 2 * 60 * 1000,          // دقيقتان
};

// فئة cache المواعيد
class AppointmentCache {
  private cache = new Map<string, AppointmentCacheItem<any>>();

  set<T>(key: string, data: T, ttl: number, monthKey?: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      monthKey: monthKey || 'global'
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidateMonth(monthKey: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.monthKey === monthKey) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// instance مشترك للـ cache
const appointmentCache = new AppointmentCache();

// فئة محسن المواعيد
export class AppointmentOptimizer {
  private static instance: AppointmentOptimizer;
  private timeConversionCache = new Map<string, string>();

  private constructor() {
    // تنظيف دوري للـ cache كل 5 دقائق
    setInterval(() => {
      appointmentCache.cleanup();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): AppointmentOptimizer {
    if (!AppointmentOptimizer.instance) {
      AppointmentOptimizer.instance = new AppointmentOptimizer();
    }
    return AppointmentOptimizer.instance;
  }

  // تحويل الوقت المحسن مع cache
  private convertTime(time: string): string {
    if (this.timeConversionCache.has(time)) {
      return this.timeConversionCache.get(time)!;
    }

    try {
      // تحويل الوقت من 24 ساعة إلى 12 ساعة مع النص العربي
      const [hours, minutes] = time.split(':').map(Number);
      let convertedTime: string;

      if (hours === 0) {
        convertedTime = `12:${minutes.toString().padStart(2, '0')} صباحاً`;
      } else if (hours < 12) {
        convertedTime = `${hours}:${minutes.toString().padStart(2, '0')} صباحاً`;
      } else if (hours === 12) {
        convertedTime = `12:${minutes.toString().padStart(2, '0')} مساءً`;
      } else {
        convertedTime = `${hours - 12}:${minutes.toString().padStart(2, '0')} مساءً`;
      }

      this.timeConversionCache.set(time, convertedTime);
      return convertedTime;
    } catch (error) {
      return time; // إرجاع الوقت الأصلي في حالة الخطأ
    }
  }

  // تحسين بيانات الموعد
  private optimizeAppointment(appointment: any): OptimizedAppointment {
    const timeSlot = this.getTimeSlot(appointment.time);
    const sortKey = `${appointment.date}_${appointment.time}`;
    const searchText = `${appointment.patientName} ${appointment.doctorName} ${appointment.date} ${appointment.time}`.toLowerCase();

    return {
      ...appointment,
      sortKey,
      searchText,
      timeSlot
    };
  }

  // تحديد الفترة الزمنية (للترتيب)
  private getTimeSlot(time: string): number {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes; // تحويل إلى دقائق من بداية اليوم
    } catch {
      return 0;
    }
  }

  // الحصول على مواعيد الشهر مع cache
  getMonthlyAppointments(
    appointments: any[],
    year: number,
    month: number
  ): OptimizedAppointment[] {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const cacheKey = `monthly_appointments_${monthKey}`;

    // التحقق من الـ cache
    const cached = appointmentCache.get<OptimizedAppointment[]>(cacheKey);
    if (cached) return cached;

    // تصفية المواعيد للشهر المحدد
    const monthStart = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
    const monthEnd = format(new Date(year, month, 0), 'yyyy-MM-dd');

    const monthlyAppointments = appointments
      .filter(apt => apt.date >= monthStart && apt.date <= monthEnd)
      .map(apt => this.optimizeAppointment(apt));

    // حفظ في الـ cache
    appointmentCache.set(
      cacheKey, 
      monthlyAppointments, 
      CACHE_CONFIG.MONTHLY_APPOINTMENTS_TTL,
      monthKey
    );

    return monthlyAppointments;
  }

  // ترتيب المواعيد مع cache
  getSortedAppointments(
    appointments: OptimizedAppointment[],
    date: string
  ): OptimizedAppointment[] {
    const cacheKey = `sorted_appointments_${date}`;

    // التحقق من الـ cache
    const cached = appointmentCache.get<OptimizedAppointment[]>(cacheKey);
    if (cached) return cached;

    // تصفية وترتيب المواعيد
    const sortedAppointments = appointments
      .filter(apt => apt.date === date)
      .sort((a, b) => a.timeSlot - b.timeSlot);

    // حفظ في الـ cache
    appointmentCache.set(
      cacheKey,
      sortedAppointments,
      CACHE_CONFIG.SORTED_APPOINTMENTS_TTL
    );

    return sortedAppointments;
  }

  // بيانات التقويم المحسنة
  getCalendarData(
    appointments: OptimizedAppointment[],
    year: number,
    month: number
  ): Map<string, { count: number; hasToday: boolean }> {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const cacheKey = `calendar_data_${monthKey}`;

    // التحقق من الـ cache
    const cached = appointmentCache.get<Map<string, { count: number; hasToday: boolean }>>(cacheKey);
    if (cached) return cached;

    // إنشاء خريطة بيانات التقويم
    const calendarData = new Map<string, { count: number; hasToday: boolean }>();
    const today = format(new Date(), 'yyyy-MM-dd');

    appointments.forEach(apt => {
      const existing = calendarData.get(apt.date) || { count: 0, hasToday: false };
      calendarData.set(apt.date, {
        count: existing.count + 1,
        hasToday: apt.date === today
      });
    });

    // حفظ في الـ cache
    appointmentCache.set(
      cacheKey,
      calendarData,
      CACHE_CONFIG.CALENDAR_DATA_TTL,
      monthKey
    );

    return calendarData;
  }

  // البحث المحسن في المواعيد
  searchAppointments(
    appointments: OptimizedAppointment[],
    searchTerm: string
  ): OptimizedAppointment[] {
    if (!searchTerm.trim()) return appointments;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return appointments.filter(apt => 
      apt.searchText.includes(lowerSearchTerm)
    );
  }

  // تحميل نطاق التواريخ (الشهر الحالي + شهر قبل وبعد)
  getDateRangeAppointments(
    appointments: any[],
    currentDate: Date
  ): {
    current: OptimizedAppointment[];
    previous: OptimizedAppointment[];
    next: OptimizedAppointment[];
  } {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const previousDate = subMonths(currentDate, 1);
    const nextDate = addMonths(currentDate, 1);

    return {
      current: this.getMonthlyAppointments(appointments, currentYear, currentMonth),
      previous: this.getMonthlyAppointments(appointments, previousDate.getFullYear(), previousDate.getMonth() + 1),
      next: this.getMonthlyAppointments(appointments, nextDate.getFullYear(), nextDate.getMonth() + 1)
    };
  }

  // إحصائيات سريعة للمواعيد
  getAppointmentStats(appointments: OptimizedAppointment[]): {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
  } {
    const today = format(new Date(), 'yyyy-MM-dd');
    const thisWeekStart = format(new Date(), 'yyyy-MM-dd'); // تبسيط للمثال
    const thisMonth = format(new Date(), 'yyyy-MM');

    const stats = {
      total: appointments.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byStatus: {} as Record<string, number>
    };

    appointments.forEach(apt => {
      // إحصائيات اليوم
      if (apt.date === today) {
        stats.today++;
      }

      // إحصائيات الشهر
      if (apt.date.startsWith(thisMonth)) {
        stats.thisMonth++;
      }

      // إحصائيات الحالة
      stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1;
    });

    return stats;
  }

  // إبطال cache عند تحديث البيانات
  invalidateCache(type: 'month' | 'all', monthKey?: string): void {
    if (type === 'all') {
      appointmentCache.clear();
      this.timeConversionCache.clear();
    } else if (type === 'month' && monthKey) {
      appointmentCache.invalidateMonth(monthKey);
    }
  }

  // تحسين أداء التقويم - إرجاع الأيام المرئية فقط
  getVisibleCalendarDays(
    year: number,
    month: number,
    appointments: OptimizedAppointment[]
  ): Array<{
    date: string;
    day: number;
    isToday: boolean;
    appointmentCount: number;
    appointments: OptimizedAppointment[];
  }> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const today = format(new Date(), 'yyyy-MM-dd');

    const days: Array<{
      date: string;
      day: number;
      isToday: boolean;
      appointmentCount: number;
      appointments: OptimizedAppointment[];
    }> = [];

    // إنشاء خريطة المواعيد للوصول السريع
    const appointmentsByDate = new Map<string, OptimizedAppointment[]>();
    appointments.forEach(apt => {
      if (!appointmentsByDate.has(apt.date)) {
        appointmentsByDate.set(apt.date, []);
      }
      appointmentsByDate.get(apt.date)!.push(apt);
    });

    // إنشاء أيام الشهر
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
      const dayAppointments = appointmentsByDate.get(date) || [];

      days.push({
        date,
        day,
        isToday: date === today,
        appointmentCount: dayAppointments.length,
        appointments: dayAppointments.sort((a, b) => a.timeSlot - b.timeSlot)
      });
    }

    return days;
  }
}

// instance مشترك
export const appointmentOptimizer = AppointmentOptimizer.getInstance();
