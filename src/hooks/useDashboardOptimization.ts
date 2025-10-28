// Hook محسن للوحة التحكم

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardOptimizer, type DashboardStats } from '../utils/dashboardOptimization';
import { useAppointmentStore } from '../store/appointmentStore';
import { usePatientStore } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';
import { usePaymentStore } from '../store/paymentStore';
import { useExpenseStore } from '../store/expenseStore';

// نوع البيانات لحالة التحميل
interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdate: number;
}

// نوع البيانات للتحديثات الانتقائية
interface UpdateFlags {
  appointments: boolean;
  payments: boolean;
  expenses: boolean;
  patients: boolean;
}

export const useDashboardOptimization = () => {
  // البيانات من المتاجر
  const { appointments } = useAppointmentStore();
  const { patients } = usePatientStore();
  const { doctors } = useDoctorStore();
  const { payments } = usePaymentStore();
  const { expenses } = useExpenseStore();

  // حالة الإحصائيات
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastUpdate: 0
  });

  // مراجع للبيانات السابقة لتتبع التغييرات
  const prevDataRef = useRef({
    appointmentsLength: 0,
    paymentsLength: 0,
    expensesLength: 0,
    patientsLength: 0
  });

  // تتبع التحديثات المطلوبة
  const [updateFlags, setUpdateFlags] = useState<UpdateFlags>({
    appointments: false,
    payments: false,
    expenses: false,
    patients: false
  });

  // تحديد التغييرات في البيانات
  const detectDataChanges = useCallback(() => {
    const currentData = {
      appointmentsLength: appointments.length,
      paymentsLength: payments.length,
      expensesLength: expenses.length,
      patientsLength: patients.length
    };

    const changes: UpdateFlags = {
      appointments: currentData.appointmentsLength !== prevDataRef.current.appointmentsLength,
      payments: currentData.paymentsLength !== prevDataRef.current.paymentsLength,
      expenses: currentData.expensesLength !== prevDataRef.current.expensesLength,
      patients: currentData.patientsLength !== prevDataRef.current.patientsLength
    };

    // تحديث المرجع فقط إذا كان هناك تغييرات
    const hasChanges = Object.values(changes).some(Boolean);
    if (hasChanges) {
      prevDataRef.current = currentData;
    }

    return changes;
  }, [appointments.length, payments.length, expenses.length, patients.length]);

  // تحميل الإحصائيات مع التحسين
  const loadStats = useCallback(async (forceRefresh = false) => {
    try {
      setLoadingState(prev => ({
        ...prev,
        isLoading: !stats, // loading فقط إذا لم تكن هناك بيانات
        isRefreshing: !!stats, // refreshing إذا كانت هناك بيانات
        error: null
      }));

      // إبطال cache إذا كان هناك تحديث قسري
      if (forceRefresh) {
        dashboardOptimizer.invalidateCache('all');
      }

      // تحميل جميع الإحصائيات
      const dashboardStats = await dashboardOptimizer.getAllStats(
        appointments,
        patients,
        doctors,
        payments,
        expenses
      );

      setStats(dashboardStats);
      setLoadingState({
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdate: Date.now()
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: 'فشل في تحميل إحصائيات لوحة التحكم'
      }));
    }
  }, [appointments, patients, doctors, payments, expenses, stats]);

  // تحديث انتقائي للإحصائيات
  const updateSelectiveStats = useCallback(async (changes: UpdateFlags) => {
    if (!stats) return;

    try {
      setLoadingState(prev => ({ ...prev, isRefreshing: true }));

      // إبطال cache للبيانات المتغيرة فقط
      if (changes.appointments) {
        dashboardOptimizer.invalidateCache('appointments');
      }
      if (changes.payments) {
        dashboardOptimizer.invalidateCache('payments');
      }
      if (changes.expenses) {
        dashboardOptimizer.invalidateCache('expenses');
      }
      if (changes.patients) {
        dashboardOptimizer.invalidateCache('patients');
      }

      // تحديث الإحصائيات المتأثرة فقط
      const updates: Partial<DashboardStats> = {};

      if (changes.appointments || changes.payments || changes.expenses) {
        updates.todayStats = await dashboardOptimizer.getTodayStats(
          appointments, payments, expenses
        );
      }

      if (changes.appointments || changes.patients || changes.payments || changes.expenses) {
        updates.monthlyStats = await dashboardOptimizer.getMonthlyStats(
          appointments, patients, payments, expenses
        );
      }

      if (changes.appointments) {
        updates.todayAppointments = await dashboardOptimizer.getTodayAppointments(
          appointments, patients, doctors
        );
      }

      if (changes.patients || changes.appointments) {
        updates.quickStats = await dashboardOptimizer.getQuickStats(
          patients, doctors, appointments, payments
        );
      }

      // تحديث الحالة
      setStats(prev => prev ? { ...prev, ...updates } : null);
      setLoadingState(prev => ({
        ...prev,
        isRefreshing: false,
        lastUpdate: Date.now()
      }));

    } catch (error) {
      console.error('Error updating selective stats:', error);
      setLoadingState(prev => ({
        ...prev,
        isRefreshing: false,
        error: 'فشل في تحديث الإحصائيات'
      }));
    }
  }, [stats, appointments, patients, doctors, payments, expenses]);

  // تحميل أولي للإحصائيات
  useEffect(() => {
    if ((appointments.length > 0 || patients.length > 0) && !stats) {
      loadStats();
    }
  }, [appointments.length, patients.length]); // إزالة loadStats من dependencies

  // مراقبة التغييرات وتحديث انتقائي
  useEffect(() => {
    if (!stats) return;

    const changes = detectDataChanges();
    const hasChanges = Object.values(changes).some(Boolean);

    if (hasChanges) {
      setUpdateFlags(changes);
      updateSelectiveStats(changes);
    }
  }, [appointments.length, payments.length, expenses.length, patients.length]); // dependencies محددة

  // تحديث دوري للبيانات المهمة (كل دقيقة)
  useEffect(() => {
    if (!stats || loadingState.isRefreshing) return;

    const interval = setInterval(() => {
      // تحديث مواعيد اليوم فقط
      dashboardOptimizer.invalidateCache('today_appointments');
      updateSelectiveStats({
        appointments: true,
        payments: false,
        expenses: false,
        patients: false
      });
    }, 60 * 1000); // كل دقيقة

    return () => clearInterval(interval);
  }, [stats, loadingState.isRefreshing]); // إزالة updateSelectiveStats من dependencies

  // دوال مساعدة للوصول السريع للبيانات
  const getTodayRevenue = useCallback(() => {
    return stats?.todayStats.revenue || 0;
  }, [stats]);

  const getTodayAppointmentsCount = useCallback(() => {
    return stats?.todayStats.appointmentsCount || 0;
  }, [stats]);

  const getMonthlyProfit = useCallback(() => {
    return stats?.monthlyStats.netProfit || 0;
  }, [stats]);

  const getTodayAppointmentsList = useCallback(() => {
    return stats?.todayAppointments || [];
  }, [stats]);

  // دالة إعادة التحميل اليدوي
  const refresh = useCallback(() => {
    loadStats(true);
  }, [loadStats]);

  // دالة للحصول على ملخص سريع
  const getQuickSummary = useCallback(() => {
    if (!stats) return null;

    return {
      todayAppointments: stats.todayStats.appointmentsCount,
      todayRevenue: stats.todayStats.revenue,
      monthlyProfit: stats.monthlyStats.netProfit,
      totalPatients: stats.quickStats.totalPatients,
      pendingAppointments: stats.quickStats.pendingAppointments
    };
  }, [stats]);

  return {
    // البيانات الرئيسية
    stats,
    
    // حالة التحميل
    ...loadingState,
    
    // دوال الوصول السريع
    getTodayRevenue,
    getTodayAppointmentsCount,
    getMonthlyProfit,
    getTodayAppointmentsList,
    getQuickSummary,
    
    // دوال التحكم
    refresh,
    
    // معلومات إضافية
    updateFlags,
    hasData: !!stats
  };
};
