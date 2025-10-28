import { useState } from 'react';
import {
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Table from '../components/Table';
import { useDoctorStore } from '../store/doctorStore';
import type { Doctor } from '../store/doctorStore';
import ConfirmationModal from '../components/ConfirmationModal';

const Doctors = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning' as 'danger' | 'warning' | 'info'
  });

  const [formData, setFormData] = useState({
    name: 'د. ',
    phone: '',
    specialization: '',
    email: '',
    workDays: [] as string[],
    workHours: { start: '09:00', end: '17:00' },
    experience: 0,
    isActive: true
  });

  // استخدام DoctorStore
  const {
    addDoctor,
    toggleDoctorStatus,
    getAllDoctors
  } = useDoctorStore();

  // عرض جميع الأطباء (نشط وغير نشط)
  const filteredDoctors = getAllDoctors();



  // وظائف إدارة الأطباء
  const handleAddDoctor = async () => {
    // التحقق من جميع الحقول الإجبارية
    if (!formData.name.trim() || !formData.phone.trim() || !formData.specialization.trim()) {
      return; // لا نفعل شيء إذا كانت الحقول فارغة
    }

    // التحقق من أن الاسم يبدأ بـ "د."
    if (!formData.name.trim().startsWith('د. ')) {
      setConfirmModalConfig({
        title: 'خطأ في الاسم',
        message: 'يجب أن يبدأ اسم الطبيب بـ "د."',
        onConfirm: () => setIsConfirmModalOpen(false),
        type: 'danger'
      });
      setIsConfirmModalOpen(true);
      return;
    }

    // التحقق من عدم تكرار الاسم
    const existingDoctor = getAllDoctors().find(doctor =>
      doctor.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );

    if (existingDoctor) {
      setConfirmModalConfig({
        title: 'اسم مكرر',
        message: `الطبيب "${formData.name.trim()}" موجود بالفعل. يرجى اختيار اسم آخر.`,
        onConfirm: () => setIsConfirmModalOpen(false),
        type: 'warning'
      });
      setIsConfirmModalOpen(true);
      return;
    }

    try {
      await addDoctor({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        email: '',
        workDays: [],
        workHours: { start: '09:00', end: '17:00' },
        experience: 0
      });

      // إغلاق النافذة المنبثقة
      setIsModalOpen(false);
      resetForm();

    } catch (error) {
      console.error('خطأ في إضافة الطبيب:', error);
      setConfirmModalConfig({
        title: 'خطأ في الإضافة',
        message: 'حدث خطأ في إضافة الطبيب. يرجى المحاولة مرة أخرى.',
        onConfirm: () => setIsConfirmModalOpen(false),
        type: 'danger'
      });
      setIsConfirmModalOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({
      name: 'د. ',
      phone: '',
      specialization: '',
      email: '',
      workDays: [],
      workHours: { start: '09:00', end: '17:00' },
      experience: 0,
      isActive: true
    });
  };

  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const action = doctor.isActive ? 'إيقاف' : 'تفعيل';
    const message = doctor.isActive
      ? `هل أنت متأكد من إيقاف الطبيب "${doctor.name}"؟ سيصبح غير متاح للاختيار في العلاجات الجديدة.`
      : `هل أنت متأكد من تفعيل الطبيب "${doctor.name}"؟ سيصبح متاحاً للاختيار في العلاجات الجديدة.`;

    setConfirmModalConfig({
      title: `${action} الطبيب`,
      message,
      onConfirm: async () => {
        try {
          await toggleDoctorStatus(doctor.id, doctor.isActive ? 'تم إيقافه من قبل الإدارة' : undefined);
          setIsConfirmModalOpen(false);
        } catch (error) {
          setConfirmModalConfig({
            title: 'خطأ في العملية',
            message: `حدث خطأ في ${action} الطبيب`,
            onConfirm: () => setIsConfirmModalOpen(false),
            type: 'danger'
          });
        }
      },
      type: 'warning'
    });
    setIsConfirmModalOpen(true);
  };

  // دوال التأخير والانيميشن
  const handleOpenModal = () => {
    openAddModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openAddModal = () => {
    setFormData({
      name: 'د. ',
      specialization: '',
      phone: '',
      email: '',
      workDays: [],
      workHours: { start: '09:00', end: '17:00' },
      experience: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      header: 'الاسم',
      accessor: 'name' as keyof Doctor,
      className: 'font-medium text-gray-900'
    },
    {
      header: 'التخصص',
      accessor: 'specialization' as keyof Doctor
    },
    {
      header: 'رقم الهاتف',
      accessor: 'phone' as keyof Doctor
    },
    {
      header: 'الحالة',
      accessor: (doctor: Doctor) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          doctor.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {doctor.isActive ? 'نشط' : 'غير نشط'}
        </span>
      )
    },
    {
      header: 'الإجراءات',
      accessor: (doctor: Doctor) => (
        <div className="flex justify-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleDoctorStatus(doctor);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              doctor.isActive
                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
            title={doctor.isActive ? 'إيقاف الطبيب' : 'تفعيل الطبيب'}
          >
            {doctor.isActive ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>
      )
    }
  ];



  // معالجة النموذج - إضافة فقط
  const handleSubmit = () => {
    handleAddDoctor();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // معالجة خاصة لحقل الاسم للتأكد من وجود "د." في البداية
      if (name === 'name') {
        let newValue = value;
        // إذا لم يبدأ النص بـ "د. " أو تم حذفه، أعده
        if (!newValue.startsWith('د. ')) {
          // إذا كان النص فارغ أو لا يحتوي على "د."، أضف "د. "
          if (newValue === '' || !newValue.includes('د.')) {
            newValue = 'د. ' + newValue.replace(/^د\.?\s*/, '');
          } else {
            // إذا كان يحتوي على "د." لكن ليس في البداية الصحيحة، أصلحه
            newValue = 'د. ' + newValue.replace(/^د\.?\s*/, '');
          }
        }
        setFormData(prev => ({ ...prev, [name]: newValue }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-center items-center mb-6">
        <button
          onClick={handleOpenModal}
          className="px-6 py-3 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
          }}

        >
          <PlusIcon className="h-5 w-5" />
          إضافة طبيب
        </button>
      </div>

      {/* Doctors Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <Table
          columns={columns}
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          emptyMessage="لا يوجد أطباء"
        />
      </div>

      {/* Add/Edit Doctor Modal */}
      {isModalOpen && (
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
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100 translate-y-0">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    إضافة طبيب جديد
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"

                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    placeholder="د. أدخل اسم الطبيب"
                    required
                    onFocus={(e) => {
                      // وضع المؤشر بعد "د. " عند التركيز
                      if (e.target.value === 'د. ') {
                        setTimeout(() => {
                          e.target.setSelectionRange(3, 3);
                        }, 0);
                      }
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="مثال: 0501234567"
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    التخصص <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="specialization"
                    name="specialization"
                    type="text"
                    value={formData.specialization}
                    onChange={handleFormChange}
                    placeholder="مثال: طب الأسنان العام"
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    required
                  />
                </div>


            </div>

              <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCloseModal}

                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white ${
                    (!formData.name.trim() || !formData.phone.trim() || !formData.specialization.trim())
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || !formData.phone.trim() || !formData.specialization.trim()}
                >
                  إضافة الطبيب
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
        isLoading={false}
      />
    </div>
  );
};

export default Doctors;
