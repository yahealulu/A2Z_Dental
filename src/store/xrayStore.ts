import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { XRay, XRayType } from '../data/xrays';
export type { XRay, XRayType } from '../data/xrays';

// تعريف إحصائيات الأشعة
export interface XRayStats {
  totalXRays: number;
  xraysByType: Record<XRayType, number>;
  xraysByMonth: Record<string, number>;
  recentXRays: XRay[];
}

// تعريف فلاتر البحث
export interface XRayFilters {
  patientId?: number;
  type?: XRayType;
  dateRange?: { start: string; end: string };
  searchTerm?: string;
}

// تعريف حالة المتجر المحسنة
interface XRayState {
  xrays: XRay[];
  lastId: number;
  version: number;

  // الأفعال الأساسية
  addXRay: (xray: Omit<XRay, 'id' | 'createdAt' | 'updatedAt'>) => Promise<XRay>;
  updateXRay: (id: number, xray: Partial<XRay>) => Promise<boolean>;
  deleteXRay: (id: number) => Promise<boolean>;

  // البحث والتصفية
  getXRayById: (id: number) => XRay | undefined;
  getXRaysByPatientId: (patientId: number) => XRay[];
  getXRaysByType: (type: XRayType) => XRay[];
  searchXRays: (query: string) => XRay[];
  filterXRays: (filters: XRayFilters) => XRay[];

  // الإحصائيات
  getXRayStats: () => XRayStats;
  getRecentXRays: (limit?: number) => XRay[];
}

// وظائف المساعدة
const validateXRayData = (xray: any) => {
  const errors: string[] = [];

  if (!xray.patientId) errors.push('معرف المريض مطلوب');
  if (!xray.type) errors.push('نوع الأشعة مطلوب');
  if (!xray.date) errors.push('تاريخ الأشعة مطلوب');

  return {
    isValid: errors.length === 0,
    errors
  };
};

// إنشاء المتجر المحسن
export const useXRayStore = create<XRayState>()(
  persist(
    (set, get) => ({
      xrays: [],
      lastId: 0,
      version: 1,

      // إضافة صورة شعاعية جديدة
      addXRay: async (xrayData) => {
        try {
          const validation = validateXRayData(xrayData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastId + 1;
          const now = new Date().toISOString();

          const newXRay: XRay = {
            ...xrayData,
            id: newId,
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            xrays: [...state.xrays, newXRay],
            lastId: newId
          }));

          return newXRay;
        } catch (error) {
          throw error;
        }
      },

      // تحديث صورة شعاعية موجودة
      updateXRay: async (id, updatedFields) => {
        try {
          const xray = get().xrays.find(x => x.id === id);
          if (!xray) {
            throw new Error('الأشعة غير موجودة');
          }

          const updatedXRay = {
            ...xray,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          };

          const validation = validateXRayData(updatedXRay);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          set(state => ({
            xrays: state.xrays.map(x =>
              x.id === id ? updatedXRay : x
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // حذف صورة شعاعية
      deleteXRay: async (id) => {
        try {
          const index = get().xrays.findIndex(x => x.id === id);
          if (index === -1) {
            throw new Error('الأشعة غير موجودة');
          }

          set(state => ({
            xrays: state.xrays.filter(xray => xray.id !== id)
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // الحصول على أشعة بالمعرف
      getXRayById: (id) => {
        return get().xrays.find(xray => xray.id === id);
      },

      // الحصول على الصور الشعاعية لمريض معين
      getXRaysByPatientId: (patientId) => {
        return get().xrays.filter(xray => xray.patientId === patientId);
      },

      // الحصول على الأشعة حسب النوع
      getXRaysByType: (type) => {
        return get().xrays.filter(xray => xray.type === type);
      },

      // البحث في الأشعة
      searchXRays: (query) => {
        const searchTerm = query.toLowerCase();
        return get().xrays.filter(xray =>
          xray.description?.toLowerCase().includes(searchTerm) ||
          xray.notes?.toLowerCase().includes(searchTerm) ||
          xray.type.toLowerCase().includes(searchTerm)
        );
      },

      // تصفية الأشعة
      filterXRays: (filters) => {
        return get().xrays.filter(xray => {
          if (filters.patientId && xray.patientId !== filters.patientId) {
            return false;
          }
          if (filters.type && xray.type !== filters.type) {
            return false;
          }
          if (filters.dateRange) {
            const xrayDate = new Date(xray.date);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            if (xrayDate < startDate || xrayDate > endDate) {
              return false;
            }
          }
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            if (!xray.description?.toLowerCase().includes(searchTerm) &&
                !xray.notes?.toLowerCase().includes(searchTerm) &&
                !xray.type.toLowerCase().includes(searchTerm)) {
              return false;
            }
          }
          return true;
        });
      },

      // الحصول على الأشعة الحديثة
      getRecentXRays: (limit = 10) => {
        return get().xrays
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);
      },

      // إحصائيات الأشعة
      getXRayStats: () => {
        const allXRays = get().xrays;

        // إحصائيات حسب النوع
        const xraysByType = allXRays.reduce((acc, xray) => {
          acc[xray.type] = (acc[xray.type] || 0) + 1;
          return acc;
        }, {} as Record<XRayType, number>);

        // إحصائيات حسب الشهر
        const xraysByMonth = allXRays.reduce((acc, xray) => {
          const month = new Date(xray.date).toISOString().substring(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalXRays: allXRays.length,
          xraysByType,
          xraysByMonth,
          recentXRays: get().getRecentXRays(5)
        };
      }
    }),
    {
      name: 'dental-xrays-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            version: 1,
            xrays: persistedState.xrays?.map((xray: any) => ({
              ...xray,
              createdAt: xray.createdAt || new Date().toISOString(),
              updatedAt: xray.updatedAt || new Date().toISOString()
            })) || []
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => () => {
        // تم تحميل بيانات الأشعة من localStorage
      }
    }
  )
);
