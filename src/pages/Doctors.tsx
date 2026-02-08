import { useState } from 'react';
import { format } from 'date-fns';
import { PlusIcon, XMarkIcon, BanknotesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Table from '../components/Table';
import { useDoctorStore } from '../store/doctorStore';
import type { Doctor } from '../store/doctorStore';
import { useDoctorPaymentStore } from '../store/doctorPaymentStore';
import { useTreatmentStore } from '../store/treatmentStore';
import ConfirmationModal from '../components/ConfirmationModal';
import { notify } from '../store/notificationStore';

const Doctors = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDoctor, setPaymentDoctor] = useState<Doctor | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning' as 'danger' | 'warning' | 'info'
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // استخدام DoctorStore
  const {
    addDoctor,
    toggleDoctorStatus,
    getAllDoctors
  } = useDoctorStore();
  const { addPayment: addDoctorPayment, getPaymentsByDoctorId } = useDoctorPaymentStore();
  const getTreatmentsByDoctor = useTreatmentStore(s => s.getTreatmentsByDoctor);

  // عرض جميع الأطباء (نشط وغير نشط)
  const filteredDoctors = getAllDoctors();

  const handleOpenPaymentModal = (doctor: Doctor) => {
    setPaymentDoctor(doctor);
    setPaymentForm({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' });
    setIsPaymentModalOpen(true);
  };

  const handleAddDoctorPayment = () => {
    if (!paymentDoctor || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
      notify.error('أدخل المبلغ صحيحاً');
      return;
    }
    addDoctorPayment({
      doctorId: paymentDoctor.id,
      doctorName: paymentDoctor.name,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      note: paymentForm.note.trim() || undefined
    });
    notify.success('تم تسجيل الدفعة');
    setIsPaymentModalOpen(false);
    setPaymentDoctor(null);
  };



  // وظائف إدارة الأطباء
  const handleAddDoctor = async () => {
    if (!formData.name.trim()) return;

    const existingDoctor = getAllDoctors().find(doctor =>
      doctor.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (existingDoctor) {
      setConfirmModalConfig({
        title: 'اسم مكرر',
        message: `الطبيب "${formData.name.trim()}" موجود بالفعل.`,
        onConfirm: () => setIsConfirmModalOpen(false),
        type: 'warning'
      });
      setIsConfirmModalOpen(true);
      return;
    }

    try {
      await addDoctor({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('خطأ في إضافة الطبيب:', error);
      setConfirmModalConfig({
        title: 'خطأ في الإضافة',
        message: (error as Error).message || 'حدث خطأ في إضافة الطبيب.',
        onConfirm: () => setIsConfirmModalOpen(false),
        type: 'danger'
      });
      setIsConfirmModalOpen(true);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '' });
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
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const columns = [
    {
      header: 'الاسم',
      accessor: 'name' as keyof Doctor,
      className: 'font-medium text-gray-900'
    },
    {
      header: 'رقم الهاتف',
      accessor: (d: Doctor) => d.phone ?? '—'
    },
    {
      header: 'البريد',
      accessor: (d: Doctor) => d.email ?? '—'
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      {/* Doctors' Accounts */}
      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BanknotesIcon className="h-6 w-6 text-primary-600" />
          حسابات الأطباء
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map(doctor => {
            const payments = getPaymentsByDoctorId(doctor.id);
            const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
            const treatmentsCount = getTreatmentsByDoctor(doctor.id).length;
            return (
              <div key={doctor.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900">{doctor.name}</p>
                <p className="text-sm text-gray-600 mt-1">إجمالي المدفوع: {totalPaid}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  عدد العلاجات: {treatmentsCount}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal(doctor)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                >
                  إضافة دفعة
                </button>
              </div>
            );
          })}
        </div>
        {filteredDoctors.length === 0 && (
          <p className="text-gray-500 text-sm">لا يوجد أطباء. أضف أطباء أولاً ثم ستظهر حساباتهم هنا.</p>
        )}
      </div>

      {/* Add Doctor Payment Modal */}
      {isPaymentModalOpen && paymentDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة دفعة للطبيب: {paymentDoctor.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={paymentForm.date}
                  onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                <input
                  type="text"
                  value={paymentForm.note}
                  onChange={e => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="اختياري"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setIsPaymentModalOpen(false); setPaymentDoctor(null); }}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleAddDoctorPayment}
                disabled={!paymentForm.amount || Number(paymentForm.amount) <= 0}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

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
                    placeholder="اسم الطبيب"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="اختياري"
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="اختياري"
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
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
                    !formData.name.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={handleSubmit}
                  disabled={!formData.name.trim()}
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
