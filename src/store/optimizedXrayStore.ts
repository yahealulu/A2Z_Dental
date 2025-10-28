import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { imageStorage, type ImageMetadata, type StoredImage } from '../utils/imageStorage';

// نموذج بيانات الصورة الشعاعية المحسن
export interface OptimizedXRay {
  id: number;
  patientId: number;
  type: XRayType;
  imageId: string; // معرف الصورة في نظام التخزين
  date: string;
  notes?: string;
  metadata: ImageMetadata;
  createdAt: string;
  updatedAt: string;
}

export type XRayType = 'panorama' | 'cephalometric' | 'periapical' | 'cbct' | 'occlusal' | 'bitewing';

// Cache للصور المحملة
interface ImageCache {
  [imageId: string]: {
    url: string;
    thumbnailUrl: string;
    lastAccessed: number;
    isLoading: boolean;
  };
}

// حالة المتجر المحسن
interface OptimizedXRayState {
  xrays: OptimizedXRay[];
  lastId: number;
  version: number;
  
  // Cache management
  imageCache: ImageCache;
  maxCacheSize: number;
  cacheCleanupInterval: number;
  
  // Patient-specific loading
  loadedPatients: Set<number>;
  loadingPatients: Set<number>;
  
  // Actions
  addXRay: (file: File, xrayData: Omit<OptimizedXRay, 'id' | 'imageId' | 'metadata' | 'createdAt' | 'updatedAt'>) => Promise<OptimizedXRay>;
  updateXRay: (id: number, updates: Partial<OptimizedXRay>) => Promise<boolean>;
  deleteXRay: (id: number) => Promise<boolean>;
  
  // Patient-specific operations
  loadPatientXRays: (patientId: number) => Promise<OptimizedXRay[]>;
  getPatientXRays: (patientId: number) => OptimizedXRay[];
  unloadPatientXRays: (patientId: number) => void;
  
  // Image loading
  loadImageUrl: (imageId: string) => Promise<string>;
  loadThumbnailUrl: (imageId: string) => Promise<string>;
  preloadImages: (imageIds: string[]) => Promise<void>;
  
  // Cache management
  cleanupCache: () => void;
  clearPatientCache: (patientId: number) => void;
  getCacheStats: () => { size: number; memoryUsage: number };
}

// وظائف مساعدة
const validateXRayData = (xray: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!xray.patientId) errors.push('معرف المريض مطلوب');
  if (!xray.type) errors.push('نوع الأشعة مطلوب');
  if (!xray.date) errors.push('تاريخ الأشعة مطلوب');
  
  return { isValid: errors.length === 0, errors };
};

const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 دقائق
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 دقيقة
const MAX_CACHE_SIZE = 50; // عدد الصور في الذاكرة

export const useOptimizedXRayStore = create<OptimizedXRayState>()(
  persist(
    (set, get) => ({
      xrays: [],
      lastId: 0,
      version: 1,
      imageCache: {},
      maxCacheSize: MAX_CACHE_SIZE,
      cacheCleanupInterval: CACHE_CLEANUP_INTERVAL,
      loadedPatients: new Set(),
      loadingPatients: new Set(),

      // إضافة صورة شعاعية جديدة
      addXRay: async (file, xrayData) => {
        try {
          const validation = validateXRayData(xrayData);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // حفظ الصورة في نظام التخزين
          const storedImage: StoredImage = await imageStorage.saveImage(file, xrayData.patientId);
          
          const newId = get().lastId + 1;
          const now = new Date().toISOString();

          const newXRay: OptimizedXRay = {
            ...xrayData,
            id: newId,
            imageId: storedImage.metadata.id,
            metadata: storedImage.metadata,
            createdAt: now,
            updatedAt: now
          };

          set(state => ({
            xrays: [...state.xrays, newXRay],
            lastId: newId
          }));

          return newXRay;
        } catch (error) {
          console.error('خطأ في إضافة الصورة الشعاعية:', error);
          throw error;
        }
      },

      // تحديث صورة شعاعية
      updateXRay: async (id, updates) => {
        try {
          const xray = get().xrays.find(x => x.id === id);
          if (!xray) {
            throw new Error('الصورة الشعاعية غير موجودة');
          }

          const updatedXRay = {
            ...xray,
            ...updates,
            updatedAt: new Date().toISOString()
          };

          const validation = validateXRayData(updatedXRay);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          set(state => ({
            xrays: state.xrays.map(x => x.id === id ? updatedXRay : x)
          }));

          return true;
        } catch (error) {
          console.error('خطأ في تحديث الصورة الشعاعية:', error);
          throw error;
        }
      },

      // حذف صورة شعاعية
      deleteXRay: async (id) => {
        try {
          const xray = get().xrays.find(x => x.id === id);
          if (!xray) {
            throw new Error('الصورة الشعاعية غير موجودة');
          }

          // حذف الصورة من نظام التخزين
          await imageStorage.deleteImage(xray.imageId);

          // إزالة من الذاكرة المؤقتة
          const cache = get().imageCache;
          if (cache[xray.imageId]) {
            URL.revokeObjectURL(cache[xray.imageId].url);
            URL.revokeObjectURL(cache[xray.imageId].thumbnailUrl);
            delete cache[xray.imageId];
          }

          set(state => ({
            xrays: state.xrays.filter(x => x.id !== id),
            imageCache: { ...cache }
          }));

          return true;
        } catch (error) {
          console.error('خطأ في حذف الصورة الشعاعية:', error);
          throw error;
        }
      },

      // تحميل صور مريض معين
      loadPatientXRays: async (patientId) => {
        const state = get();
        
        if (state.loadedPatients.has(patientId) || state.loadingPatients.has(patientId)) {
          return state.xrays.filter(x => x.patientId === patientId);
        }

        set(state => ({
          loadingPatients: new Set(state.loadingPatients).add(patientId)
        }));

        try {
          // في النظام الحالي، البيانات محملة مسبقاً
          // في المستقبل يمكن تحميلها من قاعدة البيانات
          const patientXRays = state.xrays.filter(x => x.patientId === patientId);
          
          set(state => ({
            loadedPatients: new Set(state.loadedPatients).add(patientId),
            loadingPatients: new Set([...state.loadingPatients].filter(id => id !== patientId))
          }));

          return patientXRays;
        } catch (error) {
          set(state => ({
            loadingPatients: new Set([...state.loadingPatients].filter(id => id !== patientId))
          }));
          throw error;
        }
      },

      // الحصول على صور مريض (من الذاكرة)
      getPatientXRays: (patientId) => {
        return get().xrays.filter(x => x.patientId === patientId);
      },

      // إلغاء تحميل صور مريض
      unloadPatientXRays: (patientId) => {
        const state = get();
        const patientXRays = state.xrays.filter(x => x.patientId === patientId);
        
        // تنظيف الذاكرة المؤقتة للصور
        patientXRays.forEach(xray => {
          const cached = state.imageCache[xray.imageId];
          if (cached) {
            URL.revokeObjectURL(cached.url);
            URL.revokeObjectURL(cached.thumbnailUrl);
            delete state.imageCache[xray.imageId];
          }
        });

        set(state => ({
          loadedPatients: new Set([...state.loadedPatients].filter(id => id !== patientId)),
          imageCache: { ...state.imageCache }
        }));
      },

      // تحميل رابط الصورة
      loadImageUrl: async (imageId) => {
        const cache = get().imageCache;
        
        if (cache[imageId] && !cache[imageId].isLoading) {
          cache[imageId].lastAccessed = Date.now();
          return cache[imageId].url;
        }

        if (cache[imageId]?.isLoading) {
          // انتظار التحميل الجاري
          return new Promise((resolve) => {
            const checkLoading = () => {
              const currentCache = get().imageCache;
              if (currentCache[imageId] && !currentCache[imageId].isLoading) {
                resolve(currentCache[imageId].url);
              } else {
                setTimeout(checkLoading, 100);
              }
            };
            checkLoading();
          });
        }

        // بدء التحميل
        set(state => ({
          imageCache: {
            ...state.imageCache,
            [imageId]: {
              url: '',
              thumbnailUrl: '',
              lastAccessed: Date.now(),
              isLoading: true
            }
          }
        }));

        try {
          const [imageUrl, thumbnailUrl] = await Promise.all([
            imageStorage.loadImage(imageId),
            imageStorage.loadThumbnail(imageId)
          ]);

          set(state => ({
            imageCache: {
              ...state.imageCache,
              [imageId]: {
                url: imageUrl,
                thumbnailUrl: thumbnailUrl,
                lastAccessed: Date.now(),
                isLoading: false
              }
            }
          }));

          return imageUrl;
        } catch (error) {
          // إزالة من الذاكرة المؤقتة في حالة الخطأ
          set(state => {
            const newCache = { ...state.imageCache };
            delete newCache[imageId];
            return { imageCache: newCache };
          });
          throw error;
        }
      },

      // تحميل رابط thumbnail
      loadThumbnailUrl: async (imageId) => {
        const cache = get().imageCache;
        
        if (cache[imageId]) {
          cache[imageId].lastAccessed = Date.now();
          return cache[imageId].thumbnailUrl || cache[imageId].url;
        }

        // تحميل الصورة إذا لم تكن محملة
        await get().loadImageUrl(imageId);
        return get().imageCache[imageId]?.thumbnailUrl || get().imageCache[imageId]?.url || '';
      },

      // تحميل مسبق للصور
      preloadImages: async (imageIds) => {
        const promises = imageIds.map(id => get().loadImageUrl(id).catch(() => {}));
        await Promise.all(promises);
      },

      // تنظيف الذاكرة المؤقتة
      cleanupCache: () => {
        const state = get();
        const now = Date.now();
        const newCache: ImageCache = {};
        
        Object.entries(state.imageCache).forEach(([imageId, cached]) => {
          if (now - cached.lastAccessed < MAX_CACHE_AGE) {
            newCache[imageId] = cached;
          } else {
            URL.revokeObjectURL(cached.url);
            URL.revokeObjectURL(cached.thumbnailUrl);
          }
        });

        set({ imageCache: newCache });
      },

      // تنظيف ذاكرة مريض معين
      clearPatientCache: (patientId) => {
        get().unloadPatientXRays(patientId);
      },

      // إحصائيات الذاكرة المؤقتة
      getCacheStats: () => {
        const cache = get().imageCache;
        const size = Object.keys(cache).length;
        const memoryUsage = size * 0.5; // تقدير تقريبي بالميجابايت
        
        return { size, memoryUsage };
      }
    }),
    {
      name: 'optimized-xrays-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // حفظ البيانات الأساسية فقط، ليس الصور
      partialize: (state) => ({
        xrays: state.xrays,
        lastId: state.lastId,
        version: state.version
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // إعادة تهيئة الحالات المؤقتة
          state.imageCache = {};
          state.loadedPatients = new Set();
          state.loadingPatients = new Set();
          
          // بدء تنظيف دوري للذاكرة المؤقتة
          setInterval(() => {
            state.cleanupCache();
          }, state.cacheCleanupInterval);
        }
      }
    }
  )
);
