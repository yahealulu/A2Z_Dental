import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useTreatmentStore } from '../store/treatmentStore';
import { usePatientStore, type Patient } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';
import { notify } from '../store/notificationStore';
import { ISOTeeth } from '../data/types';
import ToothNumberHelper from './ToothNumberHelper';

interface AddNewTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddNewTreatmentModal = ({ isOpen, onClose }: AddNewTreatmentModalProps) => {
  const {
    addTreatment,
    treatmentTemplates,
    getActiveTreatmentTemplates,
    initializeDefaultTemplates
  } = useTreatmentStore();
  
  const { searchPatients, getActivePatients } = usePatientStore();
  const { getActiveDoctors } = useDoctorStore();

  // حالة البحث عن المرضى
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // الحصول على البيانات
  const activeTemplates = getActiveTreatmentTemplates();
  const activeDoctors = getActiveDoctors();

  // حالة بيانات العلاج
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [treatmentData, setTreatmentData] = useState({
    name: '',
    cost: '' as string | number,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    teethNumbers: '',
    doctorId: activeDoctors.length > 0 ? activeDoctors[0].id : '' as string | number,
    firstSessionNotes: 'تم البدء اليوم'
  });

  // حالات التحكم
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // البحث عن المرضى
  const searchResults = patientSearchQuery.trim() 
    ? searchPatients(patientSearchQuery)
    : getActivePatients().slice(0, 10); // أول 10 مرضى فقط

  // تهيئة القوالب عند فتح المودال
  useEffect(() => {
    if (isOpen && activeTemplates.length === 0) {
      initializeDefaultTemplates();
    }
  }, [isOpen, activeTemplates.length, initializeDefaultTemplates]);

  // التعامل مع اختيار القالب
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value);
    setSelectedTemplateId(templateId);

    if (templateId) {
      const template = activeTemplates.find(t => t.id === templateId);
      if (template) {
        setTreatmentData(prev => ({
          ...prev,
          name: template.name,
          cost: template.defaultCost
        }));
      }
    } else {
      setTreatmentData(prev => ({
        ...prev,
        name: '',
        cost: ''
      }));
    }
  };

  // التعامل مع تغيير البيانات
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTreatmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // التعامل مع إدخال رقم السن
  const handleTeethNumbersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // السماح بالأرقام فقط
    const filteredValue = value.replace(/[^0-9]/g, '');

    // تحديد الطول بحد أقصى رقمين
    const limitedValue = filteredValue.slice(0, 2);

    // حفظ القيمة المفلترة
    setTreatmentData(prev => ({
      ...prev,
      teethNumbers: limitedValue
    }));
  };

  // التعامل مع اختيار رقم السن من المساعد
  const handleToothSelect = (toothNumber: number) => {
    setTreatmentData(prev => ({
      ...prev,
      teethNumbers: toothNumber.toString()
    }));
  };

  // التعامل مع اختيار المريض
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearchQuery(patient.name);
    setShowPatientDropdown(false);
  };

  // التعامل مع البحث عن المرضى
  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setPatientSearchQuery(query);

    // إظهار القائمة فقط عند وجود نص للبحث
    setShowPatientDropdown(query.trim().length > 0);

    // إذا تم مسح النص، إلغاء اختيار المريض
    if (!query.trim()) {
      setSelectedPatient(null);
    }
  };

  // التحقق من صحة البيانات
  const isFormValid = () => {
    return selectedPatient && 
           treatmentData.name.trim() && 
           treatmentData.cost && 
           (typeof treatmentData.cost === 'string' ? parseFloat(treatmentData.cost) > 0 : treatmentData.cost > 0);
  };

  // إرسال النموذج
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);

    try {
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

      const cost = typeof treatmentData.cost === 'string' 
        ? parseFloat(treatmentData.cost) 
        : treatmentData.cost;

      const doctorId = treatmentData.doctorId 
        ? (typeof treatmentData.doctorId === 'string' ? parseInt(treatmentData.doctorId) : treatmentData.doctorId)
        : undefined;

      // إضافة العلاج
      await addTreatment({
        patientId: selectedPatient!.id,
        name: treatmentData.name,
        cost,
        startDate: treatmentData.startDate,
        status: 'planned',
        teethNumbers: teethNumbers.length > 0 ? teethNumbers : undefined,
        doctorId
      }, treatmentData.firstSessionNotes);

      // إشعار النجاح
      notify.success('تم إضافة العلاج بنجاح');

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
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setSelectedTemplateId('');
    setShowPatientDropdown(false);
    setTreatmentData({
      name: '',
      cost: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      teethNumbers: '',
      doctorId: activeDoctors.length > 0 ? activeDoctors[0].id : '',
      firstSessionNotes: 'تم البدء اليوم'
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
      onClick={handleCloseModal}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                إضافة علاج جديد
              </h3>
              {selectedPatient && (
                <p className="text-gray-500 text-sm mt-1">للمريض: {selectedPatient.name}</p>
              )}
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
            {/* الصف الأول: اختيار المريض + الطبيب */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
                  اختيار المريض <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="patient"
                    value={patientSearchQuery}
                    onChange={handlePatientSearch}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3 pr-10"
                    placeholder="ابحث عن المريض..."
                    required
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                
                {/* قائمة المرضى */}
                {showPatientDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className="w-full text-right px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900">{patient.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
                  الطبيب
                </label>
                <select
                  id="doctor"
                  name="doctorId"
                  value={treatmentData.doctorId}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                >
                  {activeDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* الصف الثاني: اختيار العلاج + التكلفة */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                  اختيار العلاج <span className="text-red-500">*</span>
                </label>
                <select
                  id="template"
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
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
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  التكلفة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cost"
                  name="cost"
                  value={treatmentData.cost}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                  required
                />
              </div>
            </div>

            {/* الصف الثالث: تاريخ البداية + أرقام الأسنان */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ بداية العلاج <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={treatmentData.startDate}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                  required
                />
              </div>

              <div>
                <label htmlFor="teethNumbers" className="block text-sm font-medium text-gray-700 mb-1">
                  رقم السن (اختياري)
                </label>
                <input
                  type="text"
                  id="teethNumbers"
                  name="teethNumbers"
                  value={treatmentData.teethNumbers}
                  onChange={handleTeethNumbersChange}
                  className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
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

            {/* ملاحظات الجلسة الأولى */}
            <div>
              <label htmlFor="firstSessionNotes" className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات الجلسة الأولى
              </label>
              <textarea
                id="firstSessionNotes"
                name="firstSessionNotes"
                value={treatmentData.firstSessionNotes}
                onChange={handleInputChange}
                rows={3}
                className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 resize-none"
                placeholder="ملاحظات حول الجلسة الأولى..."
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
                !isFormValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              style={
                !isFormValid()
                  ? {}
                  : { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
              }
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة العلاج'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewTreatmentModal;
