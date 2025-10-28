import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { PhotoIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useXRayStore } from '../store/xrayStore';
import { useImageLazyLoading, useDataPagination } from '../hooks/usePatientDetailsOptimization';
import { xrayTypeNames } from '../data/xrays';

interface OptimizedXRayGalleryProps {
  patientId: number;
  itemsPerPage?: number;
}

// مكون الصورة مع التحميل التدريجي
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { loadImage, isImageLoaded, isImageLoading } = useImageLazyLoading();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isImageLoaded(src) && !isImageLoading(src)) {
            loadImage(src)
              .then(() => {
                setIsLoaded(true);
                onLoad?.();
              })
              .catch(() => {
                setHasError(true);
                onError?.();
              });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src, loadImage, isImageLoaded, isImageLoading, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-400">
          <PhotoIcon className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">فشل في تحميل الصورة</p>
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
      <img
        ref={imgRef}
        src={isLoaded ? src : ''}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
    </div>
  );
};

const OptimizedXRayGallery: React.FC<OptimizedXRayGalleryProps> = ({
  patientId,
  itemsPerPage = 6
}) => {
  const { getXRaysByPatientId, deleteXRay } = useXRayStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // الحصول على الصور الشعاعية
  const allXRays = getXRaysByPatientId(patientId);

  // تصفية الصور حسب النوع
  const filteredXRays = React.useMemo(() => {
    if (filterType === 'all') return allXRays;
    return allXRays.filter(xray => xray.type === filterType);
  }, [allXRays, filterType]);

  // ترتيب الصور
  const sortedXRays = React.useMemo(() => {
    return [...filteredXRays].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const getValidXRayDate = (xray: any) => {
            try {
              const date = new Date(xray.date);
              return isNaN(date.getTime()) ? new Date(0) : date;
            } catch (error) {
              return new Date(0);
            }
          };

          comparison = getValidXRayDate(a).getTime() - getValidXRayDate(b).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type, 'ar');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredXRays, sortBy, sortOrder]);

  // استخدام التقسيم إلى صفحات
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedXRays,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage
  } = useDataPagination(sortedXRays, itemsPerPage);

  // الحصول على أنواع الصور المتاحة
  const availableTypes = React.useMemo(() => {
    const types = new Set(allXRays.map(xray => xray.type));
    return Array.from(types);
  }, [allXRays]);

  // دالة حذف الصورة
  const handleDeleteXRay = useCallback(async (xrayId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      try {
        await deleteXRay(xrayId);
      } catch (error) {
        console.error('خطأ في حذف الصورة:', error);
      }
    }
  }, [deleteXRay]);

  // دالة تغيير الترتيب
  const handleSort = (newSortBy: 'date' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

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
            الصور الشعاعية ({filteredXRays.length})
          </h4>
          
          {/* تصفية حسب النوع */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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

      {/* شبكة الصور */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedXRays.map((xray) => (
          <div key={xray.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* الصورة */}
            <div className="aspect-w-16 aspect-h-12 bg-gray-100">
              <LazyImage
                src={xray.imageUrl}
                alt={`صورة شعاعية - ${xrayTypeNames[xray.type as keyof typeof xrayTypeNames] || xray.type}`}
                className="w-full h-48 object-cover"
              />
            </div>

            {/* معلومات الصورة */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">
                  {xrayTypeNames[xray.type as keyof typeof xrayTypeNames] || xray.type}
                </h5>
                <span className="text-xs text-gray-500">
                  {(() => {
                    try {
                      const date = new Date(xray.date);
                      return isNaN(date.getTime()) ? 'تاريخ غير صالح' : format(date, 'dd/MM/yyyy');
                    } catch (error) {
                      return 'تاريخ غير صالح';
                    }
                  })()}
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
                  onClick={() => handleDeleteXRay(xray.id)}
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
            onClick={goToPreviousPage}
            disabled={!hasPreviousPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            صفحة {currentPage} من {totalPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={!hasNextPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}

      {/* مودال عرض الصورة */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="صورة شعاعية"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedXRayGallery;
