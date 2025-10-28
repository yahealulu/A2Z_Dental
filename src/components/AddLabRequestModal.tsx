import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useLabRequestStore, type LabRequest } from '../store/labRequestStore';
import { usePatientStore } from '../store/patientStore';
import { notify } from '../store/notificationStore';

interface AddLabRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRequest?: LabRequest | null;
}

const AddLabRequestModal = ({ isOpen, onClose, editingRequest }: AddLabRequestModalProps) => {
  // المراجع
  const patientInputRef = useRef<HTMLInputElement>(null);

  // الحالات
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // بيانات النموذج
  const [formData, setFormData] = useState({
    patientId: 0,
    patientName: '',
    labId: '',
    workTypeId: '',
    teethNumbers: '',
    quantity: '',
    color: '',
    deliveryDate: format(new Date(), 'yyyy-MM-dd'),
    expectedReturnDate: '',
    notes: ''
  });

  // المتاجر
  const { 
    addLabRequest, 
    updateLabRequest, 
    getActiveLabs, 
    getActiveWorkTypes 
  } = useLabRequestStore();
  
  const { searchPatients } = usePatientStore();

  // الحصول على البيانات
  const activeLabs = getActiveLabs();
  const activeWorkTypes = getActiveWorkTypes();
  const patientSuggestions = searchPatients(patientSearchQuery);

  // تهيئة النموذج عند التعديل
  useEffect(() => {
    if (editingRequest) {
      setFormData({
        patientId: editingRequest.patientId,
        patientName: editingRequest.patientName,
        labId: editingRequest.labId.toString(),
        workTypeId: editingRequest.workTypeId.toString(),
        teethNumbers: editingRequest.teethNumbers.join(', '),
        quantity: editingRequest.quantity.toString(),
        color: editingRequest.color,
        deliveryDate: editingRequest.deliveryDate,
        expectedReturnDate: editingRequest.expectedReturnDate,
        notes: editingRequest.notes || ''
      });
      setPatientSearchQuery(editingRequest.patientName);
    } else {
      // إعادة تعيين النموذج للإضافة الجديدة
      setFormData({
        patientId: 0,
        patientName: '',
        labId: '',
        workTypeId: '',
        teethNumbers: '',
        quantity: '',
        color: '',
        deliveryDate: format(new Date(), 'yyyy-MM-dd'),
        expectedReturnDate: '',
        notes: ''
      });
      setPatientSearchQuery('');
    }
  }, [editingRequest, isOpen]);

  // معالجة تغيير البيانات
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'teethNumbers') {
      // تنسيق أرقام الأسنان مع فواصل
      const formattedValue = value
        .replace(/[^\d,\s]/g, '') // السماح بالأرقام والفواصل والمسافات فقط
        .replace(/\s+/g, '') // إزالة المسافات
        .replace(/,+/g, ',') // إزالة الفواصل المتكررة
        .replace(/^,|,$/g, '') // إزالة الفواصل من البداية والنهاية
        .split(',')
        .filter(num => num.trim() !== '')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num) && num > 0 && num <= 85)
        .join(', ');
      
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'quantity') {
      // السماح بالأرقام الموجبة فقط
      const numValue = value.replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // معالجة البحث عن المريض
  const handlePatientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientSearchQuery(value);
    setFormData(prev => ({ ...prev, patientName: value, patientId: 0 }));
    setShowPatientSuggestions(value.length > 0);
  };

  // اختيار مريض من الاقتراحات
  const selectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: patient.name
    }));
    setPatientSearchQuery(patient.name);
    setShowPatientSuggestions(false);
  };

  // التحقق من صحة النموذج
  const isFormValid = () => {
    return (
      formData.patientName.trim() !== '' &&
      formData.labId !== '' &&
      formData.workTypeId !== '' &&
      formData.quantity !== '' &&
      parseInt(formData.quantity) > 0 &&
      formData.deliveryDate !== '' &&
      formData.expectedReturnDate !== '' &&
      new Date(formData.expectedReturnDate) > new Date(formData.deliveryDate)
    );
  };

  // معالجة الإرسال
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      // تحضير البيانات
      const lab = activeLabs.find(l => l.id === parseInt(formData.labId));
      const workType = activeWorkTypes.find(w => w.id === parseInt(formData.workTypeId));
      
      if (!lab || !workType) {
        throw new Error('بيانات المخبر أو نوع العمل غير صحيحة');
      }

      // تحويل أرقام الأسنان إلى مصفوفة
      const teethNumbers = formData.teethNumbers
        ? formData.teethNumbers.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
        : [];

      const requestData = {
        patientId: formData.patientId || 0,
        patientName: formData.patientName.trim(),
        labId: parseInt(formData.labId),
        labName: lab.name,
        workTypeId: parseInt(formData.workTypeId),
        workTypeName: workType.name,
        teethNumbers,
        quantity: parseInt(formData.quantity),
        color: formData.color.trim(),
        deliveryDate: formData.deliveryDate,
        expectedReturnDate: formData.expectedReturnDate,
        status: 'pending' as const,
        notes: formData.notes.trim()
      };

      if (editingRequest) {
        await updateLabRequest(editingRequest.id, requestData);
        notify.success('تم تعديل الطلب بنجاح');
      } else {
        await addLabRequest(requestData);
        notify.success('تم إضافة الطلب بنجاح');
      }

      // إغلاق النافذة مع انيميشن
      setIsModalAnimating(true);
      setTimeout(() => {
        handleClose();
        setIsModalAnimating(false);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error('خطأ في حفظ الطلب:', error);
      notify.error('حدث خطأ في حفظ الطلب', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
      setIsLoading(false);
    }
  };

  // إغلاق النافذة
  const handleClose = () => {
    onClose();
    setFormData({
      patientId: 0,
      patientName: '',
      labId: '',
      workTypeId: '',
      teethNumbers: '',
      quantity: '',
      color: '',
      deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      expectedReturnDate: '',
      notes: ''
    });
    setPatientSearchQuery('');
    setShowPatientSuggestions(false);
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

  // التركيز على حقل المريض عند فتح المودال
  useEffect(() => {
    if (showModal && patientInputRef.current) {
      setTimeout(() => {
        patientInputRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  if (!showModal) return null;

  return (
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 opacity-100"
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRequest ? 'تعديل طلب المخبر' : 'إضافة طلب جديد للمخبر'}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {editingRequest ? 'تعديل بيانات الطلب' : 'إضافة طلب جديد للمخبر'}
              </p>
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
            {/* الصف الأول: اسم المريض + المخبر */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المريض <span className="text-red-500">*</span>
                </label>
                <input
                  ref={patientInputRef}
                  type="text"
                  id="patientName"
                  name="patientName"
                  value={patientSearchQuery}
                  onChange={handlePatientSearch}
                  onFocus={() => setShowPatientSuggestions(patientSearchQuery.length > 0)}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                  autoComplete="off"
                />
                
                {/* اقتراحات المرضى */}
                {showPatientSuggestions && patientSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {patientSuggestions.slice(0, 5).map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-3 py-2 text-right hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="labId" className="block text-sm font-semibold text-gray-700 mb-2">
                  المخبر <span className="text-red-500">*</span>
                </label>
                <select
                  id="labId"
                  name="labId"
                  value={formData.labId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                >
                  <option value="">-- اختر المخبر --</option>
                  {activeLabs.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* الصف الثاني: نوع العمل + أرقام الأسنان */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="workTypeId" className="block text-sm font-semibold text-gray-700 mb-2">
                  نوع العمل <span className="text-red-500">*</span>
                </label>
                <select
                  id="workTypeId"
                  name="workTypeId"
                  value={formData.workTypeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                >
                  <option value="">-- اختر نوع العمل --</option>
                  {activeWorkTypes.map((workType) => (
                    <option key={workType.id} value={workType.id}>
                      {workType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="teethNumbers" className="block text-sm font-semibold text-gray-700 mb-2">
                  أرقام الأسنان
                </label>
                <input
                  type="text"
                  id="teethNumbers"
                  name="teethNumbers"
                  value={formData.teethNumbers}
                  onChange={handleInputChange}
                  placeholder="مثال: 11, 12, 21"
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل أرقام الأسنان مفصولة بفواصل
                </p>
              </div>
            </div>

            {/* الصف الثالث: عدد القطع + اللون */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                  عدد القطع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-semibold text-gray-700 mb-2">
                  اللون
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  placeholder="اختياري"
                />
              </div>
            </div>

            {/* الصف الرابع: تاريخ التسليم + تاريخ الاستلام المتوقع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  تاريخ التسليم للمخبر <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="expectedReturnDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  تاريخ الاستلام المتوقع <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="expectedReturnDate"
                  name="expectedReturnDate"
                  value={formData.expectedReturnDate}
                  onChange={handleInputChange}
                  min={formData.deliveryDate}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                  required
                />
              </div>
            </div>

            {/* الصف الخامس: الملاحظات */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                ملاحظات
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white resize-none"
                placeholder="ملاحظات إضافية (اختياري)"
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
              {isLoading
                ? (editingRequest ? 'جاري التعديل...' : 'جاري الإضافة...')
                : (editingRequest ? 'حفظ التعديل' : 'إضافة الطلب')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLabRequestModal;
