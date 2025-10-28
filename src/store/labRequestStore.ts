import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format, differenceInDays } from 'date-fns';

// تعريف نموذج المخبر
export interface Lab {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// تعريف نموذج نوع العمل
export interface WorkType {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// تعريف نموذج طلب المخبر
export interface LabRequest {
  id: number;
  patientId: number;
  patientName: string;
  labId: number;
  labName: string;
  workTypeId: number;
  workTypeName: string;
  teethNumbers: number[];
  quantity: number;
  color: string;
  deliveryDate: string; // تاريخ التسليم للمخبر
  expectedReturnDate: string; // تاريخ الاستلام المتوقع
  status: 'pending' | 'received'; // حالة الطلب
  receivedDate?: string; // تاريخ الاستلام الفعلي
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// تعريف نموذج حالة التسليم
export interface DeliveryStatus {
  type: 'remaining' | 'today' | 'overdue';
  days: number;
  message: string;
}

// واجهة حالة المتجر
interface LabRequestState {
  // البيانات الأساسية
  labs: Lab[];
  workTypes: WorkType[];
  labRequests: LabRequest[];
  
  // معرفات آخر عنصر
  lastLabId: number;
  lastWorkTypeId: number;
  lastRequestId: number;
  
  // إصدار البيانات
  version: number;

  // أفعال إدارة المخابر
  addLab: (name: string) => Promise<number>;
  updateLab: (id: number, name: string) => Promise<boolean>;
  deleteLab: (id: number) => Promise<boolean>;
  getActiveLabs: () => Lab[];

  // أفعال إدارة أنواع الأعمال
  addWorkType: (name: string) => Promise<number>;
  updateWorkType: (id: number, name: string) => Promise<boolean>;
  deleteWorkType: (id: number) => Promise<boolean>;
  getActiveWorkTypes: () => WorkType[];

  // أفعال إدارة طلبات المخبر
  addLabRequest: (request: Omit<LabRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateLabRequest: (id: number, request: Partial<LabRequest>) => Promise<boolean>;
  deleteLabRequest: (id: number) => Promise<boolean>;
  markAsReceived: (id: number) => Promise<boolean>;
  
  // البحث والتصفية
  getPendingRequests: () => LabRequest[];
  getReceivedRequests: () => LabRequest[];
  getRequestsByLab: (labId: number) => LabRequest[];
  getRequestsByWorkType: (workTypeId: number) => LabRequest[];
  getOverdueRequests: () => LabRequest[];
  getTodayDeliveries: () => LabRequest[];
  
  // حساب حالة التسليم
  getDeliveryStatus: (expectedReturnDate: string) => DeliveryStatus;
  
  // إحصائيات
  getOverdueCount: () => number;
  getTodayDeliveryCount: () => number;
}

// دالة التحقق من صحة بيانات المخبر
const validateLabData = (name: string, existingLabs: Lab[], excludeId?: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('اسم المخبر مطلوب');
  }
  
  if (name.trim().length < 2) {
    errors.push('اسم المخبر يجب أن يكون أكثر من حرف واحد');
  }
  
  // التحقق من عدم تكرار الاسم
  const isDuplicate = existingLabs.some(lab => 
    lab.name.toLowerCase() === name.trim().toLowerCase() && 
    lab.id !== excludeId &&
    lab.isActive
  );
  
  if (isDuplicate) {
    errors.push('اسم المخبر موجود مسبقاً');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// دالة التحقق من صحة بيانات نوع العمل
const validateWorkTypeData = (name: string, existingWorkTypes: WorkType[], excludeId?: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('نوع العمل مطلوب');
  }
  
  if (name.trim().length < 2) {
    errors.push('نوع العمل يجب أن يكون أكثر من حرف واحد');
  }
  
  // التحقق من عدم تكرار الاسم
  const isDuplicate = existingWorkTypes.some(workType => 
    workType.name.toLowerCase() === name.trim().toLowerCase() && 
    workType.id !== excludeId &&
    workType.isActive
  );
  
  if (isDuplicate) {
    errors.push('نوع العمل موجود مسبقاً');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// دالة التحقق من صحة بيانات طلب المخبر
const validateLabRequestData = (request: Omit<LabRequest, 'id' | 'createdAt' | 'updatedAt'>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!request.patientName || request.patientName.trim().length === 0) {
    errors.push('اسم المريض مطلوب');
  }
  
  if (!request.labId || request.labId <= 0) {
    errors.push('يجب اختيار المخبر');
  }
  
  if (!request.workTypeId || request.workTypeId <= 0) {
    errors.push('يجب اختيار نوع العمل');
  }
  
  if (!request.quantity || request.quantity <= 0) {
    errors.push('عدد القطع يجب أن يكون أكبر من صفر');
  }
  
  if (!request.color || request.color.trim().length === 0) {
    errors.push('اللون مطلوب');
  }
  
  if (!request.deliveryDate) {
    errors.push('تاريخ التسليم مطلوب');
  }
  
  if (!request.expectedReturnDate) {
    errors.push('تاريخ الاستلام المتوقع مطلوب');
  }
  
  // التحقق من أن تاريخ الاستلام المتوقع بعد تاريخ التسليم
  if (request.deliveryDate && request.expectedReturnDate) {
    const deliveryDate = new Date(request.deliveryDate);
    const expectedReturnDate = new Date(request.expectedReturnDate);
    
    if (expectedReturnDate <= deliveryDate) {
      errors.push('تاريخ الاستلام المتوقع يجب أن يكون بعد تاريخ التسليم');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// البيانات الافتراضية للمخابر
const defaultLabs: Omit<Lab, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'مخبر الأسنان المتقدم', isActive: true },
  { name: 'مخبر الابتسامة الذهبية', isActive: true },
  { name: 'مخبر التقنيات الحديثة', isActive: true }
];

// البيانات الافتراضية لأنواع الأعمال
const defaultWorkTypes: Omit<WorkType, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'تلبيسة', isActive: true },
  { name: 'جسر', isActive: true },
  { name: 'طقم جزئي', isActive: true },
  { name: 'طقم كامل', isActive: true },
  { name: 'تقويم', isActive: true },
  { name: 'حشوة', isActive: true }
];

// إنشاء المتجر
export const useLabRequestStore = create<LabRequestState>()(
  persist(
    (set, get) => ({
      // البيانات الأساسية
      labs: [],
      workTypes: [],
      labRequests: [],

      // معرفات آخر عنصر
      lastLabId: 0,
      lastWorkTypeId: 0,
      lastRequestId: 0,

      // إصدار البيانات
      version: 1,

      // أفعال إدارة المخابر
      addLab: async (name) => {
        try {
          const validation = validateLabData(name, get().labs);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastLabId + 1;
          const now = new Date().toISOString();

          const newLab: Lab = {
            id: newId,
            name: name.trim(),
            isActive: true,
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            labs: [...state.labs, newLab],
            lastLabId: newId
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      updateLab: async (id, name) => {
        try {
          const validation = validateLabData(name, get().labs, id);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const now = new Date().toISOString();

          set(state => ({
            labs: state.labs.map(lab =>
              lab.id === id
                ? { ...lab, name: name.trim(), updatedAt: now }
                : lab
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      deleteLab: async (id) => {
        try {
          // التحقق من عدم وجود طلبات مرتبطة بهذا المخبر
          const relatedRequests = get().labRequests.filter(request => request.labId === id);
          if (relatedRequests.length > 0) {
            throw new Error('لا يمكن حذف المخبر لوجود طلبات مرتبطة به');
          }

          const now = new Date().toISOString();

          set(state => ({
            labs: state.labs.map(lab =>
              lab.id === id
                ? { ...lab, isActive: false, updatedAt: now }
                : lab
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      getActiveLabs: () => {
        return get().labs.filter(lab => lab.isActive);
      },

      // أفعال إدارة أنواع الأعمال
      addWorkType: async (name) => {
        try {
          const validation = validateWorkTypeData(name, get().workTypes);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastWorkTypeId + 1;
          const now = new Date().toISOString();

          const newWorkType: WorkType = {
            id: newId,
            name: name.trim(),
            isActive: true,
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            workTypes: [...state.workTypes, newWorkType],
            lastWorkTypeId: newId
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      updateWorkType: async (id, name) => {
        try {
          const validation = validateWorkTypeData(name, get().workTypes, id);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const now = new Date().toISOString();

          set(state => ({
            workTypes: state.workTypes.map(workType =>
              workType.id === id
                ? { ...workType, name: name.trim(), updatedAt: now }
                : workType
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      deleteWorkType: async (id) => {
        try {
          // التحقق من عدم وجود طلبات مرتبطة بهذا النوع
          const relatedRequests = get().labRequests.filter(request => request.workTypeId === id);
          if (relatedRequests.length > 0) {
            throw new Error('لا يمكن حذف نوع العمل لوجود طلبات مرتبطة به');
          }

          const now = new Date().toISOString();

          set(state => ({
            workTypes: state.workTypes.map(workType =>
              workType.id === id
                ? { ...workType, isActive: false, updatedAt: now }
                : workType
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      getActiveWorkTypes: () => {
        return get().workTypes.filter(workType => workType.isActive);
      },

      // أفعال إدارة طلبات المخبر
      addLabRequest: async (requestData) => {
        try {
          const validation = validateLabRequestData(requestData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          const newId = get().lastRequestId + 1;
          const now = new Date().toISOString();

          const newRequest: LabRequest = {
            ...requestData,
            id: newId,
            status: 'pending',
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            labRequests: [...state.labRequests, newRequest],
            lastRequestId: newId
          }));

          return newId;
        } catch (error) {
          throw error;
        }
      },

      updateLabRequest: async (id, requestData) => {
        try {
          const existingRequest = get().labRequests.find(req => req.id === id);
          if (!existingRequest) {
            throw new Error('الطلب غير موجود');
          }

          // لا يمكن تعديل الطلبات المستلمة
          if (existingRequest.status === 'received') {
            throw new Error('لا يمكن تعديل الطلبات المستلمة');
          }

          const now = new Date().toISOString();

          set(state => ({
            labRequests: state.labRequests.map(request =>
              request.id === id
                ? { ...request, ...requestData, updatedAt: now }
                : request
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      deleteLabRequest: async (id) => {
        try {
          const existingRequest = get().labRequests.find(req => req.id === id);
          if (!existingRequest) {
            throw new Error('الطلب غير موجود');
          }

          // لا يمكن حذف الطلبات المستلمة
          if (existingRequest.status === 'received') {
            throw new Error('لا يمكن حذف الطلبات المستلمة');
          }

          set(state => ({
            labRequests: state.labRequests.filter(request => request.id !== id)
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      markAsReceived: async (id) => {
        try {
          const existingRequest = get().labRequests.find(req => req.id === id);
          if (!existingRequest) {
            throw new Error('الطلب غير موجود');
          }

          if (existingRequest.status === 'received') {
            throw new Error('الطلب مستلم مسبقاً');
          }

          const now = new Date().toISOString();

          set(state => ({
            labRequests: state.labRequests.map(request =>
              request.id === id
                ? {
                    ...request,
                    status: 'received',
                    receivedDate: format(new Date(), 'yyyy-MM-dd'),
                    updatedAt: now
                  }
                : request
            )
          }));

          return true;
        } catch (error) {
          throw error;
        }
      },

      // البحث والتصفية
      getPendingRequests: () => {
        return get().labRequests
          .filter(request => request.status === 'pending')
          .sort((a, b) => new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime());
      },

      getReceivedRequests: () => {
        return get().labRequests
          .filter(request => request.status === 'received')
          .sort((a, b) => new Date(b.receivedDate || b.updatedAt).getTime() - new Date(a.receivedDate || a.updatedAt).getTime());
      },

      getRequestsByLab: (labId) => {
        return get().labRequests.filter(request => request.labId === labId);
      },

      getRequestsByWorkType: (workTypeId) => {
        return get().labRequests.filter(request => request.workTypeId === workTypeId);
      },

      getOverdueRequests: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().labRequests.filter(request =>
          request.status === 'pending' && request.expectedReturnDate < today
        );
      },

      getTodayDeliveries: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().labRequests.filter(request =>
          request.status === 'pending' && request.expectedReturnDate === today
        );
      },

      // حساب حالة التسليم
      getDeliveryStatus: (expectedReturnDate) => {
        const today = new Date();
        const returnDate = new Date(expectedReturnDate);

        // إزالة الوقت للمقارنة بالتاريخ فقط
        today.setHours(0, 0, 0, 0);
        returnDate.setHours(0, 0, 0, 0);

        const diffTime = returnDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysDiff > 0) {
          return {
            type: 'remaining',
            days: daysDiff,
            message: `متبقي ${daysDiff} ${daysDiff === 1 ? 'يوم' : 'أيام'}`
          };
        } else if (daysDiff === 0) {
          return {
            type: 'today',
            days: 0,
            message: 'اليوم موعد التسليم'
          };
        } else {
          return {
            type: 'overdue',
            days: Math.abs(daysDiff),
            message: `متأخر ${Math.abs(daysDiff)} ${Math.abs(daysDiff) === 1 ? 'يوم' : 'أيام'}`
          };
        }
      },

      // إحصائيات
      getOverdueCount: () => {
        return get().getOverdueRequests().length;
      },

      getTodayDeliveryCount: () => {
        return get().getTodayDeliveries().length;
      }
    }),
    {
      name: 'lab-request-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // إذا كانت هذه أول مرة أو إصدار قديم، قم بتهيئة البيانات الافتراضية
        if (version < 1 || !persistedState.labs || persistedState.labs.length === 0) {
          const now = new Date().toISOString();

          // تهيئة المخابر الافتراضية
          const initializedLabs: Lab[] = defaultLabs.map((lab, index) => ({
            ...lab,
            id: index + 1,
            createdAt: now,
            updatedAt: now
          }));

          // تهيئة أنواع الأعمال الافتراضية
          const initializedWorkTypes: WorkType[] = defaultWorkTypes.map((workType, index) => ({
            ...workType,
            id: index + 1,
            createdAt: now,
            updatedAt: now
          }));

          return {
            ...persistedState,
            labs: initializedLabs,
            workTypes: initializedWorkTypes,
            labRequests: persistedState.labRequests || [],
            lastLabId: defaultLabs.length,
            lastWorkTypeId: defaultWorkTypes.length,
            lastRequestId: persistedState.lastRequestId || 0,
            version: 1
          };
        }

        return persistedState;
      }
    }
  )
);

// دالة لتهيئة البيانات الافتراضية إذا لم تكن موجودة
export const initializeDefaultLabData = () => {
  const store = useLabRequestStore.getState();

  // تهيئة المخابر الافتراضية إذا لم تكن موجودة
  if (store.labs.length === 0) {
    const now = new Date().toISOString();

    const initializedLabs: Lab[] = defaultLabs.map((lab, index) => ({
      ...lab,
      id: index + 1,
      createdAt: now,
      updatedAt: now
    }));

    const initializedWorkTypes: WorkType[] = defaultWorkTypes.map((workType, index) => ({
      ...workType,
      id: index + 1,
      createdAt: now,
      updatedAt: now
    }));

    useLabRequestStore.setState({
      labs: initializedLabs,
      workTypes: initializedWorkTypes,
      lastLabId: defaultLabs.length,
      lastWorkTypeId: defaultWorkTypes.length
    });
  }
};
