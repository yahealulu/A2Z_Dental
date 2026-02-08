// مكونات Lazy Loading للصفحات الثقيلة

import React, { lazy, Suspense } from 'react';

// مكون التحميل المشترك للصفحات
const PageLoadingFallback = ({ pageName }: { pageName: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل {pageName}</h2>
      <p className="text-gray-500">يرجى الانتظار...</p>
    </div>
  </div>
);

// Lazy loading للصفحات الثقيلة
export const LazyRevenue = lazy(() => 
  import('../pages/Revenue').then(module => {
    if (process.env.NODE_ENV === 'development') {
      return new Promise<typeof module>(resolve => setTimeout(() => resolve(module), 100));
    }
    return module;
  }) as Promise<{ default: React.ComponentType }>
);

export const LazyExpenses = lazy(() => 
  import('../pages/Expenses').then(module => {
    if (process.env.NODE_ENV === 'development') {
      return new Promise<typeof module>(resolve => setTimeout(() => resolve(module), 100));
    }
    return module;
  }) as Promise<{ default: React.ComponentType }>
);

export const LazyPatients = lazy(() => 
  import('../pages/Patients').then(module => {
    if (process.env.NODE_ENV === 'development') {
      return new Promise<typeof module>(resolve => setTimeout(() => resolve(module), 100));
    }
    return module;
  }) as Promise<{ default: React.ComponentType }>
);

export const LazyTreatments = lazy(() => 
  import('../pages/Treatments').then(module => {
    if (process.env.NODE_ENV === 'development') {
      return new Promise<typeof module>(resolve => setTimeout(() => resolve(module), 100));
    }
    return module;
  }) as Promise<{ default: React.ComponentType }>
);

export const LazyLabRequests = lazy(() => 
  import('../pages/LabRequests').then(module => {
    if (process.env.NODE_ENV === 'development') {
      return new Promise<typeof module>(resolve => setTimeout(() => resolve(module), 100));
    }
    return module;
  }) as Promise<{ default: React.ComponentType }>
);

// مكونات Wrapper مع Suspense
export const RevenueWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="الإيرادات" />}>
    <LazyRevenue />
  </Suspense>
);

export const ExpensesWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="المصروفات" />}>
    <LazyExpenses />
  </Suspense>
);

export const PatientsWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="المرضى" />}>
    <LazyPatients />
  </Suspense>
);

export const TreatmentsWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="العلاجات" />}>
    <LazyTreatments />
  </Suspense>
);

export const LabRequestsWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="طلبات المختبر" />}>
    <LazyLabRequests />
  </Suspense>
);

// Hook لاستخدام الصفحات مع lazy loading
export const useLazyPages = () => {
  return {
    Revenue: RevenueWithSuspense,
    Expenses: ExpensesWithSuspense,
    Patients: PatientsWithSuspense,
    Treatments: TreatmentsWithSuspense,
    LabRequests: LabRequestsWithSuspense
  };
};
