import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import {
  PlusIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useLabRequestStore, initializeDefaultLabData, type LabRequest, type Lab } from '../store/labRequestStore';
import { useLabPaymentStore } from '../store/labPaymentStore';
import { notify, useNotificationStore } from '../store/notificationStore';
import ConfirmationModal from '../components/ConfirmationModal';
import AddLabRequestModal from '../components/AddLabRequestModal';
import Pagination from '../components/Pagination';

const LabRequests = () => {
  // حالات المكونات
  const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'accounts'>('requests');
  const [labPaymentModal, setLabPaymentModal] = useState<{ lab: Lab; amount: string; date: string; note: string } | null>(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [categoryType, setCategoryType] = useState<'labs' | 'workTypes'>('labs');

  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; type: 'labs' | 'workTypes' } | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<{ id: number; name: string; type: 'labs' | 'workTypes' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LabRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'remaining' | 'today' | 'overdue'>('all');

  // متغيرات التصفية لجدول السجل
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySelectedLab, setHistorySelectedLab] = useState('');
  const [historySelectedWorkType, setHistorySelectedWorkType] = useState('');

  // متغيرات Pagination والتحسينات
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // عدد العناصر في كل صفحة
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize] = useState(50);

  // متغيرات البحث المحسن
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [debouncedHistorySearchQuery, setDebouncedHistorySearchQuery] = useState('');

  // متغيرات التحميل والأداء (محجوزة للاستخدام المستقبلي)

  // Cache للحسابات المعقدة - استخدام ref لتجنب re-renders
  const deliveryStatusCacheRef = useRef<Map<string, any>>(new Map());
  const notificationProcessedRef = useRef<Set<string>>(new Set());

  // المتجر
  const {
    getActiveLabs,
    getActiveWorkTypes,
    addLab,
    updateLab,
    deleteLab,
    addWorkType,
    updateWorkType,
    deleteWorkType,
    getPendingRequests,
    getReceivedRequests,
    getOverdueCount,
    getTodayDeliveryCount,
    markAsReceived,
    getRequestsByLab
  } = useLabRequestStore();
  const { addPayment: addLabPayment, getPaymentsByLabId } = useLabPaymentStore();

  // تهيئة البيانات الافتراضية عند تحميل المكون
  useEffect(() => {
    initializeDefaultLabData();
  }, []);

  // Debounced Search للطلبات المعلقة
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // إعادة تعيين الصفحة عند البحث
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Debounced Search للسجل
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedHistorySearchQuery(historySearchQuery);
      setHistoryCurrentPage(1); // إعادة تعيين الصفحة عند البحث
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [historySearchQuery]);

  // الحصول على البيانات النشطة
  const activeLabs = getActiveLabs();
  const activeWorkTypes = getActiveWorkTypes();
  const allPendingRequests = getPendingRequests();
  const allReceivedRequests = getReceivedRequests();
  const overdueCount = getOverdueCount();
  const todayDeliveryCount = getTodayDeliveryCount();

  // دالة محسنة للحصول على حالة التسليم مع Cache
  const getDeliveryStatusCached = useCallback((expectedReturnDate: string) => {
    const cacheKey = expectedReturnDate;

    // استخدام ref للوصول للـ cache الحالي بدون dependency
    const currentCache = deliveryStatusCacheRef.current;
    if (currentCache.has(cacheKey)) {
      return currentCache.get(cacheKey);
    }

    const status = useLabRequestStore.getState().getDeliveryStatus(expectedReturnDate);
    deliveryStatusCacheRef.current.set(cacheKey, status);
    return status;
  }, []); // لا dependencies لأننا نستخدم ref

  // تصفية الطلبات المعلقة مع Memoization
  const filteredPendingRequests = useMemo(() => {
    let filtered = allPendingRequests;

    // تصفية البحث
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(request =>
        request.patientName.toLowerCase().includes(query) ||
        request.labName.toLowerCase().includes(query) ||
        request.workTypeName.toLowerCase().includes(query) ||
        request.color.toLowerCase().includes(query) ||
        request.notes?.toLowerCase().includes(query) ||
        request.teethNumbers.some(tooth => tooth.toString().includes(query))
      );
    }

    // تصفية المخبر
    if (selectedLab) {
      filtered = filtered.filter(request => request.labId === parseInt(selectedLab));
    }

    // تصفية نوع العمل
    if (selectedWorkType) {
      filtered = filtered.filter(request => request.workTypeId === parseInt(selectedWorkType));
    }

    // تصفية حالة التسليم
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(request => {
        const status = getDeliveryStatusCached(request.expectedReturnDate);
        return status.type === selectedStatus;
      });
    }

    return filtered;
  }, [allPendingRequests, debouncedSearchQuery, selectedLab, selectedWorkType, selectedStatus, getDeliveryStatusCached]);

  // Pagination للطلبات المعلقة
  const totalPendingPages = Math.ceil(filteredPendingRequests.length / pageSize);
  const paginatedPendingRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPendingRequests.slice(startIndex, endIndex);
  }, [filteredPendingRequests, currentPage, pageSize]);

  const pendingRequests = paginatedPendingRequests;

  // تصفية السجل مع Memoization
  const filteredHistoryRequests = useMemo(() => {
    let filtered = allReceivedRequests;

    // تصفية البحث
    if (debouncedHistorySearchQuery.trim()) {
      const query = debouncedHistorySearchQuery.toLowerCase().trim();
      filtered = filtered.filter(request =>
        request.patientName.toLowerCase().includes(query) ||
        request.labName.toLowerCase().includes(query) ||
        request.workTypeName.toLowerCase().includes(query) ||
        request.color.toLowerCase().includes(query) ||
        request.notes?.toLowerCase().includes(query) ||
        request.teethNumbers.some(tooth => tooth.toString().includes(query))
      );
    }

    // تصفية المخبر
    if (historySelectedLab) {
      filtered = filtered.filter(request => request.labId === parseInt(historySelectedLab));
    }

    // تصفية نوع العمل
    if (historySelectedWorkType) {
      filtered = filtered.filter(request => request.workTypeId === parseInt(historySelectedWorkType));
    }

    return filtered;
  }, [allReceivedRequests, debouncedHistorySearchQuery, historySelectedLab, historySelectedWorkType]);

  // Pagination للسجل
  const totalHistoryPages = Math.ceil(filteredHistoryRequests.length / historyPageSize);
  const paginatedHistoryRequests = useMemo(() => {
    const startIndex = (historyCurrentPage - 1) * historyPageSize;
    const endIndex = startIndex + historyPageSize;
    return filteredHistoryRequests.slice(startIndex, endIndex);
  }, [filteredHistoryRequests, historyCurrentPage, historyPageSize]);

  // معالجة الإشعارات مع Background Processing
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const notificationKey = `notifications_${today}`;

    // التحقق من أن الإشعارات لم تتم معالجتها اليوم
    if (notificationProcessedRef.current.has(notificationKey)) return;

    // معالجة فورية للإشعارات
    // مسح الإشعارات المستمرة السابقة
    useNotificationStore.getState().clearPersistentNotifications();

    // إنشاء إشعارات للطلبات المتأخرة باستخدام Cache
    const overdueRequests = allPendingRequests.filter(request => {
      const deliveryStatus = getDeliveryStatusCached(request.expectedReturnDate);
      return deliveryStatus.type === 'overdue';
    });

    if (overdueRequests.length > 0) {
      notify.persistentWarning(
        `${overdueRequests.length} طلب متأخر`,
        'يوجد طلبات متأخرة عن موعد التسليم'
      );
    }

    // إنشاء إشعارات للطلبات المطلوب تسليمها اليوم
    const todayRequests = allPendingRequests.filter(request => {
      const deliveryStatus = getDeliveryStatusCached(request.expectedReturnDate);
      return deliveryStatus.type === 'today';
    });

    if (todayRequests.length > 0) {
      notify.persistentInfo(
        `${todayRequests.length} طلب للتسليم اليوم`,
        'يوجد طلبات مطلوب تسليمها اليوم'
      );
    }

    // تسجيل أن الإشعارات تمت معالجتها لهذا اليوم
    notificationProcessedRef.current.add(notificationKey);

    // تنظيف الإشعارات القديمة (الاحتفاظ بآخر 7 أيام فقط)
    const sevenDaysAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    notificationProcessedRef.current.forEach(key => {
      if (key < `notifications_${sevenDaysAgo}`) {
        notificationProcessedRef.current.delete(key);
      }
    });
  }, [allPendingRequests, getDeliveryStatusCached]);

  // معالجة إضافة فئة جديدة
  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;

    setIsLoading(true);
    try {
      if (categoryType === 'labs') {
        await addLab(categoryName.trim());
        notify.success('تم إضافة المخبر بنجاح');
      } else {
        await addWorkType(categoryName.trim());
        notify.success('تم إضافة نوع العمل بنجاح');
      }
      
      setCategoryName('');
    } catch (error) {
      notify.error('خطأ في الإضافة', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة تعديل فئة
  const handleEditCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;

    setIsLoading(true);
    try {
      if (editingCategory.type === 'labs') {
        await updateLab(editingCategory.id, categoryName.trim());
        notify.success('تم تعديل المخبر بنجاح');
      } else {
        await updateWorkType(editingCategory.id, categoryName.trim());
        notify.success('تم تعديل نوع العمل بنجاح');
      }
      
      setEditingCategory(null);
      setCategoryName('');
    } catch (error) {
      notify.error('خطأ في التعديل', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // معالجة حذف فئة
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setIsLoading(true);
    try {
      if (deletingCategory.type === 'labs') {
        await deleteLab(deletingCategory.id);
        notify.error('تم حذف المخبر');
      } else {
        await deleteWorkType(deletingCategory.id);
        notify.error('تم حذف نوع العمل');
      }
      
      setDeletingCategory(null);
    } catch (error) {
      notify.error('خطأ في الحذف', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // بدء تعديل فئة
  const startEditCategory = (id: number, name: string, type: 'labs' | 'workTypes') => {
    setEditingCategory({ id, name, type });
    setCategoryName(name);
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingCategory(null);
    setCategoryName('');
  };

  // معالجة تعديل طلب
  const handleEditRequest = (request: LabRequest) => {
    setEditingRequest(request);
    setShowAddRequestModal(true);
  };

  // معالجة تأكيد الاستلام
  const handleMarkAsReceived = async (requestId: number) => {
    try {
      await markAsReceived(requestId);
      notify.success('تم تأكيد استلام الطلب');
    } catch (error) {
      notify.error('خطأ في تأكيد الاستلام', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    }
  };

  // إغلاق مودال الطلب
  const handleCloseRequestModal = () => {
    setShowAddRequestModal(false);
    setEditingRequest(null);
  };

  return (
    <div className="space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">طلبات المخبر</h1>
          <div className="flex space-x-4 rtl:space-x-reverse">
            {/* عداد الطلبات المتأخرة */}
            {overdueCount > 0 && (
              <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {overdueCount} طلب متأخر
                  </span>
                </div>
              </div>
            )}
            
            {/* عداد تسليمات اليوم */}
            {todayDeliveryCount > 0 && (
              <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <BeakerIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    {todayDeliveryCount} تسليم اليوم
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'requests'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'requests'
                  ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  : {}
              }
            >
              الطلبات الحالية ({pendingRequests.length})
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'history'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'history'
                  ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  : {}
              }
            >
              عرض السجل ({allReceivedRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'accounts'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                activeTab === 'accounts'
                  ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  : {}
              }
            >
              <BanknotesIcon className="h-4 w-4 inline ml-1 rtl:mr-1 rtl:ml-0" />
              حسابات المخابر
            </button>
          </div>

          <div className="flex space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setShowCategoryManagement(!showCategoryManagement)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <WrenchScrewdriverIcon className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
              {showCategoryManagement ? 'إخفاء' : 'إدارة'} الفئات
            </button>
            
            <button
              onClick={() => setShowAddRequestModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}
            >
              <PlusIcon className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
              إضافة طلب
            </button>
          </div>
        </div>
      </div>

      {/* قسم إدارة الفئات */}
      {showCategoryManagement && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">إدارة الفئات</h2>
          
          {/* تبويبات الفئات */}
          <div className="flex space-x-4 rtl:space-x-reverse mb-6">
            <button
              onClick={() => setCategoryType('labs')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                categoryType === 'labs'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                categoryType === 'labs'
                  ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  : {}
              }
            >
              <BeakerIcon className="h-4 w-4 inline ml-2 rtl:mr-2 rtl:ml-0" />
              المخابر ({activeLabs.length})
            </button>
            
            <button
              onClick={() => setCategoryType('workTypes')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                categoryType === 'workTypes'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                categoryType === 'workTypes'
                  ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  : {}
              }
            >
              <WrenchScrewdriverIcon className="h-4 w-4 inline ml-2 rtl:mr-2 rtl:ml-0" />
              أنواع الأعمال ({activeWorkTypes.length})
            </button>
          </div>

          {/* نموذج إضافة/تعديل فئة */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={`اسم ${categoryType === 'labs' ? 'المخبر' : 'نوع العمل'} الجديد`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingCategory) {
                      handleEditCategory();
                    } else {
                      handleAddCategory();
                    }
                  }
                }}
              />
              
              {editingCategory ? (
                <>
                  <button
                    onClick={handleEditCategory}
                    disabled={isLoading || !categoryName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCategory}
                  disabled={isLoading || !categoryName.trim()}
                  className="px-4 py-2 text-white rounded-lg transition-all duration-300 hover:shadow-lg disabled:bg-gray-400"
                  style={
                    !isLoading && categoryName.trim()
                      ? { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                      : { backgroundColor: '#9CA3AF' }
                  }
                >
                  {isLoading ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              )}
            </div>
          </div>

          {/* قائمة الفئات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categoryType === 'labs' ? activeLabs : activeWorkTypes).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-gray-900">{item.name}</span>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => startEditCategory(item.id, item.name, categoryType)}
                    className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory({ id: item.id, name: item.name, type: categoryType })}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أدوات الفلترة والبحث */}
      {activeTab === 'requests' && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* البحث النصي */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، المخبر، نوع العمل..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* فلترة بالمخبر */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المخبر
              </label>
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع المخابر</option>
                {activeLabs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>

            {/* فلترة بنوع العمل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع العمل
              </label>
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع أنواع الأعمال</option>
                {activeWorkTypes.map((workType) => (
                  <option key={workType.id} value={workType.id}>
                    {workType.name}
                  </option>
                ))}
              </select>
            </div>

            {/* فلترة بحالة التسليم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                حالة التسليم
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'remaining' | 'today' | 'overdue')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="remaining">متبقي وقت</option>
                <option value="today">تسليم اليوم</option>
                <option value="overdue">متأخر</option>
              </select>
            </div>
          </div>

          {/* إحصائيات الفلترة */}
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>
              عرض {pendingRequests.length} من أصل {allPendingRequests.length} طلب
            </span>

            {(searchQuery || selectedLab || selectedWorkType || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLab('');
                  setSelectedWorkType('');
                  setSelectedStatus('all');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                إعادة تعيين الفلاتر
              </button>
            )}
          </div>
        </div>
      )}

      {/* جدول الطلبات */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeTab === 'requests' ? (
          // جدول الطلبات الحالية
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                الطلبات الحالية ({pendingRequests.length})
              </h3>
            </div>

            {filteredPendingRequests.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-l from-primary-600 to-primary-500">
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        المريض
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        المخبر
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        نوع العمل
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        أرقام الأسنان
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        العدد
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        اللون
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        تاريخ التسليم
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        حالة التسليم
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((request) => {
                      const deliveryStatus = getDeliveryStatusCached(request.expectedReturnDate);
                      return (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {request.patientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.labName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.workTypeName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.teethNumbers.join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                            {request.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {request.color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {format(new Date(request.expectedReturnDate), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              {deliveryStatus.type === 'remaining' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  🟢 {deliveryStatus.message}
                                </span>
                              )}
                              {deliveryStatus.type === 'today' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  🟡 {deliveryStatus.message}
                                </span>
                              )}
                              {deliveryStatus.type === 'overdue' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  🔴 {deliveryStatus.message}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2 rtl:space-x-reverse">
                              <button
                                onClick={() => handleEditRequest(request)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="تعديل"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleMarkAsReceived(request.id)}
                                className="text-green-600 hover:text-green-900 transition-colors"
                                title="تم الاستلام"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination للطلبات المعلقة */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPendingPages}
                onPageChange={setCurrentPage}
              />
              </>
            ) : (
              <div className="p-6 text-center">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلبات حالية</h3>
                <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة طلب جديد للمخبر</p>
              </div>
            )}
          </div>
        ) : (
          // جدول السجل
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                سجل الطلبات المستلمة ({filteredHistoryRequests.length})
              </h3>
            </div>

            {/* أدوات التصفية والبحث للسجل */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* البحث */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البحث
                  </label>
                  <input
                    type="text"
                    placeholder="ابحث في السجل..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* المخبر */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المخبر
                  </label>
                  <select
                    value={historySelectedLab}
                    onChange={(e) => setHistorySelectedLab(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">جميع المخابر</option>
                    {activeLabs.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* نوع العمل */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع العمل
                  </label>
                  <select
                    value={historySelectedWorkType}
                    onChange={(e) => setHistorySelectedWorkType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">جميع أنواع الأعمال</option>
                    {activeWorkTypes.map((workType) => (
                      <option key={workType.id} value={workType.id}>
                        {workType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* إعادة تعيين */}
                <div className="flex items-end">
                  {(historySearchQuery || historySelectedLab || historySelectedWorkType) && (
                    <button
                      onClick={() => {
                        setHistorySearchQuery('');
                        setHistorySelectedLab('');
                        setHistorySelectedWorkType('');
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      إعادة تعيين الفلاتر
                    </button>
                  )}
                </div>
              </div>

              {/* عداد النتائج */}
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <span>
                  عرض {paginatedHistoryRequests.length} من أصل {filteredHistoryRequests.length} طلب مستلم
                </span>
              </div>
            </div>

            {filteredHistoryRequests.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-l from-primary-600 to-primary-500">
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        المريض
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        المخبر
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        نوع العمل
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        أرقام الأسنان
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        العدد
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        اللون
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                        تاريخ الاستلام
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedHistoryRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                          {request.patientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.labName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.workTypeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.teethNumbers.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.color}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {request.receivedDate ? new Date(request.receivedDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination للسجل */}
              <Pagination
                currentPage={historyCurrentPage}
                totalPages={totalHistoryPages}
                onPageChange={setHistoryCurrentPage}
              />
              </>
            ) : (
              <div className="p-6 text-center">
                <EyeSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طلبات مستلمة</h3>
                <p className="mt-1 text-sm text-gray-500">سيظهر هنا سجل الطلبات المستلمة</p>
              </div>
            )}
          </div>
        ) : (
          /* تبويب حسابات المخابر */
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5" />
              حسابات المخابر
            </h3>
            <div className="space-y-6">
              {activeLabs.map(lab => {
                const orders = getRequestsByLab(lab.id);
                const payments = getPaymentsByLabId(lab.id);
                const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <div key={lab.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{lab.name}</p>
                        {lab.contactNumber && <p className="text-sm text-gray-600">{lab.contactNumber}</p>}
                        <p className="text-sm text-gray-500 mt-1">الطلبات: {orders.length} — إجمالي المدفوع: {totalPaid}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLabPaymentModal({ lab, amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' })}
                        className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                      >
                        إضافة دفعة
                      </button>
                    </div>
                    {payments.length > 0 && (
                      <ul className="mt-3 text-sm text-gray-600 space-y-1">
                        {payments.slice(0, 5).map(p => (
                          <li key={p.id}>{p.date}: {p.amount} {p.note ? `- ${p.note}` : ''}</li>
                        ))}
                        {payments.length > 5 && <li>... و {payments.length - 5} أخرى</li>}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            {activeLabs.length === 0 && (
              <p className="text-gray-500 text-sm">لا يوجد مخابر. أضف مخابر من «إدارة الفئات» أولاً.</p>
            )}
          </div>
        )}
      </div>

      {/* مودال إضافة دفعة لمخبر */}
      {labPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة دفعة: {labPaymentModal.lab.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={labPaymentModal.amount}
                  onChange={e => setLabPaymentModal(prev => prev ? { ...prev, amount: e.target.value } : null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={labPaymentModal.date}
                  onChange={e => setLabPaymentModal(prev => prev ? { ...prev, date: e.target.value } : null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                <input
                  type="text"
                  value={labPaymentModal.note}
                  onChange={e => setLabPaymentModal(prev => prev ? { ...prev, note: e.target.value } : null)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="اختياري"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setLabPaymentModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!labPaymentModal || !labPaymentModal.amount || Number(labPaymentModal.amount) <= 0) {
                    notify.error('أدخل المبلغ صحيحاً');
                    return;
                  }
                  addLabPayment({
                    labId: labPaymentModal.lab.id,
                    labName: labPaymentModal.lab.name,
                    amount: Number(labPaymentModal.amount),
                    date: labPaymentModal.date,
                    note: labPaymentModal.note.trim() || undefined
                  });
                  notify.success('تم تسجيل الدفعة');
                  setLabPaymentModal(null);
                }}
                disabled={!labPaymentModal.amount || Number(labPaymentModal.amount) <= 0}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الحذف */}
      <ConfirmationModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${deletingCategory?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isLoading}
      />

      {/* مودال إضافة/تعديل طلب المخبر */}
      <AddLabRequestModal
        isOpen={showAddRequestModal}
        onClose={handleCloseRequestModal}
        editingRequest={editingRequest}
      />
    </div>
  );
};

export default LabRequests;
