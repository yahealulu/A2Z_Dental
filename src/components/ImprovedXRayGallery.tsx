import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { PhotoIcon, EyeIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useXRayStore } from '../store/xrayStore';
import { xrayTypeNames } from '../data/xrays';
import { useImageMemoryManager, useImagePerformanceTracker, useAdaptiveImageQuality } from '../hooks/useImageMemoryManager';

interface ImprovedXRayGalleryProps {
  patientId: number;
  itemsPerPage?: number;
}

// Hook لإدارة الصور المبسط
const useImageOptimization = () => {
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [memoryStats, setMemoryStats] = useState({ totalImages: 0, estimatedMemory: 0 });
  const [loadingStats, setLoadingStats] = useState({ totalLoads: 0, successfulLoads: 0, averageLoadTime: 0 });

  const createThumbnail = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const size = 200;
        canvas.width = size;
        canvas.height = size;

        // حساب موضع الصورة للحفاظ على النسبة
        const scale = Math.min(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (size - scaledWidth) / 2;
        const y = (size - scaledHeight) / 2;

        // رسم خلفية رمادية
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, size, size);

        // رسم الصورة
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }, []);

  const getThumbnail = useCallback(async (originalUrl: string): Promise<string> => {
    // البحث في الذاكرة المؤقتة أولاً
    if (thumbnailCache.has(originalUrl)) {
      return thumbnailCache.get(originalUrl)!;
    }

    // إذا كان قيد التحميل
    if (loadingImages.has(originalUrl)) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (thumbnailCache.has(originalUrl)) {
            resolve(thumbnailCache.get(originalUrl)!);
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    setLoadingImages(prev => new Set(prev).add(originalUrl));

    try {
      const thumbnailUrl = await createThumbnail(originalUrl);

      setThumbnailCache(prev => new Map(prev).set(originalUrl, thumbnailUrl));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalUrl);
        return newSet;
      });

      return thumbnailUrl;
    } catch (error) {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalUrl);
        return newSet;
      });
      throw error;
    }
  }, [thumbnailCache, loadingImages, createThumbnail]);

  const clearCache = useCallback(() => {
    setThumbnailCache(new Map());
  }, []);

  // تحديث الإحصائيات
  useEffect(() => {
    setMemoryStats({
      totalImages: thumbnailCache.size,
      estimatedMemory: thumbnailCache.size * 0.1 // تقدير تقريبي
    });
  }, [thumbnailCache.size]);

  return {
    getThumbnail,
    clearCache,
    memoryStats,
    loadingStats,
    isMemoryFull: thumbnailCache.size > 30,
    cacheSize: thumbnailCache.size
  };
};

// مكون الصورة المحسن مع Lazy Loading
const LazyXRayImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  showThumbnail?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, showThumbnail = true, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { getThumbnail } = useImageOptimization();

  const loadImageContent = useCallback(async () => {
    try {
      if (showThumbnail) {
        // تحميل thumbnail أولاً للعرض السريع
        const thumbnailUrl = await getThumbnail(src);
        setDisplayUrl(thumbnailUrl);
      } else {
        // تحميل الصورة الأصلية مباشرة
        setDisplayUrl(src);
      }

      setIsLoaded(true);
      onLoad?.();
    } catch (error) {
      console.error('خطأ في تحميل الصورة:', error);
      // في حالة فشل thumbnail، جرب الصورة الأصلية
      if (showThumbnail) {
        try {
          setDisplayUrl(src);
          setIsLoaded(true);
          onLoad?.();
          return;
        } catch (originalError) {
          console.error('خطأ في تحميل الصورة الأصلية:', originalError);
        }
      }
      setHasError(true);
      onError?.();
    }
  }, [src, showThumbnail, getThumbnail, onLoad, onError]);

  // تحميل فوري عند التحميل
  useEffect(() => {
    if (src && !isLoaded && !hasError) {
      const timer = setTimeout(() => {
        loadImageContent();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [src, isLoaded, hasError, loadImageContent]);

  // Intersection Observer للتحميل التدريجي
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded && !hasError) {
            loadImageContent();
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '100px' // تحميل مسبق أكبر
      }
    );

    observerRef.current.observe(img);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, isLoaded, hasError, loadImageContent]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-400">
          <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">فشل في تحميل الصورة</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoaded(false);
              loadImageContent();
            }}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            <ArrowPathIcon className="h-4 w-4 inline ml-1" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="text-center text-gray-400">
            <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-xs">جاري التحميل...</p>
          </div>
        </div>
      )}
      {displayUrl && (
        <img
          ref={imgRef}
          src={displayUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      )}
      {!displayUrl && (
        <div ref={imgRef} className="w-full h-full" />
      )}
    </div>
  );
};

const ImprovedXRayGallery: React.FC<ImprovedXRayGalleryProps> = ({
  patientId,
  itemsPerPage = 6
}) => {
  const { getXRaysByPatientId, deleteXRay, xrays } = useXRayStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, xrayId: number, xrayType: string} | null>(null);
  const { clearCache, memoryStats, loadingStats, isMemoryFull } = useImageOptimization();

  // الحصول على الصور الشعاعية للمريض
  const allXRays = getXRaysByPatientId(patientId);

  // تصفية وترتيب الصور
  const processedXRays = useMemo(() => {
    let filtered = allXRays;
    
    // تصفية حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(xray => xray.type === filterType);
    }
    
    // ترتيب
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          comparison = dateA - dateB;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type, 'ar');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [allXRays, filterType, sortBy, sortOrder]);

  // تقسيم إلى صفحات
  const totalPages = Math.ceil(processedXRays.length / itemsPerPage);
  const paginatedXRays = processedXRays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // أنواع الصور المتاحة
  const availableTypes = useMemo(() => {
    const types = new Set(allXRays.map(xray => xray.type));
    return Array.from(types);
  }, [allXRays]);

  // دالة حذف الصورة
  const handleDeleteXRay = useCallback(async (xrayId: number) => {
    try {
      await deleteXRay(xrayId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
    }
  }, [deleteXRay]);

  // دالة فتح مودال الحذف
  const openDeleteConfirm = useCallback((xrayId: number, xrayType: string) => {
    setDeleteConfirm({
      show: true,
      xrayId,
      xrayType
    });
  }, []);

  // دالة تغيير الترتيب
  const handleSort = (newSortBy: 'date' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // تنظيف الذاكرة المؤقتة عند تغيير المريض
  useEffect(() => {
    return () => {
      clearCache();
    };
  }, [patientId, clearCache]);

  // إعادة تحميل البيانات عند تغيير عدد الصور (للتحديث عند الإضافة/الحذف)
  useEffect(() => {
    // هذا سيؤدي إلى إعادة تحديث المكون عند تغيير البيانات في المتجر
  }, [xrays.length, patientId]);

  if (allXRays.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <PhotoIcon className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد صور شعاعية</h3>
        <p className="text-gray-500">لم يتم رفع أي صور شعاعية لهذا المريض بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط التحكم */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h4 className="text-base font-medium text-gray-900">
            الصور الشعاعية ({processedXRays.length})
          </h4>

          {/* معلومات الذاكرة المؤقتة */}
          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded ${
              isMemoryFull ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}>
              ذاكرة: {memoryStats.totalImages} صور ({memoryStats.estimatedMemory.toFixed(1)} MB)
            </div>

            {/* زر عرض الإحصائيات */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {showStats ? 'إخفاء' : 'عرض'} الإحصائيات
            </button>
          </div>

          {/* تصفية حسب النوع */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">جميع الأنواع</option>
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {xrayTypeNames[type as keyof typeof xrayTypeNames] || type}
              </option>
            ))}
          </select>
        </div>

        {/* أزرار الترتيب */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('date')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'date'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ترتيب بالتاريخ {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('type')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'type'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ترتيب بالنوع {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* لوحة الإحصائيات */}
      {showStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-3">إحصائيات الأداء</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">الذاكرة المؤقتة:</span>
              <div className="text-blue-600">
                {memoryStats.totalImages} صورة ({memoryStats.estimatedMemory.toFixed(1)} MB)
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">التحميل:</span>
              <div className="text-blue-600">
                {loadingStats.totalLoads} محاولة ({loadingStats.successfulLoads} نجح)
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">متوسط الوقت:</span>
              <div className="text-blue-600">
                {loadingStats.averageLoadTime.toFixed(0)} مللي ثانية
              </div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">معدل النجاح:</span>
              <div className="text-blue-600">
                {loadingStats.totalLoads > 0
                  ? ((loadingStats.successfulLoads / loadingStats.totalLoads) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>

          {/* زر تنظيف الذاكرة */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <button
              onClick={clearCache}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              تنظيف الذاكرة المؤقتة
            </button>
          </div>
        </div>
      )}

      {/* شبكة الصور */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedXRays.map((xray) => (
          <div key={xray.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* الصورة */}
            <div className="relative w-full h-48 bg-gray-100">
              <LazyXRayImage
                src={xray.imageUrl}
                alt={`صورة شعاعية - ${xrayTypeNames[xray.type as keyof typeof xrayTypeNames] || xray.type}`}
                className="w-full h-full object-cover"
                showThumbnail={true}
              />
            </div>

            {/* معلومات الصورة */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">
                  {xrayTypeNames[xray.type as keyof typeof xrayTypeNames] || xray.type}
                </h5>
                <span className="text-xs text-gray-500">
                  {format(new Date(xray.date), 'dd/MM/yyyy')}
                </span>
              </div>
              
              {xray.notes && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {xray.notes}
                </p>
              )}

              {/* أزرار التحكم */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedImage(xray.imageUrl)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <EyeIcon className="h-4 w-4 ml-1" />
                  عرض
                </button>
                
                <button
                  onClick={() => openDeleteConfirm(xray.id, xrayTypeNames[xray.type as keyof typeof xrayTypeNames] || xray.type)}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 ml-1" />
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* التنقل بين الصفحات */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            صفحة {currentPage} من {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}

      {/* مودال عرض الصورة */}
      {selectedImage && (
        <div
          className="modal-overlay bg-black bg-opacity-90 animate-fadeIn"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={selectedImage}
                alt="صورة شعاعية"
                className="max-w-full max-h-full object-contain"
                style={{
                  minWidth: '800px',
                  minHeight: '500px',
                  backgroundColor: '#000000'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الحذف */}
      {deleteConfirm && (
        <div
          className="modal-overlay bg-black bg-opacity-50 animate-fadeIn"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform animate-slideIn">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mr-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      تأكيد حذف الصورة الشعاعية
                    </h3>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    هل أنت متأكد من حذف صورة <span className="font-medium">{deleteConfirm.xrayType}</span>؟
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    لا يمكن التراجع عن هذا الإجراء.
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleDeleteXRay(deleteConfirm.xrayId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    حذف الصورة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedXRayGallery;
