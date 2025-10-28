import { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import Table from '../components/Table';
import { useTreatmentStore, type Treatment, type TreatmentTemplate } from '../store/treatmentStore';
import { usePatientStore } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';
import { notify } from '../store/notificationStore';
import ConfirmationModal from '../components/ConfirmationModal';
import AddNewTreatmentModal from '../components/AddNewTreatmentModal';
import AddSessionModal from '../components/AddSessionModal';
import CompleteTreatmentModal from '../components/CompleteTreatmentModal';
import TreatmentDetailsModal from '../components/TreatmentDetailsModal';

const Treatments = () => {
  // حالات المودالات
  const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isTreatmentDetailsModalOpen, setIsTreatmentDetailsModalOpen] = useState(false);
  const [isCompleteTreatmentModalOpen, setIsCompleteTreatmentModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTemplateModalAnimating, setIsTemplateModalAnimating] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // حالات التحكم
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<TreatmentTemplate | null>(null);
  const [isTemplatesVisible, setIsTemplatesVisible] = useState(false);

  // حالة البحث
  const [searchQuery, setSearchQuery] = useState('');
  
  // حالات مودال التأكيد
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning' as 'danger' | 'warning' | 'info'
  });

  // حالات نموذج القالب
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    defaultCost: '',
    description: '',
    category: ''
  });

  // استخدام المخازن
  const {
    treatments,
    treatmentTemplates,
    getInProgressTreatments,
    getActiveTreatmentTemplates,
    addTreatmentTemplate,
    updateTreatmentTemplate,
    deleteTreatmentTemplate,
    completeTreatment,
    initializeDefaultTemplates
  } = useTreatmentStore();
  
  const { getPatientById } = usePatientStore();
  const { getDoctorById } = useDoctorStore();

  // الحصول على البيانات
  const allInProgressTreatments = getInProgressTreatments();
  const activeTreatmentTemplates = getActiveTreatmentTemplates();

  // تصفية العلاجات الجارية حسب البحث
  const inProgressTreatments = useMemo(() => {
    if (!searchQuery.trim()) {
      return allInProgressTreatments;
    }

    const query = searchQuery.toLowerCase().trim();
    return allInProgressTreatments.filter(treatment => {
      const patient = getPatientById(treatment.patientId);
      return patient?.name.toLowerCase().includes(query);
    });
  }, [allInProgressTreatments, searchQuery, getPatientById]);

  // تهيئة القوالب الافتراضية عند تحميل الصفحة
  useEffect(() => {
    if (treatmentTemplates.length === 0) {
      initializeDefaultTemplates();
    }
  }, [treatmentTemplates.length, initializeDefaultTemplates]);

  // إدارة عرض مودال القالب مع التأخير والانيميشن
  useEffect(() => {
    if (isTemplateModalOpen) {
      setIsTemplateModalAnimating(true);
      setTimeout(() => {
        setShowTemplateModal(true);
        setTimeout(() => setIsTemplateModalAnimating(false), 50);
      }, 300);
    } else {
      setShowTemplateModal(false);
    }
  }, [isTemplateModalOpen]);

  // دوال التعامل مع نموذج القالب
  const handleTemplateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTemplateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      defaultCost: '',
      description: '',
      category: ''
    });
    setCurrentTemplate(null);
  };

  const handleTemplateSubmit = async () => {
    if (!templateFormData.name.trim() || !templateFormData.defaultCost.trim()) {
      notify.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const cost = parseFloat(templateFormData.defaultCost);
    if (isNaN(cost) || cost <= 0) {
      notify.error('يرجى إدخال تكلفة صحيحة');
      return;
    }

    setIsLoading(true);

    try {
      if (currentTemplate) {
        // تحديث القالب
        await updateTreatmentTemplate(currentTemplate.id, {
          name: templateFormData.name.trim(),
          defaultCost: cost,
          description: '',
          category: 'عام'
        });
        notify.success('تم تحديث قالب العلاج بنجاح');
      } else {
        // إضافة قالب جديد
        await addTreatmentTemplate({
          name: templateFormData.name.trim(),
          defaultCost: cost,
          description: '',
          category: 'عام',
          isActive: true
        });
        notify.success('تم إضافة قالب العلاج بنجاح');
      }

      handleCloseTemplateModal();
    } catch (error) {
      console.error('خطأ في حفظ قالب العلاج:', error);
      notify.error('حدث خطأ في حفظ قالب العلاج');
    } finally {
      setIsLoading(false);
    }
  };

  // دوال التحكم في مودال القالب
  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
  };

  const handleCloseTemplateModal = () => {
    setIsTemplateModalAnimating(true);
    setTimeout(() => {
      setIsTemplateModalOpen(false);
      setIsTemplateModalAnimating(false);
      resetTemplateForm();
    }, 300);
  };

  const handleEditTemplate = (template: TreatmentTemplate) => {
    setCurrentTemplate(template);
    setTemplateFormData({
      name: template.name,
      defaultCost: template.defaultCost.toString(),
      description: template.description || '',
      category: template.category
    });
    handleOpenTemplateModal();
  };

  // دوال التعامل مع العلاجات
  const handleViewTreatmentDetails = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsTreatmentDetailsModalOpen(true);
  };

  const handleAddSession = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsAddSessionModalOpen(true);
  };

  const handleCompleteTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setIsCompleteTreatmentModalOpen(true);
  };

  const handleConfirmCompleteTreatment = async (finalNotes: string, newCost?: number) => {
    if (!selectedTreatment) return;

    try {
      setIsLoading(true);
      await completeTreatment(selectedTreatment.id, finalNotes, newCost);

      // رسالة نجاح مختلفة حسب ما إذا تم تعديل التكلفة أم لا
      if (newCost !== undefined && newCost !== selectedTreatment.cost) {
        notify.success(`تم إكمال العلاج وتحديث التكلفة إلى ${newCost.toLocaleString()} أ.ل.س`);
      } else {
        notify.success('تم إكمال العلاج بنجاح');
      }

      setIsCompleteTreatmentModalOpen(false);
      setIsTreatmentDetailsModalOpen(false);
      setSelectedTreatment(null);
    } catch (error) {
      console.error('خطأ في إكمال العلاج:', error);
      notify.error('حدث خطأ في إكمال العلاج');
    } finally {
      setIsLoading(false);
    }
  };



  const handleDeleteTemplate = (template: TreatmentTemplate) => {
    setConfirmModalConfig({
      title: 'حذف قالب العلاج',
      message: `هل أنت متأكد من حذف قالب العلاج "${template.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteTreatmentTemplate(template.id);
          notify.success('تم حذف قالب العلاج بنجاح');
          setIsConfirmModalOpen(false);
        } catch (error) {
          console.error('خطأ في حذف قالب العلاج:', error);
          notify.error('حدث خطأ في حذف قالب العلاج');
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled_incomplete':
      case 'cancelled_no_sessions':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // تحديد نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'جاري';
      case 'completed':
        return 'مكتمل';
      case 'cancelled_incomplete':
        return 'ملغي (جلسات مكتملة)';
      case 'cancelled_no_sessions':
        return 'ملغي (بدون جلسات)';
      default:
        return status;
    }
  };

  // إعداد أعمدة جدول العلاجات الجارية
  const treatmentColumns = [
    {
      header: 'اسم المريض',
      accessor: (treatment: Treatment) => {
        const patient = getPatientById(treatment.patientId);
        return patient ? patient.name : 'غير محدد';
      },
      className: 'font-medium text-gray-900'
    },
    {
      header: 'اسم العلاج',
      accessor: (treatment: Treatment) => treatment.name,
      className: 'text-gray-900'
    },
    {
      header: 'عدد الجلسات',
      accessor: (treatment: Treatment) => treatment.sessions.length.toString(),
      className: 'text-center text-gray-900'
    },
    {
      header: 'تاريخ البداية',
      accessor: (treatment: Treatment) => format(new Date(treatment.startDate), 'dd/MM/yyyy', { locale: ar }),
      className: 'text-gray-900'
    },
    {
      header: 'الإجراءات',
      accessor: (treatment: Treatment) => (
        <div className="flex justify-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewTreatmentDetails(treatment);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="عرض التفاصيل"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {treatment.status === 'in_progress' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddSession(treatment);
                }}
                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                title="إضافة جلسة"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCompleteTreatment(treatment);
                }}
                className="text-emerald-600 hover:text-emerald-900 p-1 rounded hover:bg-emerald-50"
                title="إكمال العلاج"
              >
                <CheckCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
      className: 'text-center'
    }
  ];

  // إعداد أعمدة جدول قوالب العلاجات
  const templateColumns = [
    {
      header: 'اسم العلاج',
      accessor: (template: TreatmentTemplate) => template.name,
      className: 'font-medium text-gray-900'
    },
    {
      header: 'التكلفة الافتراضية',
      accessor: (template: TreatmentTemplate) => `${template.defaultCost.toLocaleString()} أ.ل.س`,
      className: 'text-gray-900 font-semibold'
    },
    {
      header: 'الإجراءات',
      accessor: (template: TreatmentTemplate) => (
        <div className="flex justify-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditTemplate(template);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="تحرير"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTemplate(template);
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="حذف"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'text-center'
    }
  ];

  return (
    <div className="space-y-8">
      {/* القسم الأول: زر إضافة علاج جديد */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">إدارة العلاجات</h2>
            <p className="text-gray-600">إضافة وإدارة العلاجات للمرضى</p>
          </div>
          <button
            onClick={() => setIsAddTreatmentModalOpen(true)}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة علاج جديد
          </button>
        </div>
      </div>

      {/* القسم الثاني: جدول العلاجات الجارية */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">العلاجات الجارية</h3>
              <p className="text-sm text-gray-600 mt-1">
                {searchQuery ?
                  `${inProgressTreatments.length} من ${allInProgressTreatments.length} علاج جاري` :
                  `${inProgressTreatments.length} علاج جاري حالياً`
                }
              </p>
            </div>

            {/* خانة البحث */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="البحث عن مريض..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-64 pr-10 pl-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {inProgressTreatments.length > 0 ? (
            <Table
              data={inProgressTreatments}
              columns={treatmentColumns}
              keyExtractor={(treatment) => treatment.id}
              emptyMessage="لا توجد علاجات جارية حالياً"
            />
          ) : (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              {searchQuery ? (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد نتائج للبحث</h3>
                  <p className="mt-1 text-sm text-gray-500">لم يتم العثور على علاجات جارية للمريض "{searchQuery}"</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                      <XMarkIcon className="h-4 w-4 ml-2" />
                      مسح البحث
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد علاجات جارية</h3>
                  <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة علاج جديد للمرضى</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsAddTreatmentModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                      }}
                    >
                      <PlusIcon className="h-4 w-4 ml-2" />
                      إضافة علاج جديد
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* القسم الثالث: قوالب العلاجات */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">قوالب العلاجات</h3>
              <p className="text-sm text-gray-600 mt-1">
                إدارة قوالب العلاجات المحفوظة ({activeTreatmentTemplates.length} قالب)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTemplatesVisible(!isTemplatesVisible)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }}
              >
                {isTemplatesVisible ? 'إخفاء القوالب' : 'عرض القوالب'}
              </button>
              {isTemplatesVisible && (
                <button
                  onClick={handleOpenTemplateModal}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }}
                >
                  <PlusIcon className="h-4 w-4 ml-2" />
                  إضافة قالب جديد
                </button>
              )}
            </div>
          </div>
        </div>

        {isTemplatesVisible && (
          <div className="p-6">
            {activeTreatmentTemplates.length > 0 ? (
              <Table
                data={activeTreatmentTemplates}
                columns={templateColumns}
                keyExtractor={(template) => template.id.toString()}
                emptyMessage="لا توجد قوالب علاجات"
              />
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد قوالب علاجات</h3>
                <p className="mt-1 text-sm text-gray-500">أضف قوالب علاجات لتسهيل إضافة العلاجات المتكررة</p>
                <div className="mt-6">
                  <button
                    onClick={handleOpenTemplateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all duration-200 shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }}
                  >
                    <PlusIcon className="h-4 w-4 ml-2" />
                    إضافة قالب جديد
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* المودالات */}
      {/* مودال إضافة علاج جديد */}
      <AddNewTreatmentModal
        isOpen={isAddTreatmentModalOpen}
        onClose={() => setIsAddTreatmentModalOpen(false)}
      />

      {/* مودال إضافة جلسة */}
      {selectedTreatment && (
        <AddSessionModal
          isOpen={isAddSessionModalOpen}
          onClose={() => setIsAddSessionModalOpen(false)}
          treatment={selectedTreatment}
        />
      )}

      {/* مودال تفاصيل العلاج */}
      {selectedTreatment && (
        <TreatmentDetailsModal
          isOpen={isTreatmentDetailsModalOpen}
          onClose={() => setIsTreatmentDetailsModalOpen(false)}
          treatment={selectedTreatment}
        />
      )}

      {/* مودال قالب العلاج */}
      {showTemplateModal && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${
            isTemplateModalAnimating ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0
          }}
          onClick={handleCloseTemplateModal}
        >
          <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[95vh] overflow-y-auto transform transition-all duration-300 ${
            isTemplateModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    {currentTemplate ? 'تحرير قالب العلاج' : 'إضافة قالب علاج جديد'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseTemplateModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* النموذج بتصميم صفوف مع حقلين في كل صف */}
              <div className="space-y-4">
                {/* الصف الوحيد: اسم العلاج + التكلفة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="templateName" className="block text-sm font-semibold text-gray-700 mb-2">
                      اسم العلاج <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="templateName"
                      name="name"
                      value={templateFormData.name}
                      onChange={handleTemplateInputChange}
                      className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="مثال: حشو ضرس"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="templateCost" className="block text-sm font-semibold text-gray-700 mb-2">
                      التكلفة الافتراضية <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="templateCost"
                      name="defaultCost"
                      value={templateFormData.defaultCost}
                      onChange={handleTemplateInputChange}
                      className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* الأزرار */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleCloseTemplateModal}
                  disabled={isLoading}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleTemplateSubmit}
                  disabled={isLoading || !templateFormData.name.trim() || !templateFormData.defaultCost.trim()}
                  className={`px-6 py-3 text-sm font-medium text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLoading || !templateFormData.name.trim() || !templateFormData.defaultCost.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                  style={
                    isLoading || !templateFormData.name.trim() || !templateFormData.defaultCost.trim()
                      ? {}
                      : { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
                  }
                >
                  {isLoading ? 'جاري الحفظ...' : (currentTemplate ? 'تحديث القالب' : 'إضافة القالب')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال التأكيد */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        type={confirmModalConfig.type}
      />

      {/* مودال إكمال العلاج */}
      <CompleteTreatmentModal
        isOpen={isCompleteTreatmentModalOpen}
        onClose={() => {
          setIsCompleteTreatmentModalOpen(false);
          setSelectedTreatment(null);
        }}
        treatment={selectedTreatment}
        onConfirm={handleConfirmCompleteTreatment}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Treatments;
