import { useState, useMemo } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import PatientCard from '../components/PatientCard';
import Pagination from '../components/Pagination';
import { usePatientStore, type Patient } from '../store/patientStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { usePatientSearch } from '../hooks/usePatientSearch';
import { notify } from '../store/notificationStore';

const Patients = () => {
  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Patient data states
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    birthdate: '',
    gender: 'male',
    address: '',
    medicalHistory: ''
  });

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  // Pagination settings
  const patientsPerPage = 6;



  // Zustand stores
  const { patients: zustandPatients, addPatient, updatePatient, deletePatient } = usePatientStore();
  const { appointments, updateAppointment } = useAppointmentStore();



  // تحضير بيانات المرضى (بدون آخر زيارة لتحسين الأداء)
  const allPatients = useMemo(() => {
    return zustandPatients.map(p => ({
      ...p,
      birthdate: p.birthDate || ''
      // تم إزالة lastVisit لتحسين الأداء - ستظهر في صفحة المريض الفردية
    }));
  }, [zustandPatients]);

  // البحث المحسن
  const {
    searchQuery,
    setSearchQuery,
    filteredPatients
  } = usePatientSearch(allPatients);



  // Pagination للقائمة المفلترة
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);



  // Handlers
  const handleEditPatient = (id: string | number) => {
    const patient = allPatients.find(p => p.id === Number(id));
    if (patient) {
      setIsLoading(true);
      setTimeout(() => {
        setEditingPatient({
          ...patient,
          birthDate: patient.birthdate,
          medicalHistory: patient.medicalHistory || ''
        });
        setIsEditModalOpen(true);
        setIsLoading(false);
      }, 300);
    }
  };

  // Handle close edit modal with delay
  const handleCloseEditModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setEditingPatient(null);
      setIsModalAnimating(false);
    }, 300);
  };



  const handleDeletePatient = (id: string | number) => {
    const patient = allPatients.find(p => p.id === Number(id));
    if (patient) {
      setDeletingPatient(patient);
      setIsDeleteModalOpen(true);
    }
  };

  // Handle add patient with delay and animation
  const handleAddPatient = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsAddModalOpen(true);
      setIsModalAnimating(true);
      setIsLoading(false);
      // Start animation after modal is shown
      setTimeout(() => setIsModalAnimating(false), 50);
    }, 300); // 300ms delay
  };

  // Handle close modal with delay and animation
  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsModalAnimating(false);
    }, 300); // 300ms delay for animation
  };

  const handleSavePatient = async () => {
    // التحقق من إدخال الاسم (حقل إلزامي)
    if (!newPatient.name.trim()) {
      notify.error('يرجى إدخال اسم المريض');
      return;
    }

    setIsLoading(true);

    try {
      // إضافة المريض الجديد باستخدام Zustand
      const savedPatientId = await addPatient({
        name: newPatient.name,
        phone: newPatient.phone,
        birthDate: newPatient.birthdate,
        gender: newPatient.gender as 'male' | 'female',
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      });

      // تحديث أي مواعيد موجودة لهذا المريض الجديد
      const appointmentsToUpdate = appointments.filter(apt =>
        apt.isNewPatient &&
        apt.patientName === newPatient.name.trim()
      );

      // تحديث المواعيد لربطها بالمريض الجديد
      for (const appointment of appointmentsToUpdate) {
        await updateAppointment(appointment.id, {
          patientId: savedPatientId,
          isNewPatient: false
        });
      }

      // إغلاق النافذة المنبثقة مع انيميشن
      setIsModalAnimating(true);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setIsModalAnimating(false);
        setIsLoading(false);
      }, 300);

      // إعادة تعيين النموذج
      setNewPatient({
        name: '',
        phone: '',
        birthdate: '',
        gender: 'male',
        address: '',
        medicalHistory: ''
      });

      // عرض رسالة نجاح
      notify.success(`تم إضافة المريض "${newPatient.name}" بنجاح`);

      // إعادة تعيين الصفحة الحالية إلى الصفحة الأخيرة لعرض المريض الجديد
      const newTotalPages = Math.ceil((allPatients.length + 1) / patientsPerPage);
      setCurrentPage(newTotalPages);
    } catch (error) {
      notify.error(`حدث خطأ أثناء إضافة المريض: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  // Handle edit patient save
  const handleSaveEditPatient = async () => {
    if (!editingPatient?.name?.trim()) {
      notify.error('يرجى إدخال اسم المريض');
      return;
    }

    try {
      // تحديث المريض باستخدام Zustand
      const success = await updatePatient(editingPatient.id, {
        name: editingPatient.name,
        phone: editingPatient.phone,
        birthDate: editingPatient.birthDate,
        gender: editingPatient.gender,
        address: editingPatient.address,
        medicalHistory: Array.isArray(editingPatient.medicalHistory)
          ? editingPatient.medicalHistory.join(', ')
          : editingPatient.medicalHistory || ''
      });

      if (success) {
        // إغلاق النافذة المنبثقة
        setIsEditModalOpen(false);
        setEditingPatient(null);

        // عرض رسالة نجاح
        notify.success(`تم تحديث بيانات المريض "${editingPatient.name}" بنجاح`);
      } else {
        notify.error('فشل في تحديث بيانات المريض');
      }
    } catch (error) {
      notify.error(`حدث خطأ أثناء تحديث بيانات المريض: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  // Handle delete patient confirm
  const handleConfirmDeletePatient = async () => {
    if (!deletingPatient) return;

    try {
      // حذف المريض باستخدام Zustand
      const success = await deletePatient(deletingPatient.id);

      if (success) {
        // إغلاق النافذة المنبثقة
        setIsDeleteModalOpen(false);
        setDeletingPatient(null);

        // عرض رسالة حذف
        notify.error(`تم حذف المريض "${deletingPatient.name}"`);

        // إعادة تعيين الصفحة إذا كانت فارغة
        if (currentPatients.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        notify.error('فشل في حذف المريض');
      }
    } catch (error) {
      notify.error(`حدث خطأ أثناء حذف المريض: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle phone number input - only allow numbers and + sign
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow only numbers and + sign
    const filteredValue = value.replace(/[^0-9+]/g, '');
    setNewPatient(prev => ({
      ...prev,
      phone: filteredValue
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingPatient((prev) => prev ? ({
      ...prev,
      [name]: value
    }) : null);
  };

  return (
    <div className="space-y-6">


      {/* Header with search and add button */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-6 w-6" style={{ color: '#8A85B3' }} />
            </div>
            <input
              type="text"
              className="block w-full pr-12 pl-4 py-4 border-2 border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:border-transparent text-base transition-all duration-300"
              placeholder="بحث عن مريض بالاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={handleAddPatient}
            className="flex items-center px-6 py-4 rounded-xl text-white font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}
          >
            <PlusIcon className="h-6 w-6 ml-2" />
            إضافة مريض جديد
          </button>
        </div>
      </div>



      {/* Patients grid */}
      {currentPatients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {currentPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              id={patient.id}
              name={patient.name}
              phone={patient.phone}
              birthdate={patient.birthDate}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, rgba(138, 133, 179, 0.1) 0%, rgba(164, 114, 174, 0.1) 100%)'
          }}>
            <UserGroupIcon className="h-12 w-12" style={{ color: '#8A85B3' }} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">لا يوجد مرضى</h3>
          <p className="text-lg text-gray-600 mb-8">ابدأ بإضافة مريض جديد لبناء قاعدة بيانات المرضى</p>
          <button
            onClick={handleAddPatient}
            className="flex items-center mx-auto px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}
          >
            <PlusIcon className="h-6 w-6 ml-2" />
            إضافة أول مريض
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredPatients.length > patientsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
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
          <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
            isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    إضافة مريض جديد
                  </h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* الصف الأول - الاسم ورقم الهاتف */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={newPatient.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={newPatient.phone}
                      onChange={handlePhoneInputChange}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      placeholder="مثال: +963123456789"
                    />
                  </div>
                </div>

                {/* الصف الثاني - سنة الميلاد والجنس */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">سنة الميلاد</label>
                    <input
                      type="number"
                      name="birthdate"
                      id="birthdate"
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="أدخل سنة الميلاد"
                      value={newPatient.birthdate}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">الجنس</label>
                    <select
                      name="gender"
                      id="gender"
                      value={newPatient.gender}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>

                {/* الصف الثالث - العنوان */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={newPatient.address}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                  />
                </div>

                {/* الصف الرابع - التاريخ الطبي */}
                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
                    التاريخ الطبي
                  </label>
                  <textarea
                    name="medicalHistory"
                    id="medicalHistory"
                    rows={2}
                    placeholder="مثال: حساسية من البنسلين، مرض السكري"
                    value={newPatient.medicalHistory}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={handleSavePatient}
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الإضافة...' : 'إضافة المريض'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isEditModalOpen && editingPatient && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
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
          <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
            isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">تعديل بيانات المريض</h3>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      الاسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      value={editingPatient.name || ''}
                      onChange={(e) => setEditingPatient(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      id="edit-phone"
                      name="phone"
                      type="tel"
                      value={editingPatient.phone || ''}
                      onChange={(e) => setEditingPatient(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      placeholder="مثال: 0501234567"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                      سنة الميلاد
                    </label>
                    <input
                      id="edit-birthdate"
                      name="birthDate"
                      type="number"
                      min="1900"
                      max="2025"
                      value={editingPatient.birthDate || ''}
                      onChange={(e) => setEditingPatient(prev => prev ? { ...prev, birthDate: e.target.value } : null)}
                      placeholder="أدخل سنة الميلاد"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-gender" className="block text-sm font-medium text-gray-700 mb-1">
                      الجنس
                    </label>
                    <select
                      name="gender"
                      id="edit-gender"
                      value={editingPatient.gender || 'male'}
                      onChange={(e) => setEditingPatient(prev => prev ? { ...prev, gender: e.target.value as 'male' | 'female' } : null)}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>
                </div>



                <div>
                  <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    id="edit-address"
                    name="address"
                    type="text"
                    value={editingPatient.address || ''}
                    onChange={(e) => setEditingPatient(prev => prev ? { ...prev, address: e.target.value } : null)}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                  />
                </div>

                <div>
                  <label htmlFor="edit-medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
                    التاريخ الطبي
                  </label>
                  <textarea
                    name="medicalHistory"
                    id="edit-medicalHistory"
                    rows={2}
                    placeholder="مثال: حساسية من البنسلين، مرض السكري"
                    value={editingPatient.medicalHistory || ''}
                    onChange={(e) => setEditingPatient(prev => prev ? { ...prev, medicalHistory: e.target.value } : null)}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  />
                </div>
            </div>

              <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCloseEditModal}
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={handleSaveEditPatient}
                  disabled={isLoading}
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingPatient && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
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
          <div className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 mx-4 transform transition-all duration-300 ${
            isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-700 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 ml-2 text-red-500" />
                تأكيد حذف المريض
              </h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingPatient(null);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-center">
                  هل أنت متأكد من حذف المريض؟
                </p>
                <p className="text-red-900 font-bold text-center mt-2 text-lg">
                  {deletingPatient.name}
                </p>
              </div>
              <p className="text-gray-600 text-sm text-center">
                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات المريض نهائياً.
              </p>
            </div>

            <div className="flex justify-end space-x-4 rtl:space-x-reverse">
              <button
                type="button"
                className="px-6 py-3 border-2 border-gray-300 rounded-xl shadow-sm text-base font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingPatient(null);
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="px-6 py-3 border border-transparent rounded-xl shadow-lg text-base font-bold text-white hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                }}
                onClick={handleConfirmDeletePatient}
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
