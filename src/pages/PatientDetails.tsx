import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  PencilIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ActionButton from '../components/ActionButton';
import DentalHistory from '../components/DentalHistory';
import AddTreatmentModal from '../components/AddTreatmentModal';
import AddPaymentModal from '../components/AddPaymentModal';
import OptimizedTreatmentsList from '../components/OptimizedTreatmentsList';
import OptimizedPaymentsList from '../components/OptimizedPaymentsList';
import ImprovedXRayGallery from '../components/ImprovedXRayGallery';
import ToothNumberHelper from '../components/ToothNumberHelper';
import { useXRayStore, type XRay, type XRayType } from '../store/xrayStore';
import { xrayTypeNames, xrayTypeOptions } from '../data/xrays';
import { ISOTeeth } from '../data/types';
import { usePatientStore, type Patient } from '../store/patientStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useTreatmentStore, type Treatment } from '../store/treatmentStore';
import { usePaymentStore } from '../store/paymentStore';
import { formatCurrency } from '../utils/formatters';
import { notify } from '../store/notificationStore';
import { useSectionedLoading, usePaymentDistributionCache, clearPatientCache } from '../hooks/usePatientDetailsOptimization';
import ConfirmationModal from '../components/ConfirmationModal';







const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients: zustandPatients } = usePatientStore();
  const { getAppointmentsByPatientId } = useAppointmentStore();
  const [activeTab, setActiveTab] = useState<'info' | 'dental' | 'xray' | 'appointments' | 'payment'>('info');
  const [patientState, setPatientState] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);


  // الحصول على مواعيد المريض
  const patientAppointments = getAppointmentsByPatientId(parseInt(id || '0'));

  // استخدام المتاجر الحقيقية مع النظام الهجين
  const {
    getTreatmentsByPatient,
    getCompletedTreatmentsByPatientAfterClosure,
    getTotalCostByPatientIdCompletedAfterClosure,
    getPaymentDistributionCompletedAfterClosure,
    getPaymentDistribution, // للعلاجات النشطة (المبدوءة)
    getRemainingCostByPatientId // للعلاجات النشطة
  } = useTreatmentStore();
  const {
    getPaymentsByPatientIdAfterClosure,
    getTotalPaidByPatientIdAfterClosure
  } = usePaymentStore();
  const { getPatientById, getLastAccountClosure } = usePatientStore();

  // العلاجات والدفعات من المتاجر الحقيقية
  const patientId = parseInt(id || '1');

  // حالة لإجبار إعادة التحديث
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // استخدام التحميل المقسم والتخزين المؤقت
  const { sections, loadSection } = useSectionedLoading(patientId);
  const { getPaymentDistribution: getCachedPaymentDistribution } = usePaymentDistributionCache(patientId);

  // الحصول على بيانات المريض وآخر تسكير حساب
  const patient = getPatientById(patientId);
  const lastAccountClosure = getLastAccountClosure(patientId);
  const closureDate = lastAccountClosure?.closureDate;

  // استخدام الدوال الجديدة التي تراعي تسكير الحساب
  const [allTreatments, setAllTreatments] = useState(() => getTreatmentsByPatient(patientId));
  const [completedTreatments, setCompletedTreatments] = useState(() => getCompletedTreatmentsByPatientAfterClosure(patientId, closureDate));

  // تحديث البيانات عند تغيير updateTrigger
  useEffect(() => {
    setAllTreatments(getTreatmentsByPatient(patientId));
    setCompletedTreatments(getCompletedTreatmentsByPatientAfterClosure(patientId, closureDate));
  }, [updateTrigger, patientId, closureDate]);
  const payments = getPaymentsByPatientIdAfterClosure(patientId, closureDate); // الدفعات بعد التسكير
  const totalPaid = getTotalPaidByPatientIdAfterClosure(patientId, closureDate); // إجمالي المدفوع بعد التسكير

  // استخدام النظام الجديد: تشمل جميع العلاجات النشطة (المبدوءة)
  const paymentDistribution = getPaymentDistribution(patientId, totalPaid);
  const totalCost = paymentDistribution.totalCost;
  const remainingAmount = paymentDistribution.remainingAmount;

  // عرض العلاجات المكتملة بعد التسكير فقط في صفحة حالة الدفع والسجل السني
  const treatments = completedTreatments;

  // تتبع البيانات للتشخيص
  console.log('Completed treatments:', completedTreatments);
  console.log('Closure date:', closureDate);
  console.log('Patient ID:', patientId);

  // نظام التصفير التلقائي: إذا تم دفع كامل المبلغ، اعرض 0 في جميع الحقول
  const isFullyPaid = paymentDistribution.remainingAmount <= 0 && paymentDistribution.totalCost > 0;

  // حالة الدفع المحسوبة مع التصفير التلقائي
  const paymentStatus = {
    patientId,
    totalCost: isFullyPaid ? 0 : paymentDistribution.totalCost,
    totalPaid: isFullyPaid ? 0 : paymentDistribution.totalPaid,
    remainingAmount: isFullyPaid ? 0 : paymentDistribution.remainingAmount,
    status: isFullyPaid ? 'paid' : paymentDistribution.remainingAmount <= 0 ? 'paid' : paymentDistribution.totalPaid > 0 ? 'partial' : 'unpaid'
  };

  // حالة إضافة علاج جديد
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);

  // حالة إضافة علاج قديم (للأرشيف)
  const [isAddingOldTreatment, setIsAddingOldTreatment] = useState(false);
  const [isOldTreatmentModalAnimating, setIsOldTreatmentModalAnimating] = useState(false);

  // حالة إضافة صورة شعاعية
  const [isAddingXRay, setIsAddingXRay] = useState(false);
  const [isXRayModalAnimating, setIsXRayModalAnimating] = useState(false);
  const [selectedXRayType, setSelectedXRayType] = useState<XRayType>('panorama');
  const { addXRay, getXRaysByPatientId, deleteXRay } = useXRayStore();
  const [patientXRays, setPatientXRays] = useState<XRay[]>([]);
  const [viewingXRay, setViewingXRay] = useState<XRay | null>(null);
  const [deletingXRay, setDeletingXRay] = useState<XRay | null>(null);

  // حالة مودال التأكيد
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning' as 'danger' | 'warning' | 'info'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Handle open X-ray modal with animation
  const handleOpenXRayModal = () => {
    setSelectedImageUrl(null);
    setIsProcessingImage(false);
    setIsAddingXRay(true);
    setIsXRayModalAnimating(true);
    // Start animation after modal is shown
    setTimeout(() => setIsXRayModalAnimating(false), 50);
  };

  // Handle close X-ray modal with animation
  const handleCloseXRayModal = () => {
    setIsXRayModalAnimating(true);
    setTimeout(() => {
      setIsAddingXRay(false);
      setIsXRayModalAnimating(false);
      setSelectedImageUrl(null);
      setIsProcessingImage(false);
    }, 300);
  };

  // Handle open old treatment modal with animation
  const handleOpenOldTreatmentModal = () => {
    setIsAddingOldTreatment(true);
    setIsOldTreatmentModalAnimating(true);
    // Start animation after modal is shown
    setTimeout(() => setIsOldTreatmentModalAnimating(false), 50);
  };

  // Handle close old treatment modal with animation
  const handleCloseOldTreatmentModal = () => {
    setIsOldTreatmentModalAnimating(true);
    setTimeout(() => {
      setIsAddingOldTreatment(false);
      setIsOldTreatmentModalAnimating(false);
    }, 300);
  };

  // تحميل بيانات المريض عند تغيير ID
  const loadPatientData = useCallback(() => {
    if (!id) return;

    const patientId = parseInt(id);

    // البحث في بيانات Zustand فقط
    const zustandPatient = zustandPatients.find(p => p.id === patientId);

    if (zustandPatient) {
      // استخدام بيانات المريض من Zustand مباشرة
      const patientData: Patient = {
        id: zustandPatient.id,
        name: zustandPatient.name,
        phone: zustandPatient.phone,
        email: zustandPatient.email,
        birthDate: zustandPatient.birthDate,
        gender: zustandPatient.gender || 'male',
        address: zustandPatient.address,
        notes: zustandPatient.notes,
        medicalHistory: zustandPatient.medicalHistory,
        lastVisit: zustandPatient.lastVisit,
        createdAt: zustandPatient.createdAt,
        updatedAt: zustandPatient.updatedAt,
        isActive: zustandPatient.isActive
      };
      setPatientState(patientData);
      setEditedPatient({ ...patientData });
    } else {
      // المريض غير موجود - العودة لصفحة المرضى
      navigate('/patients');
    }
  }, [id, zustandPatients, navigate]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  // تحميل الصور الشعاعية عند تغيير ID
  const loadXRayData = useCallback(() => {
    if (!id) return;

    const patientId = parseInt(id);
    const xrays = getXRaysByPatientId(patientId);
    setPatientXRays(xrays);
  }, [id, getXRaysByPatientId]);

  useEffect(() => {
    loadXRayData();
  }, [loadXRayData]);

  // حالة إضافة دفعة جديدة
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // تحديث editedPatient عند تغيير patient
  useEffect(() => {
    if (patient) {
      setEditedPatient({ ...patient });
    }
  }, [patient]);

  // تحميل القسم عند تغيير التبويب النشط (التحميل المقسم)
  useEffect(() => {
    if (activeTab !== 'info') {
      loadSection(activeTab);
    }
  }, [activeTab, loadSection]);

  // Calculate age from birthdate
  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setIsEditing(true);
    setEditedPatient({ ...patient });
  };

  const handleSavePatient = () => {
    if (!editedPatient) return;
    // إنشاء نسخة جديدة من بيانات المريض لتجنب مشاكل المراجع
    const updatedPatient = { ...editedPatient };
    setPatientState(updatedPatient);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedPatient) return;
    const { name, value } = e.target;
    setEditedPatient({
      ...editedPatient,
      [name]: value
    });
  };

  // إضافة علاج قديم (للأرشيف)
  const handleAddOldTreatment = async () => {
    // الحصول على قيمة الحقول من عناصر DOM مباشرة
    const nameInput = document.getElementById('old-treatment-name') as HTMLInputElement;
    const dateInput = document.getElementById('old-treatment-date') as HTMLInputElement;
    const teethInput = document.getElementById('old-treatment-teeth') as HTMLInputElement;
    const notesInput = document.getElementById('old-treatment-notes') as HTMLTextAreaElement;

    // التحقق من صحة رقم السن إذا تم إدخاله
    let teethNumbers: number[] = [];
    if (teethInput && teethInput.value.trim()) {
      const numStr = teethInput.value.trim();
      const num = parseInt(numStr);

      if (isNaN(num)) {
        notify.error(`رقم السن "${numStr}" غير صحيح`);
        return;
      }

      if (numStr.length !== 2) {
        notify.error(`رقم السن يجب أن يكون مكون من رقمين`);
        return;
      }

      // التحقق من أن الرقم موجود في قائمة الأسنان المعتمدة
      const validTeethNumbers = [...ISOTeeth.permanent, ...ISOTeeth.deciduous];
      if (!validTeethNumbers.includes(num)) {
        notify.error(`رقم السن ${num} غير صحيح. يرجى إدخال رقم سن صحيح`);
        return;
      }

      teethNumbers.push(num);
    }

    // تحديث كائن العلاج القديم بالقيم المدخلة
    const treatmentDate = dateInput ? dateInput.value : format(new Date(), 'yyyy-MM-dd');
    const treatmentToAdd = {
      patientId: parseInt(id || '1'),
      name: nameInput ? nameInput.value : '',
      description: '',
      cost: 0, // لا تكلفة للعلاجات القديمة (أرشيف فقط)
      startDate: treatmentDate,
      endDate: treatmentDate, // نفس تاريخ البداية للعلاجات القديمة
      status: 'completed' as 'completed', // مكتمل دائمًا
      teethNumbers: teethNumbers,
      isActive: true,
      sessions: [],
      finalNotes: notesInput ? notesInput.value : ''
    };

    if (treatmentToAdd.name) { // فقط اسم العلاج إجباري
      try {
        // إضافة العلاج القديم مباشرة للسجل السني فقط
        const state = useTreatmentStore.getState();
        const newId = Math.max(...state.treatments.map(t => t.id), 0) + 1;
        const now = new Date().toISOString();

        const oldTreatment = {
          id: newId,
          patientId: treatmentToAdd.patientId,
          name: treatmentToAdd.name,
          description: treatmentToAdd.description || '',
          cost: 0, // تكلفة 0 للعلاجات القديمة
          startDate: treatmentToAdd.startDate,
          endDate: treatmentToAdd.startDate + 'T12:00:00.000Z',
          status: 'completed' as const,
          teethNumbers: treatmentToAdd.teethNumbers,
          sessions: [],
          finalNotes: notesInput ? notesInput.value : '',
          isActive: true,
          createdAt: now,
          updatedAt: now
        };

        // إضافة العلاج مباشرة إلى المتجر
        state.treatments.push(oldTreatment);

        // حفظ في localStorage
        localStorage.setItem('treatments', JSON.stringify(state.treatments));

        // تحديث البيانات
        setUpdateTrigger(prev => prev + 1);

        // إغلاق النافذة مع انيميشن
        setIsOldTreatmentModalAnimating(true);
        setTimeout(() => {
          setIsAddingOldTreatment(false);
          setIsOldTreatmentModalAnimating(false);
        }, 300);

        // إشعار النجاح
        notify.success('تم إضافة العلاج للأرشيف بنجاح');
      } catch (error) {
        console.error('خطأ في إضافة العلاج القديم:', error);
        notify.error('حدث خطأ في إضافة العلاج للأرشيف');
      }
    }
  };



  // Loading state
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل بيانات المريض...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {patient?.name || 'تحميل...'}
          </h1>
        </div>
        {activeTab === 'info' && (
          !isEditing ? (
            <button
              onClick={handleEditPatient}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}
            >
              <PencilIcon className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0" />
              تعديل البيانات
            </button>
          ) : (
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePatient}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                }}
              >
                حفظ
              </button>
            </div>
          )
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
        <nav className="flex">
          <button
            className={`flex items-center py-4 px-6 font-bold text-base transition-all duration-200 ${
              activeTab === 'info'
                ? 'text-white shadow-lg'
                : 'bg-white text-gray-600'
            }`}
            style={activeTab === 'info' ? { backgroundColor: '#33819E' } : {}}
            onClick={() => setActiveTab('info')}
          >
            <UserIcon className={`h-5 w-5 ml-2 ${activeTab === 'info' ? 'text-white' : ''}`} style={activeTab === 'info' ? {} : { color: '#33819E' }} />
            المعلومات الشخصية
          </button>
          <button
            className={`flex items-center py-4 px-6 font-bold text-base transition-all duration-200 ${
              activeTab === 'dental'
                ? 'text-white shadow-lg'
                : 'bg-white text-gray-600'
            }`}
            style={activeTab === 'dental' ? { backgroundColor: '#33819E' } : {}}
            onClick={() => setActiveTab('dental')}
          >
            <svg
              className={`h-5 w-5 ml-2 ${activeTab === 'dental' ? 'text-white' : ''}`}
              style={activeTab === 'dental' ? {} : { color: '#33819E' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            السجل السني
          </button>
          <button
            className={`flex items-center py-4 px-6 font-bold text-base transition-all duration-200 ${
              activeTab === 'xray'
                ? 'text-white shadow-lg'
                : 'bg-white text-gray-600'
            }`}
            style={activeTab === 'xray' ? { backgroundColor: '#33819E' } : {}}
            onClick={() => setActiveTab('xray')}
          >
            <PhotoIcon className={`h-5 w-5 ml-2 ${activeTab === 'xray' ? 'text-white' : ''}`} style={activeTab === 'xray' ? {} : { color: '#33819E' }} />
            الصور الشعاعية
          </button>
          <button
            className={`flex items-center py-4 px-6 font-bold text-base transition-all duration-200 ${
              activeTab === 'appointments'
                ? 'text-white shadow-lg'
                : 'bg-white text-gray-600'
            }`}
            style={activeTab === 'appointments' ? { backgroundColor: '#33819E' } : {}}
            onClick={() => setActiveTab('appointments')}
          >
            <CalendarIcon className={`h-5 w-5 ml-2 ${activeTab === 'appointments' ? 'text-white' : ''}`} style={activeTab === 'appointments' ? {} : { color: '#33819E' }} />
            المواعيد
          </button>
          <button
            className={`flex items-center py-4 px-6 font-bold text-base transition-all duration-200 ${
              activeTab === 'payment'
                ? 'text-white shadow-lg'
                : 'bg-white text-gray-600'
            }`}
            style={activeTab === 'payment' ? { backgroundColor: '#33819E' } : {}}
            onClick={() => setActiveTab('payment')}
          >
            <BanknotesIcon className={`h-5 w-5 ml-2 ${activeTab === 'payment' ? 'text-white' : ''}`} style={activeTab === 'payment' ? {} : { color: '#33819E' }} />
            تفاصيل العلاجات والدفعات
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'info' && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 animate-fade-in">
          {!isEditing ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="p-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                    <UserIcon className="h-6 w-6" style={{ color: '#33819E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#33819E' }}>الاسم</h3>
                    <p className="mt-1 text-base font-medium text-gray-900">{patient?.name || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="p-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                    <PhoneIcon className="h-6 w-6" style={{ color: '#33819E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#33819E' }}>رقم الهاتف</h3>
                    <p className="mt-1 text-base font-medium text-gray-900">{patient?.phone || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="p-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                    <CalendarIcon className="h-6 w-6" style={{ color: '#33819E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#33819E' }}>تاريخ الميلاد / العمر</h3>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {patient?.birthDate ? (
                        <>
                          {patient.birthDate}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ marginRight: '5px', backgroundColor: '#33819E' }}>
                            {calculateAge(patient.birthDate)} سنة
                          </span>
                        </>
                      ) : 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="p-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                    <UserIcon className="h-6 w-6" style={{ color: '#33819E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#33819E' }}>الجنس</h3>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {patient?.gender === 'male' ? 'ذكر' : patient?.gender === 'female' ? 'أنثى' : 'غير محدد'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 flex items-start space-x-3 rtl:space-x-reverse transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-md" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="p-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                    <MapPinIcon className="h-6 w-6" style={{ color: '#33819E' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: '#33819E' }}>العنوان</h3>
                    <p className="mt-1 text-base font-medium text-gray-900">{patient?.address || 'غير محدد'}</p>
                  </div>
                </div>
              </div>



              <div className="mt-4">
                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <h3 className="text-lg font-bold flex items-center mb-4" style={{ color: '#33819E' }}>
                    <svg className="h-6 w-6 ml-2" style={{ color: '#33819E' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    التاريخ الطبي والحساسية
                  </h3>
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(51, 129, 158, 0.1)', borderColor: 'rgba(51, 129, 158, 0.3)' }}>
                    {patient?.medicalHistory && typeof patient.medicalHistory === 'string' && patient.medicalHistory.trim() ? (
                      <div className="space-y-2">
                        {patient.medicalHistory.split(',').map((item, index) => (
                          <div key={index} className="flex items-center bg-white p-2 rounded-md shadow-sm">
                            <div className="w-2 h-2 bg-red-500 rounded-full" style={{ marginRight: '5px' }}></div>
                            <span className="text-sm font-medium text-gray-800" style={{ marginRight: '5px' }}>{item.trim()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-gray-600 italic">لا يوجد تاريخ طبي مسجل</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <label htmlFor="name" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                    <UserIcon className="h-5 w-5 ml-1 text-primary-500" />
                    الاسم
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={editedPatient?.name || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <label htmlFor="phone" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                    <PhoneIcon className="h-5 w-5 ml-1 text-primary-500" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={editedPatient?.phone || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                    dir="ltr"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <label htmlFor="birthdate" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                    <CalendarIcon className="h-5 w-5 ml-1 text-primary-500" />
                    تاريخ الميلاد
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    id="birthdate"
                    value={editedPatient?.birthdate || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                    dir="ltr"
                  />
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <label htmlFor="gender" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                    <UserIcon className="h-5 w-5 ml-1 text-primary-500" />
                    الجنس
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    value={editedPatient?.gender || 'male'}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                  >
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>

                <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                  <label htmlFor="address" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                    <MapPinIcon className="h-5 w-5 ml-1 text-primary-500" />
                    العنوان
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={editedPatient?.address || ''}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <label htmlFor="allergies" className="block text-sm font-bold text-primary-700 mb-2 flex items-center">
                  <svg className="h-5 w-5 ml-1 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  التاريخ الطبي والحساسية
                </label>
                <textarea
                  name="medicalHistory"
                  id="medicalHistory"
                  rows={4}
                  value={editedPatient?.medicalHistory || ''}
                  onChange={(e) => {
                    if (!editedPatient) return;
                    setEditedPatient({
                      ...editedPatient,
                      medicalHistory: e.target.value
                    });
                  }}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
                  placeholder="مثال: حساسية من البنسلين، مرض السكري، ضغط الدم"
                />
                <p className="mt-2 text-xs text-gray-500">
                  اكتب الحالات الطبية والحساسية مفصولة بفواصل
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dental' && (
        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">السجل السني</h3>
            <button
              onClick={handleOpenOldTreatmentModal}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}
            >
              <PlusIcon className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0" />
              إضافة علاج قديم (أرشيف)
            </button>
          </div>

          <DentalHistory
            patientId={patient?.id}
          />

          {/* ملخص الحالات السنية */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-base font-medium text-gray-900 mb-4">ملخص الحالات السنية</h4>

            {treatments.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr className="text-right" style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-base font-bold text-white border-b border-white/20">العلاج</th>
                      <th scope="col" className="px-3 py-3.5 text-base font-bold text-white border-b border-white/20">التاريخ</th>
                      <th scope="col" className="px-3 py-3.5 text-base font-bold text-white border-b border-white/20">الأسنان</th>
                      <th scope="col" className="px-3 py-3.5 text-base font-bold text-white border-b border-white/20">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {[...treatments]
                      .sort((a, b) => {
                        // ترتيب تنازلي حسب التاريخ (الأحدث أولاً)
                        const dateA = a.status === 'completed' && a.endDate
                          ? new Date(a.endDate)
                          : new Date(a.startDate || a.date);
                        const dateB = b.status === 'completed' && b.endDate
                          ? new Date(b.endDate)
                          : new Date(b.startDate || b.date);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map(treatment => (
                        <tr key={treatment.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-base font-medium text-gray-900">{treatment.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-base text-gray-500">
                            {(() => {
                              try {
                                // إذا كان العلاج مكتمل ولديه تاريخ انتهاء، استخدمه
                                if (treatment.status === 'completed' && treatment.endDate) {
                                  const endDate = new Date(treatment.endDate);
                                  return isNaN(endDate.getTime()) ? 'تاريخ غير صالح' : format(endDate, 'dd/MM/yyyy');
                                }
                                // وإلا استخدم تاريخ البداية أو التاريخ العادي
                                else if (treatment.startDate) {
                                  const startDate = new Date(treatment.startDate);
                                  return isNaN(startDate.getTime()) ? 'تاريخ غير صالح' : format(startDate, 'dd/MM/yyyy');
                                }
                                else if (treatment.date) {
                                  const date = new Date(treatment.date);
                                  return isNaN(date.getTime()) ? 'تاريخ غير صالح' : format(date, 'dd/MM/yyyy');
                                }
                                return 'غير محدد';
                              } catch (error) {
                                return 'تاريخ غير صالح';
                              }
                            })()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-base text-gray-500">
                            {treatment.teethNumbers && treatment.teethNumbers.length > 0
                              ? treatment.teethNumbers.join(', ')
                              : 'غير محدد'}
                          </td>
                          <td className="px-3 py-4 text-base text-gray-500 max-w-xs">
                            <div className="truncate" title={(() => {
                              const notes = treatment.finalNotes || treatment.notes || '';
                              return typeof notes === 'string' ? notes : '';
                            })()}>
                              {(() => {
                                const notes = treatment.finalNotes || treatment.notes;
                                if (!notes || typeof notes !== 'string' || notes.trim() === '') {
                                  return '-';
                                }
                                return notes;
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لا توجد علاجات مسجلة</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'xray' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">الصور الشعاعية</h3>
            <button
              onClick={handleOpenXRayModal}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}
            >
              <PhotoIcon className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0" />
              إضافة صورة شعاعية
            </button>
          </div>

          <div className="p-6">
            {/* معرض الصور المحسن */}
            <ImprovedXRayGallery
              patientId={patientId}
              itemsPerPage={6}
            />
          </div>

          {/* نافذة عرض الصورة الشعاعية بشكل كبير */}
          {viewingXRay && (
            <div
              className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
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
              <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-fade-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 relative overflow-hidden">
                  {/* خلفية تدرج */}
                  <div className="absolute inset-0 opacity-10" style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}></div>
                  <div className="relative flex items-center">
                    <div className="w-1 h-6 rounded-sm ml-3" style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)'
                    }}></div>
                    <h3 className="text-xl font-bold text-gray-800">{xrayTypeNames[viewingXRay.type]}</h3>
                  </div>
                  <button
                    onClick={() => setViewingXRay(null)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 flex flex-col lg:flex-row gap-6 max-h-[calc(90vh-120px)] overflow-auto">
                  {/* الصورة */}
                  <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden">
                    <img
                      src={viewingXRay.imageUrl}
                      alt={xrayTypeNames[viewingXRay.type]}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* معلومات الصورة */}
                  <div className="lg:w-80 space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(42, 123, 155, 0.1) 0%, rgba(138, 133, 179, 0.1) 50%, rgba(164, 114, 174, 0.1) 100%)' }}>
                      <h4 className="font-bold mb-2" style={{ color: '#33819E' }}>تفاصيل الصورة</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">النوع:</span>
                          <span className="text-sm text-gray-900 mr-2">{xrayTypeNames[viewingXRay.type]}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">التاريخ:</span>
                          <span className="text-sm text-gray-900 mr-2">{viewingXRay.date}</span>
                        </div>
                        {viewingXRay.notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">ملاحظات:</span>
                            <p className="text-sm text-gray-900 mt-1">{viewingXRay.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}



      {activeTab === 'appointments' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">سجل المواعيد</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {patientAppointments.map((appointment) => (
              <li key={appointment.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(appointment.date), 'yyyy/MM/dd')} - {appointment.time}
                    </p>
                    <p className="text-sm text-gray-500">{appointment.treatment}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{appointment.doctorName}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status === 'completed' ? 'مكتمل' : appointment.status === 'scheduled' ? 'مجدول' : 'ملغي'}
                    </span>
                  </div>
                </div>
                {appointment.notes && (
                  <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">حالة الدفع</h3>
          </div>

          {paymentStatus ? (
            <div className="p-4">
              {/* ملخص حالة الدفع */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(42, 123, 155, 0.1) 0%, rgba(138, 133, 179, 0.1) 50%, rgba(164, 114, 174, 0.1) 100%)' }}>
                  <h4 className="text-sm font-medium mb-1" style={{ color: '#33819E' }}>التكلفة الإجمالية</h4>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(paymentStatus.totalCost)}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(42, 123, 155, 0.1) 0%, rgba(138, 133, 179, 0.1) 50%, rgba(164, 114, 174, 0.1) 100%)' }}>
                  <h4 className="text-sm font-medium mb-1" style={{ color: '#33819E' }}>المبلغ المدفوع</h4>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(paymentStatus.totalPaid)}</p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(42, 123, 155, 0.1) 0%, rgba(138, 133, 179, 0.1) 50%, rgba(164, 114, 174, 0.1) 100%)' }}>
                  <h4 className="text-sm font-medium mb-1" style={{ color: '#33819E' }}>المبلغ المتبقي</h4>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(paymentStatus.remainingAmount)}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <h4 className="text-base font-medium text-gray-900">حالة الدفع</h4>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paymentStatus.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : paymentStatus.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {paymentStatus.status === 'paid' ? 'مدفوع بالكامل' : paymentStatus.status === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
                  </span>
                </div>

              </div>

              {/* قائمة العلاجات المحسنة */}
              <OptimizedTreatmentsList
                patientId={patientId}
                paymentDistribution={paymentDistribution}
                totalPaid={totalPaid}
                itemsPerPage={5}
              />

              {/* قائمة الدفعات المحسنة */}
              <OptimizedPaymentsList
                patientId={patientId}
                itemsPerPage={5}
              />
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">لا توجد معلومات دفع لهذا المريض</p>
            </div>
          )}

          {/* نافذة إضافة علاج جديد */}
          <AddTreatmentModal
            isOpen={isAddingTreatment}
            onClose={() => setIsAddingTreatment(false)}
            patientId={parseInt(id || '1')}
            patientName={patient?.name || 'مريض غير معروف'}
          />





          {/* نافذة إضافة دفعة جديدة */}
          <AddPaymentModal
            isOpen={isAddingPayment}
            onClose={() => setIsAddingPayment(false)}
            patientId={parseInt(id || '1')}
            patientName={patient?.name || 'مريض غير معروف'}
          />
        </div>
      )}

      {/* نافذة إضافة علاج قديم (للأرشيف) */}
      {isAddingOldTreatment && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isOldTreatmentModalAnimating ? 'opacity-0' : 'opacity-100'
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
            isOldTreatmentModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    إضافة علاج قديم (أرشيف)
                  </h3>
                </div>
                <button
                  onClick={handleCloseOldTreatmentModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* الصف الأول - نوع العلاج وتاريخ العلاج */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="old-treatment-template" className="block text-sm font-medium text-gray-700 mb-1">
                      نوع العلاج <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="old-treatment-template"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      onChange={(e) => {
                        const nameInput = document.getElementById('old-treatment-name') as HTMLInputElement;
                        if (nameInput) {
                          nameInput.value = e.target.value;
                        }
                      }}
                    >
                      <option value="">-- اختر نوع العلاج --</option>
                      {useTreatmentStore.getState().getActiveTreatmentTemplates().map((template) => (
                        <option key={template.id} value={template.name}>
                          {template.name} ({template.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="old-treatment-date" className="block text-sm font-medium text-gray-700 mb-1">تاريخ العلاج</label>
                    <input
                      type="date"
                      name="date"
                      id="old-treatment-date"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                <input
                  type="hidden"
                  name="name"
                  id="old-treatment-name"
                />

                {/* الصف الثاني - رقم السن */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="old-treatment-teeth" className="block text-sm font-medium text-gray-700 mb-1">رقم السن</label>
                    <input
                      type="text"
                      name="teethNumbers"
                      id="old-treatment-teeth"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      placeholder="مثال: 11"
                      maxLength={2}
                      onChange={(e) => {
                        const value = e.target.value;
                        // السماح بالأرقام فقط
                        const filteredValue = value.replace(/[^0-9]/g, '');
                        // تحديد الطول بحد أقصى رقمين
                        const limitedValue = filteredValue.slice(0, 2);
                        e.target.value = limitedValue;
                      }}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        أدخل رقم السن (رقمين فقط) - مثال: 11, 21, 31, 41
                      </p>
                      <ToothNumberHelper onSelectTooth={(toothNumber) => {
                        const teethInput = document.getElementById('old-treatment-teeth') as HTMLInputElement;
                        if (teethInput) {
                          teethInput.value = toothNumber.toString();
                        }
                      }} />
                    </div>
                  </div>
                  <div></div>
                </div>

                {/* الصف الثالث - الملاحظات */}
                <div>
                  <label htmlFor="old-treatment-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    الملاحظات
                  </label>
                  <textarea
                    name="notes"
                    id="old-treatment-notes"
                    rows={2}
                    placeholder="أي ملاحظات إضافية عن العلاج"
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCloseOldTreatmentModal}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={handleAddOldTreatment}
                >
                  إضافة للأرشيف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد حذف الصورة الشعاعية */}
      {deletingXRay && (
        <div
          className="fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 relative overflow-hidden">
              {/* خلفية تدرج */}
              <div className="absolute inset-0 opacity-10" style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}></div>
              <div className="relative flex items-center">
                <div className="w-1 h-6 rounded-sm ml-3" style={{
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)'
                }}></div>
                <h3 className="text-xl font-bold text-gray-800">تأكيد الحذف</h3>
              </div>
              <button
                onClick={() => setDeletingXRay(null)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">هل أنت متأكد من حذف هذه الصورة؟</h4>
                <p className="text-sm text-gray-600">
                  سيتم حذف صورة {xrayTypeNames[deletingXRay.type]} المؤرخة في {deletingXRay.date} نهائياً ولا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingXRay(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    await deleteXRay(deletingXRay.id);

                    // إعادة تحميل قائمة الصور الشعاعية
                    const updatedXRays = getXRaysByPatientId(parseInt(id || '1'));
                    setPatientXRays(updatedXRays);

                    setDeletingXRay(null);

                    // إشعار الحذف
                    notify.error('تم حذف الصورة الشعاعية');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  }}
                >
                  حذف نهائياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة صورة شعاعية جديدة */}
      {isAddingXRay && (
        <div
          className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isXRayModalAnimating ? 'opacity-0' : 'opacity-100'
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
            isXRayModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    إضافة صورة شعاعية
                  </h3>
                </div>
                <button
                  onClick={handleCloseXRayModal}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* الصف الأول - نوع الصورة وتاريخ الصورة */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="xray-type" className="block text-sm font-medium text-gray-700 mb-1">
                      نوع الصورة <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="xray-type"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      value={selectedXRayType}
                      onChange={(e) => setSelectedXRayType(e.target.value as XRayType)}
                    >
                      {xrayTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="xray-date" className="block text-sm font-medium text-gray-700 mb-1">تاريخ الصورة</label>
                    <input
                      type="date"
                      id="xray-date"
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                {/* الصف الثاني - اختيار الصورة */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الصورة <span className="text-red-500">*</span>
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      {isProcessingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-sm text-gray-500">جاري معالجة الصورة...</p>
                        </div>
                      ) : selectedImageUrl ? (
                        <div className="mb-2">
                          <div className="relative cursor-zoom-in" onClick={() => {
                            const w = window.open(selectedImageUrl, '_blank');
                            if (w) {
                              w.focus();
                            }
                          }}>
                            <img
                              src={selectedImageUrl}
                              alt="الصورة المختارة"
                              className="mx-auto h-40 w-auto object-contain border border-gray-300 rounded"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                انقر للتكبير
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-green-600 mt-1">تم اختيار الصورة بنجاح</p>
                        </div>
                      ) : (
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      )}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                          style={{ borderColor: '#33819E' }}
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          <PhotoIcon className="h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0" style={{ color: '#33819E' }} />
                          <span style={{ color: '#33819E' }}>استعراض الملفات</span>
                        </button>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];

                              if (!file.type.startsWith('image/')) {
                                setConfirmModalConfig({
                                  title: 'نوع ملف غير صحيح',
                                  message: 'يرجى اختيار ملف صورة صالح',
                                  onConfirm: () => setIsConfirmModalOpen(false),
                                  type: 'warning'
                                });
                                setIsConfirmModalOpen(true);
                                return;
                              }

                              if (file.size > 5 * 1024 * 1024) {
                                setConfirmModalConfig({
                                  title: 'حجم الملف كبير',
                                  message: 'حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 5MB',
                                  onConfirm: () => setIsConfirmModalOpen(false),
                                  type: 'warning'
                                });
                                setIsConfirmModalOpen(true);
                                return;
                              }

                              setIsProcessingImage(true);

                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const img = new Image();

                              img.onload = () => {
                                const maxWidth = 800;
                                const maxHeight = 600;
                                let { width, height } = img;

                                if (width > maxWidth || height > maxHeight) {
                                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                                  width *= ratio;
                                  height *= ratio;
                                }

                                canvas.width = width;
                                canvas.height = height;
                                ctx?.drawImage(img, 0, 0, width, height);

                                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                setSelectedImageUrl(compressedDataUrl);
                                setIsProcessingImage(false);
                              };

                              img.onerror = () => {
                                setIsProcessingImage(false);
                                setConfirmModalConfig({
                                  title: 'خطأ في الصورة',
                                  message: 'خطأ في قراءة الصورة',
                                  onConfirm: () => setIsConfirmModalOpen(false),
                                  type: 'danger'
                                });
                                setIsConfirmModalOpen(true);
                              };

                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  img.src = event.target.result as string;
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500">PNG, JPG, GIF حتى 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* الصف الثالث - الملاحظات */}
                <div>
                  <label htmlFor="xray-notes" className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    id="xray-notes"
                    rows={2}
                    className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                    placeholder="أي ملاحظات إضافية عن الصورة"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCloseXRayModal}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isProcessingImage || !selectedImageUrl}
                  className={`px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white ${
                    isProcessingImage || !selectedImageUrl
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-lg hover:scale-105'
                  }`}
                  style={{
                    background: isProcessingImage || !selectedImageUrl
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                  }}
                  onClick={async () => {
                    if (!selectedImageUrl || isProcessingImage) {
                      return;
                    }

                    try {
                      const newXRay = {
                        patientId: parseInt(id || '1'),
                        type: selectedXRayType,
                        imageUrl: selectedImageUrl,
                        date: (document.getElementById('xray-date') as HTMLInputElement)?.value || format(new Date(), 'yyyy-MM-dd'),
                        notes: (document.getElementById('xray-notes') as HTMLTextAreaElement)?.value || ''
                      };

                      await addXRay(newXRay);
                      const updatedXRays = getXRaysByPatientId(parseInt(id || '1'));
                      setPatientXRays(updatedXRays);

                      setIsXRayModalAnimating(true);
                      setTimeout(() => {
                        setIsAddingXRay(false);
                        setIsXRayModalAnimating(false);
                        setSelectedImageUrl(null);
                        setIsProcessingImage(false);
                      }, 300);

                      notify.success('تم إضافة الصورة الشعاعية بنجاح');
                    } catch (error) {
                      notify.error('حدث خطأ في إضافة الصورة الشعاعية');
                    }
                  }}
                >
                  {isProcessingImage ? 'جاري المعالجة...' : 'إضافة الصورة'}
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



    </div>
  );
};

export default PatientDetails;
