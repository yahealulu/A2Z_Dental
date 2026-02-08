import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useTreatmentStore } from '../store/treatmentStore';
import { notify } from '../store/notificationStore';
import { ISOTeeth } from '../data/types';
import ToothNumberHelper from './ToothNumberHelper';

interface AddTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  /** عند true يُضاف العلاج كـ "مخطط" فقط (بدون فاتورة) من السجل السني */
  addAsPlanned?: boolean;
}

const AddTreatmentModal = ({ isOpen, onClose, patientId, patientName, addAsPlanned = false }: AddTreatmentModalProps) => {
  const {
    addTreatment,
    addPlannedTreatment,
    treatmentTemplates,
    getActiveTreatmentTemplates,
    initializeDefaultTemplates
  } = useTreatmentStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [treatmentData, setTreatmentData] = useState({
    name: '',
    cost: '' as string | number,
    treatmentDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'planned' as const,
    description: '',
    teethNumbers: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // تهيئة القوالب الافتراضية إذا لم تكن موجودة
  useEffect(() => {
    if (treatmentTemplates.length === 0) {
      initializeDefaultTemplates();
    }
  }, [treatmentTemplates.length, initializeDefaultTemplates]);

  // الحصول على القوالب النشطة
  const activeTemplates = getActiveTreatmentTemplates();

  // دالة مساعدة لتحويل الأرقام العربية إلى إنجليزية
  const convertArabicToEnglish = (value: string): string => {
    return value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  };

  // معالجة اختيار قالب العلاج
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value);
    setSelectedTemplateId(templateId || '');

    if (templateId) {
      const template = activeTemplates.find(t => t.id === templateId);
      if (template) {
        // تحويل التكلفة إلى أرقام إنجليزية
        const englishCost = convertArabicToEnglish(template.defaultCost.toString());

        setTreatmentData({
          ...treatmentData,
          name: template.name,
          cost: englishCost,
          description: template.description
        });
      }
    } else {
      setTreatmentData({
        ...treatmentData,
        name: '',
        cost: '',
        description: ''
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // تحويل الأرقام العربية إلى إنجليزية للتكلفة
    let processedValue = value;
    if (name === 'cost') {
      processedValue = convertArabicToEnglish(value);
    }

    setTreatmentData({
      ...treatmentData,
      [name]: processedValue
    });
  };

  // معالجة رقم السن
  const handleTeethNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // السماح بالأرقام فقط
    value = value.replace(/[^0-9]/g, '');

    // تحديد الطول بحد أقصى رقمين
    value = value.slice(0, 2);

    setTreatmentData({
      ...treatmentData,
      teethNumbers: value
    });
  };

  // التعامل مع اختيار رقم السن من المساعد
  const handleToothSelect = (toothNumber: number) => {
    setTreatmentData({
      ...treatmentData,
      teethNumbers: toothNumber.toString()
    });
  };

  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    if (!treatmentData.name) {
      return; // لا نفعل شيء إذا كان الحقل فارغ
    }

    const cost = typeof treatmentData.cost === 'string'
      ? parseFloat(treatmentData.cost)
      : treatmentData.cost;

    if (!cost || cost <= 0) {
      return; // لا نفعل شيء إذا كانت التكلفة غير صحيحة
    }

    setIsLoading(true);

    // تحويل رقم السن والتحقق من صحته
    let teethNumbers: number[] = [];
    if (treatmentData.teethNumbers.trim()) {
      const numStr = treatmentData.teethNumbers.trim();
      const num = parseInt(numStr);

      if (isNaN(num)) {
        notify.error(`رقم السن "${numStr}" غير صحيح`);
        setIsLoading(false);
        return;
      }

      if (numStr.length !== 2) {
        notify.error(`رقم السن يجب أن يكون مكون من رقمين`);
        setIsLoading(false);
        return;
      }

      // التحقق من أن الرقم موجود في قائمة الأسنان المعتمدة
      const validTeethNumbers = [...ISOTeeth.permanent, ...ISOTeeth.deciduous];
      if (!validTeethNumbers.includes(num)) {
        notify.error(`رقم السن ${num} غير صحيح. يرجى إدخال رقم سن صحيح`);
        setIsLoading(false);
        return;
      }

      teethNumbers.push(num);
    }

    try {
      if (addAsPlanned) {
        await addPlannedTreatment({
          patientId,
          name: treatmentData.name,
          description: treatmentData.description || '',
          cost,
          startDate: treatmentData.treatmentDate,
          teethNumbers: teethNumbers.length > 0 ? teethNumbers : undefined,
          doctorId: undefined,
          status: 'planned'
        });
        notify.success('تم إضافة العلاج المخطط');
      } else {
        await addTreatment({
          patientId,
          name: treatmentData.name,
          description: treatmentData.description || '',
          cost,
          startDate: treatmentData.treatmentDate,
          status: 'in_progress',
          teethNumbers: teethNumbers.length > 0 ? teethNumbers : [],
          doctorId: undefined
        } as any);
        notify.success('تم إضافة العلاج بنجاح');
      }

      // إغلاق النافذة مع انيميشن
      setIsModalAnimating(true);
      setTimeout(() => {
        handleClose();
        setIsModalAnimating(false);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error('خطأ في إضافة العلاج:', error);
      notify.error('حدث خطأ في إضافة العلاج');
      setIsLoading(false);
      return;
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedTemplateId('');
    setTreatmentData({
      name: '',
      cost: '',
      treatmentDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'planned',
      description: '',
      teethNumbers: '',
      notes: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      handleClose();
      setIsModalAnimating(false);
    }, 300);
  };

  // إضافة تأخير عند فتح المودال
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsModalAnimating(true);
      setTimeout(() => {
        setShowModal(true);
        setTimeout(() => setIsModalAnimating(false), 50);
      }, 300);
    } else {
      setShowModal(false);
    }
  }, [isOpen]);

  if (!showModal) return null;

  return (
    <div
      className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${
        isModalAnimating ? 'opacity-0' : 'opacity-100'
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
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[95vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                إضافة علاج جديد
              </h3>
              <p className="text-gray-500 text-sm mt-1">للمريض: {patientName}</p>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* النموذج بتصميم صفوف مع حقلين في كل صف */}
          <div className="space-y-4">
            {/* الصف الأول: اختيار العلاج + التكلفة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="template" className="block text-sm font-semibold text-gray-700 mb-2">
                  اختيار العلاج <span className="text-red-500">*</span>
                </label>
                <select
                  id="template"
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                >
                  <option value="">-- اختر العلاج --</option>
                  {activeTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.defaultCost} أ.ل.س ({template.category})
                    </option>
                  ))}
                </select>
                {activeTemplates.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    لا توجد قوالب علاجات متاحة
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="cost" className="block text-sm font-semibold text-gray-700 mb-2">
                  التكلفة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cost"
                  name="cost"
                  value={treatmentData.cost}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                />
              </div>
            </div>

            {/* الصف الثاني: تاريخ العلاج + أرقام الأسنان */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="treatmentDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  تاريخ العلاج <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="treatmentDate"
                  name="treatmentDate"
                  value={treatmentData.treatmentDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="teethNumbers" className="block text-sm font-semibold text-gray-700 mb-2">
                  رقم السن
                </label>
                <input
                  type="text"
                  id="teethNumbers"
                  name="teethNumbers"
                  value={treatmentData.teethNumbers || ''}
                  onChange={handleTeethNumbersChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  placeholder="مثال: 11"
                  maxLength={2}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    أدخل رقم السن (رقمين فقط) - مثال: 11, 21, 31, 41
                  </p>
                  <ToothNumberHelper onSelectTooth={handleToothSelect} />
                </div>
              </div>
            </div>

            {/* الصف الثالث: الملاحظات */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                الملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={treatmentData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white resize-none"
                placeholder="أضف أي ملاحظات حول العلاج..."
              />
            </div>
          </div>

          {/* الأزرار */}
          <div className="mt-8 flex justify-end space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={handleCloseModal}
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              type="button"
              className={`px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                !treatmentData.name || !treatmentData.cost || (typeof treatmentData.cost === 'string' ? parseFloat(treatmentData.cost) <= 0 : treatmentData.cost <= 0)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              style={
                !treatmentData.name || !treatmentData.cost || (typeof treatmentData.cost === 'string' ? parseFloat(treatmentData.cost) <= 0 : treatmentData.cost <= 0)
                  ? {}
                  : { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
              }
              onClick={handleSubmit}
              disabled={isLoading || !treatmentData.name || !treatmentData.cost || (typeof treatmentData.cost === 'string' ? parseFloat(treatmentData.cost) <= 0 : treatmentData.cost <= 0)}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة العلاج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTreatmentModal;