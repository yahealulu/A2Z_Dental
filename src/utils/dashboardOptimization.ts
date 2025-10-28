// نظام تحسين لوحة التحكم

import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

// نوع البيانات لإحصائيات لوحة التحكم
export interface DashboardStats {
  // إحصائيات اليوم
  todayStats: {
    appointmentsCount: number;
    patientsCount: number;
    revenue: number;
    expenses: number;
    netProfit: number;
  };
  
  // إحصائيات الشهر
  monthlyStats: {
    appointmentsCount: number;
    newPatientsCount: number;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  
  // مواعيد اليوم
  todayAppointments: Array<{
    id: number;
    patientName: string;
    time: string;
    status: string;
    doctorName: string;
    patientId: number;
    isNewPatient: boolean;
    treatment: string;
  }>;
  
  // إحصائيات سريعة
  quickStats: {
    totalPatients: number;
    totalDoctors: number;
    pendingAppointments: number;
    overduePayments: number;
  };
}

// نوع البيانات للـ cache
interface DashboardCacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // مدة الصلاحية بالميلي ثانية
}

// إعدادات الـ cache
const CACHE_CONFIG = {
  TODAY_STATS_TTL: 2 * 60 * 1000,      // دقيقتان
  MONTHLY_STATS_TTL: 15 * 60 * 1000,   // 15 دقيقة
  APPOINTMENTS_TTL: 1 * 60 * 1000,     // دقيقة واحدة
  QUICK_STATS_TTL: 5 * 60 * 1000,      // 5 دقائق
};

// فئة cache لوحة التحكم
class DashboardCache {
  private cache = new Map<string, DashboardCacheItem<any>>();

  // حفظ في الـ cache
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // الحصول من الـ cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // التحقق من انتهاء الصلاحية
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // مسح الـ cache
  clear(): void {
    this.cache.clear();
  }

  // مسح العناصر المنتهية الصلاحية
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // إبطال cache محدد
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // الحصول على جميع المفاتيح
  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  // حذف مفتاح محدد
  delete(key: string): void {
    this.cache.delete(key);
  }
}

// instance مشترك للـ cache
const dashboardCache = new DashboardCache();

// فئة محسن لوحة التحكم
export class DashboardOptimizer {
  private static instance: DashboardOptimizer;

  private constructor() {
    // تنظيف دوري للـ cache كل 5 دقائق
    setInterval(() => {
      dashboardCache.cleanup();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): DashboardOptimizer {
    if (!DashboardOptimizer.instance) {
      DashboardOptimizer.instance = new DashboardOptimizer();
    }
    return DashboardOptimizer.instance;
  }

  // الحصول على إحصائيات اليوم مع cache
  async getTodayStats(
    appointments: any[],
    payments: any[],
    expenses: any[]
  ): Promise<DashboardStats['todayStats']> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `today_stats_${today}`;
    
    // التحقق من الـ cache
    const cached = dashboardCache.get<DashboardStats['todayStats']>(cacheKey);
    if (cached) return cached;

    // حساب الإحصائيات
    const todayStart = startOfDay(new Date()).toISOString();
    const todayEnd = endOfDay(new Date()).toISOString();

    const todayAppointments = appointments.filter(apt => 
      apt.date === today
    );

    const todayPayments = payments.filter(payment => 
      payment.paymentDate >= todayStart && payment.paymentDate <= todayEnd
    );

    const todayExpenses = expenses.filter(expense => 
      expense.date >= todayStart && expense.date <= todayEnd
    );

    const revenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const expenseAmount = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const stats: DashboardStats['todayStats'] = {
      appointmentsCount: todayAppointments.length,
      patientsCount: new Set(todayAppointments.map(apt => apt.patientId)).size,
      revenue,
      expenses: expenseAmount,
      netProfit: revenue - expenseAmount
    };

    // حفظ في الـ cache
    dashboardCache.set(cacheKey, stats, CACHE_CONFIG.TODAY_STATS_TTL);
    return stats;
  }

  // الحصول على إحصائيات الشهر مع cache
  async getMonthlyStats(
    appointments: any[],
    patients: any[],
    payments: any[],
    expenses: any[]
  ): Promise<DashboardStats['monthlyStats']> {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const cacheKey = `monthly_stats_${currentMonth}`;
    
    // التحقق من الـ cache
    const cached = dashboardCache.get<DashboardStats['monthlyStats']>(cacheKey);
    if (cached) return cached;

    // حساب الإحصائيات
    const monthStart = startOfMonth(new Date()).toISOString();
    const monthEnd = endOfMonth(new Date()).toISOString();

    const monthlyAppointments = appointments.filter(apt => 
      apt.date >= monthStart.split('T')[0] && apt.date <= monthEnd.split('T')[0]
    );

    const newPatients = patients.filter(patient => 
      patient.createdAt >= monthStart && patient.createdAt <= monthEnd
    );

    const monthlyPayments = payments.filter(payment => 
      payment.paymentDate >= monthStart && payment.paymentDate <= monthEnd
    );

    const monthlyExpenses = expenses.filter(expense => 
      expense.date >= monthStart && expense.date <= monthEnd
    );

    const totalRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalExpenseAmount = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const stats: DashboardStats['monthlyStats'] = {
      appointmentsCount: monthlyAppointments.length,
      newPatientsCount: newPatients.length,
      totalRevenue,
      totalExpenses: totalExpenseAmount,
      netProfit: totalRevenue - totalExpenseAmount
    };

    // حفظ في الـ cache
    dashboardCache.set(cacheKey, stats, CACHE_CONFIG.MONTHLY_STATS_TTL);
    return stats;
  }

  // الحصول على مواعيد اليوم مع cache
  async getTodayAppointments(
    appointments: any[],
    patients: any[],
    doctors: any[]
  ): Promise<DashboardStats['todayAppointments']> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `today_appointments_${today}_${appointments.length}`;

    // التحقق من الـ cache (مع تضمين عدد المواعيد لضمان التحديث)
    const cached = dashboardCache.get<DashboardStats['todayAppointments']>(cacheKey);
    if (cached) return cached;

    // إنشاء خرائط للبحث السريع
    const patientMap = new Map(patients.map(p => [p.id, p]));
    const doctorMap = new Map(doctors.map(d => [d.id, d]));

    const todayAppointments = appointments
      .filter(apt => apt.date === today)
      .map(apt => {
        const patient = patientMap.get(apt.patientId);
        const isNewPatient = apt.isNewPatient || !patient;

        const result = {
          id: apt.id,
          patientName: isNewPatient ? apt.patientName : (patient?.name || 'مريض غير معروف'),
          time: apt.time,
          status: apt.status || 'مجدول',
          doctorName: doctorMap.get(apt.doctorId)?.name || 'طبيب غير محدد',
          patientId: apt.patientId,
          isNewPatient: isNewPatient,
          treatment: apt.treatment || 'فحص'
        };

        // Debug log للمرضى الجدد (في وضع التطوير فقط)
        if (isNewPatient && process.env.NODE_ENV === 'development') {
          console.log('🔴 New patient appointment in dashboard:', result);
        }

        return result;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    // حفظ في الـ cache
    dashboardCache.set(cacheKey, todayAppointments, CACHE_CONFIG.APPOINTMENTS_TTL);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Today appointments loaded:', todayAppointments.length);
    }

    return todayAppointments;
  }

  // الحصول على الإحصائيات السريعة مع cache
  async getQuickStats(
    patients: any[],
    doctors: any[],
    appointments: any[],
    payments: any[]
  ): Promise<DashboardStats['quickStats']> {
    const cacheKey = 'quick_stats';
    
    // التحقق من الـ cache
    const cached = dashboardCache.get<DashboardStats['quickStats']>(cacheKey);
    if (cached) return cached;

    // حساب الإحصائيات السريعة
    const pendingAppointments = appointments.filter(apt => 
      apt.status === 'pending' || apt.status === 'scheduled'
    ).length;

    // حساب الدفعات المتأخرة (تقدير بسيط)
    const overduePayments = payments.filter(payment => 
      payment.status === 'pending' && 
      new Date(payment.dueDate) < new Date()
    ).length;

    const stats: DashboardStats['quickStats'] = {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      pendingAppointments,
      overduePayments
    };

    // حفظ في الـ cache
    dashboardCache.set(cacheKey, stats, CACHE_CONFIG.QUICK_STATS_TTL);
    return stats;
  }

  // إبطال cache عند تحديث البيانات
  invalidateCache(dataType: 'appointments' | 'payments' | 'expenses' | 'patients' | 'all'): void {
    switch (dataType) {
      case 'appointments':
        dashboardCache.invalidate('appointments');
        dashboardCache.invalidate('today_stats');
        dashboardCache.invalidate('monthly_stats');
        dashboardCache.invalidate('quick_stats');
        // تنظيف cache مواعيد اليوم
        const today = format(new Date(), 'yyyy-MM-dd');
        const keys = Array.from(dashboardCache.keys()).filter(key =>
          key.startsWith(`today_appointments_${today}`)
        );
        if (process.env.NODE_ENV === 'development') {
          console.log('🧹 Clearing appointment cache keys:', keys);
        }
        keys.forEach(key => dashboardCache.delete(key));
        break;
      case 'payments':
        dashboardCache.invalidate('today_stats');
        dashboardCache.invalidate('monthly_stats');
        break;
      case 'expenses':
        dashboardCache.invalidate('today_stats');
        dashboardCache.invalidate('monthly_stats');
        break;
      case 'patients':
        dashboardCache.invalidate('monthly_stats');
        dashboardCache.invalidate('quick_stats');
        break;
      case 'all':
        dashboardCache.clear();
        break;
    }
  }

  // الحصول على جميع الإحصائيات مرة واحدة
  async getAllStats(
    appointments: any[],
    patients: any[],
    doctors: any[],
    payments: any[],
    expenses: any[]
  ): Promise<DashboardStats> {
    // تنفيذ متوازي للحصول على جميع الإحصائيات
    const [todayStats, monthlyStats, todayAppointments, quickStats] = await Promise.all([
      this.getTodayStats(appointments, payments, expenses),
      this.getMonthlyStats(appointments, patients, payments, expenses),
      this.getTodayAppointments(appointments, patients, doctors),
      this.getQuickStats(patients, doctors, appointments, payments)
    ]);

    return {
      todayStats,
      monthlyStats,
      todayAppointments,
      quickStats
    };
  }
}

// instance مشترك
export const dashboardOptimizer = DashboardOptimizer.getInstance();
