import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PencilIcon,
  XMarkIcon,
  UserIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useShallow } from 'zustand/react/shallow';
import { useAppointmentStore } from '../store/appointmentStore';
import { usePatientStore } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';
import { useProcedureStore } from '../store/procedureStore';
import { useSettingsStore } from '../store/settingsStore';
import { getSlotsForDate, isWorkingDate } from '../utils/appointmentSlots';
import { notify } from '../store/notificationStore';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTreatmentStore } from '../store/treatmentStore';
import type { Appointment } from '../store/appointmentStore';
import Table from '../components/Table';
import { useAppointmentOptimization } from '../hooks/useAppointmentOptimization';
import OptimizedCalendar from '../components/appointments/OptimizedCalendar';

const Appointments = () => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

  // Loading and animation states
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // Confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning' as 'danger' | 'warning' | 'info'
  });

  // Calendar states (سيتم استبدالها بالـ hook المحسن)
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 6 }));
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Hook محسن للمواعيد (للتقويم فقط)
  const {
    isLoading: isOptimizedLoading,
    isRefreshing,
    error: optimizedError,
    calendarState,
    getVisibleCalendarDays,
    navigateCalendar,
    selectDate,
    refresh: refreshOptimized
  } = useAppointmentOptimization();



  // Patient search states
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Day dropdown state
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  // New patient appointment state
  const [isNewPatientAppointment, setIsNewPatientAppointment] = useState(false);

  // New patient name for direct input
  const [newPatientName, setNewPatientName] = useState('');

  // Hour dropdown state
  const [showHourDropdown, setShowHourDropdown] = useState(false);

  // New appointment state (date/time for slot-based booking)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    doctorId: '',
    date: todayStr,
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    time: '09:00', // slot HH:mm
    hour: '9',
    minute: '00',
    period: 'صباحاً',
    treatment: 'فحص',
    treatmentType: 'Examination',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'waiting_list'
  });

  // New patient state
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    day: new Date().getDate().toString(),
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    gender: 'male' as 'male' | 'female',
    address: '',
    medicalHistory: ''
  });

  // Zustand stores
  const {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment
  } = useAppointmentStore();

  const { patients: allPatients, addPatient } = usePatientStore();
  const { doctors: allDoctors, getActiveDoctors } = useDoctorStore();
  const { treatmentTemplates, initializeDefaultTemplates } = useTreatmentStore();
  const getGroups = useProcedureStore(s => s.getGroups);
  const settings = useSettingsStore(
    useShallow(s => ({
      workingHours: s.settings.workingHours,
      workingDays: s.settings.workingDays,
      holidays: s.settings.holidays,
      appointmentDuration: s.settings.appointmentDuration || 30
    }))
  );

  const procedureGroups = getGroups();
  const addModalDateStr = `${newAppointment.year}-${newAppointment.month.padStart(2, '0')}-${newAppointment.day.padStart(2, '0')}`;
  const addModalSlots = useMemo(() => {
    return getSlotsForDate(
      addModalDateStr,
      settings.workingHours,
      settings.workingDays,
      settings.holidays,
      settings.appointmentDuration
    );
  }, [addModalDateStr, settings.workingHours, settings.workingDays, settings.holidays, settings.appointmentDuration]);
  const addModalIsWorkingDay = isWorkingDate(addModalDateStr, settings.workingDays, settings.holidays);

  // الحصول على الأطباء النشطين فقط للقوائم
  const activeDoctors = getActiveDoctors();

  // تهيئة قوالب العلاجات عند تحميل المكون
  useEffect(() => {
    if (treatmentTemplates.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Initializing treatment templates in Appointments...');
      }
      initializeDefaultTemplates();
    } else if (process.env.NODE_ENV === 'development') {
      console.log('✅ Treatment templates loaded:', treatmentTemplates.length);
    }
  }, [treatmentTemplates.length, initializeDefaultTemplates]);

  // دالة للتحقق من أن النص عربي فقط
  const isArabicOnly = (text: string) => {
    const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/;
    return arabicRegex.test(text.trim());
  };



  // Modal handlers
  const handleAddAppointment = () => {
    const firstDoctor = activeDoctors[0];
    const today = new Date();
    const d = today.getDate().toString();
    const m = (today.getMonth() + 1).toString();
    const y = today.getFullYear().toString();
    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const slots = getSlotsForDate(
      dateStr,
      settings.workingHours,
      settings.workingDays,
      settings.holidays,
      settings.appointmentDuration
    );
    setNewAppointment(prev => ({
      ...prev,
      patientId: '',
      doctorId: firstDoctor ? firstDoctor.id.toString() : '',
      date: dateStr,
      day: d,
      month: m,
      year: y,
      time: slots[0]?.time || '09:00',
      hour: '9',
      minute: '00',
      period: 'صباحاً',
      treatment: 'فحص',
      treatmentType: 'Examination',
      status: 'scheduled'
    }));

    setIsNewPatientAppointment(false);
    setPatientSearchTerm('');
    setNewPatientName('');
    setShowPatientDropdown(false);

    setIsModalAnimating(true);
    setTimeout(() => {
      setIsAddModalOpen(true);
      setIsModalAnimating(false);
    }, 300);
  };

  const handleAddNewPatient = () => {
    const firstDoctor = activeDoctors[0];
    const today = new Date();
    const d = today.getDate().toString();
    const m = (today.getMonth() + 1).toString();
    const y = today.getFullYear().toString();
    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const slots = getSlotsForDate(
      dateStr,
      settings.workingHours,
      settings.workingDays,
      settings.holidays,
      settings.appointmentDuration
    );
    setNewAppointment(prev => ({
      ...prev,
      patientId: '',
      doctorId: firstDoctor ? firstDoctor.id.toString() : '',
      date: dateStr,
      day: d,
      month: m,
      year: y,
      time: slots[0]?.time || '09:00',
      hour: '9',
      minute: '00',
      period: 'صباحاً',
      treatment: 'فحص',
      treatmentType: 'Examination',
      status: 'scheduled'
    }));

    setIsNewPatientAppointment(true);
    setPatientSearchTerm('');
    setNewPatientName('');
    setShowPatientDropdown(false);

    setIsModalAnimating(true);
    setTimeout(() => {
      setIsAddModalOpen(true);
      setIsModalAnimating(false);
    }, 300);
  };

  const handleCloseAddModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsModalAnimating(false);
      const today = new Date();
      const d = today.getDate().toString();
      const m = (today.getMonth() + 1).toString();
      const y = today.getFullYear().toString();
      setNewAppointment({
        patientId: '',
        doctorId: '',
        date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
        day: d,
        month: m,
        year: y,
        time: '09:00',
        hour: '9',
        minute: '00',
        period: 'صباحاً',
        treatment: 'فحص',
        treatmentType: 'Examination',
        notes: '',
        status: 'scheduled'
      });
      setPatientSearchTerm('');
      setNewPatientName('');
      setShowPatientDropdown(false);
    }, 300);
  };

  const handleClosePatientModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      setIsAddPatientModalOpen(false);
      setIsModalAnimating(false);
      setNewPatient({
        name: '',
        phone: '',
        day: new Date().getDate().toString(),
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
        gender: 'male',
        address: '',
        medicalHistory: ''
      });
    }, 300);
  };

  // Convert slot "HH:mm" to display time "h:mm period"
  const slotToDisplayTime = (slotTime: string) => {
    const [h, m] = slotTime.split(':').map(Number);
    const hour = h ?? 0;
    const minute = m ?? 0;
    if (hour === 0) return `12:${String(minute).padStart(2, '0')} صباحاً`;
    if (hour < 12) return `${hour}:${String(minute).padStart(2, '0')} صباحاً`;
    if (hour === 12) return `12:${String(minute).padStart(2, '0')} مساءً`;
    return `${hour - 12}:${String(minute).padStart(2, '0')} مساءً`;
  };

  // Save handlers
  const handleSaveAppointment = async () => {
    const patientNameToUse = isNewPatientAppointment ? newPatientName.trim() : patientSearchTerm.trim();
    let patientIdToUse = isNewPatientAppointment ? 0 : parseInt(newAppointment.patientId, 10);

    if (!patientNameToUse || !newAppointment.day || (addModalSlots.length > 0 ? !newAppointment.time : !newAppointment.hour)) {
      notify.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!isArabicOnly(patientNameToUse)) {
      notify.error('يرجى كتابة اسم المريض باللغة العربية فقط');
      return;
    }

    if (isNewPatientAppointment && !newAppointment.doctorId) {
      notify.error('يرجى تحديد طبيب للمريض الجديد');
      return;
    }

    setIsLoading(true);
    try {
      if (isNewPatientAppointment) {
        const newId = await addPatient({ name: patientNameToUse, phone: '' });
        patientIdToUse = newId;
      }

      const doctor = allDoctors.find(d => d.id === parseInt(newAppointment.doctorId, 10));
      const formattedDate = `${newAppointment.year}-${newAppointment.month.padStart(2, '0')}-${newAppointment.day.padStart(2, '0')}`;
      const formattedTime = addModalSlots.length > 0 && newAppointment.time
        ? slotToDisplayTime(newAppointment.time)
        : `${newAppointment.hour}:${newAppointment.minute} ${newAppointment.period}`;

      await addAppointment({
        patientId: patientIdToUse,
        patientName: patientNameToUse,
        doctorId: newAppointment.doctorId ? parseInt(newAppointment.doctorId, 10) : undefined,
        doctorName: doctor?.name || '',
        date: formattedDate,
        time: formattedTime,
        treatment: newAppointment.treatment,
        treatmentType: newAppointment.treatmentType,
        notes: newAppointment.notes,
        status: newAppointment.status,
        isNewPatient: isNewPatientAppointment
      });

      handleCloseAddModal();
      notify.success('تم إضافة الموعد بنجاح');
    } catch (error) {
      notify.error((error as Error)?.message || 'حدث خطأ أثناء إضافة الموعد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePatient = async () => {
    if (!newPatient.name.trim()) {
      notify.error('يرجى إدخال اسم المريض');
      return;
    }

    setIsLoading(true);
    try {
      // تحويل التاريخ المقسم إلى تنسيق واحد
      const birthdate = `${newPatient.year}-${newPatient.month.padStart(2, '0')}-${newPatient.day.padStart(2, '0')}`;

      const patientData = {
        name: newPatient.name.trim(),
        phone: newPatient.phone,
        birthdate: birthdate,
        gender: newPatient.gender,
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      };

      const savedPatientId = await addPatient(patientData);

      // Set the new patient as selected in appointment form
      setNewAppointment(prev => ({ ...prev, patientId: savedPatientId.toString() }));

      // تحديث أي مواعيد موجودة لهذا المريض الجديد
      const appointmentsToUpdate = appointments.filter(apt =>
        apt.isNewPatient &&
        apt.patientName === patientData.name.trim()
      );

      // تحديث المواعيد لربطها بالمريض الجديد
      for (const appointment of appointmentsToUpdate) {
        await updateAppointment(appointment.id, {
          patientId: savedPatientId,
          isNewPatient: false
        });
      }

      handleClosePatientModal();
      notify.success('تم إضافة المريض بنجاح وتحديث المواعيد المرتبطة');
    } catch (error) {
      notify.error('حدث خطأ أثناء إضافة المريض');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar navigation
  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  // دالة موحدة لتحويل الوقت إلى دقائق للترتيب الصحيح
  const timeToMinutes = useCallback((timeString: string): number => {
    try {
      // التعامل مع التنسيقات المختلفة للوقت
      let timeMatch = timeString.match(/(\d+):(\d+)\s*(صباحاً|مساءً)/);

      if (!timeMatch) {
        // محاولة التعامل مع تنسيق 24 ساعة
        timeMatch = timeString.match(/(\d+):(\d+)/);
        if (!timeMatch) return 0;

        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        return hour * 60 + minute;
      }

      const hour = parseInt(timeMatch[1]);
      const minute = parseInt(timeMatch[2]);
      const period = timeMatch[3];

      let adjustedHour = hour;

      if (period === 'مساءً' && hour !== 12) {
        adjustedHour = hour + 12;
      } else if (period === 'صباحاً' && hour === 12) {
        adjustedHour = 0;
      }

      return adjustedHour * 60 + minute;
    } catch (error) {
      console.warn('Error parsing time:', timeString, error);
      return 0;
    }
  }, []);

  // تصفية المواعيد حسب اليوم المحدد مع ترتيب صحيح حسب التوقيت
  const selectedDayAppointments = useMemo(() => {
    return appointments
      .filter(appointment => appointment.date === calendarState.selectedDate)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [appointments, calendarState.selectedDate, timeToMinutes]);





  // Filter patients based on search term
  const filteredPatients = allPatients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  // Handle patient selection
  const handlePatientSelect = (patient: any) => {
    setPatientSearchTerm(patient.name);
    setNewAppointment(prev => ({ ...prev, patientId: patient.id.toString() }));
    setShowPatientDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.day-dropdown')) {
        setShowDayDropdown(false);
      }
      if (!target.closest('.hour-dropdown')) {
        setShowHourDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle appointment actions
  const handleEditAppointment = (appointment: Appointment) => {
    // تحويل التاريخ والوقت إلى التنسيق المقسم
    const appointmentDate = new Date(appointment.date);
    const day = appointmentDate.getDate().toString();
    const month = (appointmentDate.getMonth() + 1).toString();
    const year = appointmentDate.getFullYear().toString();

    // تحليل الوقت
    const timeMatch = appointment.time.match(/(\d+):(\d+)\s*(صباحاً|مساءً)/);
    const hour = timeMatch ? timeMatch[1] : '9';
    const minute = timeMatch ? timeMatch[2] : '00';
    const period = timeMatch ? timeMatch[3] : 'صباحاً';

    setCurrentAppointment({
      ...appointment,
      day,
      month,
      year,
      hour,
      minute,
      period
    });

    setIsModalAnimating(true);
    setTimeout(() => {
      setIsEditModalOpen(true);
      setIsModalAnimating(false);
    }, 300);
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    setConfirmModalConfig({
      title: 'تأكيد حذف الموعد',
      message: 'هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: () => confirmDeleteAppointment(appointmentId),
      type: 'danger'
    });
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteAppointment = async (appointmentId: number) => {
    setIsConfirmModalOpen(false);
    try {
      await deleteAppointment(appointmentId);
      notify.error('تم حذف الموعد');
    } catch (error) {
      notify.error('حدث خطأ أثناء حذف الموعد');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!currentAppointment) return;

    setIsLoading(true);
    try {
      // تحويل التاريخ والوقت المقسم إلى تنسيق واحد
      const formattedDate = `${currentAppointment.year}-${currentAppointment.month?.padStart(2, '0')}-${currentAppointment.day?.padStart(2, '0')}`;
      const formattedTime = `${currentAppointment.hour}:${currentAppointment.minute} ${currentAppointment.period}`;

      // العثور على الموعد الأصلي للمقارنة
      const originalAppointment = appointments.find(apt => apt.id === currentAppointment.id);
      const timeChanged = originalAppointment && (
        originalAppointment.time !== formattedTime ||
        originalAppointment.date !== formattedDate
      );

      await updateAppointment(currentAppointment.id, {
        date: formattedDate,
        time: formattedTime,
        treatment: currentAppointment.treatment,
        doctorId: currentAppointment.doctorId,
        doctorName: currentAppointment.doctorName
      });

      setIsModalAnimating(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setIsModalAnimating(false);
        setCurrentAppointment(null);
        setIsLoading(false);

        if (timeChanged) {
          notify.success('تم تحديث الموعد بنجاح - سيتم إعادة ترتيب المواعيد حسب التوقيت الجديد');
        } else {
          notify.success('تم تحديث الموعد بنجاح');
        }
      }, 300);
    } catch (error) {
      notify.error('حدث خطأ أثناء تحديث الموعد');
      setIsLoading(false);
    }
  };

  // Appointment columns for table with actions instead of status
  const appointmentColumns: Array<{
    header: string;
    accessor: (appointment: Appointment) => any;
    className?: string;
  }> = [
    {
      header: 'الوقت',
      accessor: (appointment: Appointment) => appointment.time,
      className: 'font-medium text-gray-900'
    },
    {
      header: 'المريض',
      accessor: (appointment: Appointment) => {
        const patient = allPatients.find(p => p.id === appointment.patientId);
        const patientName = patient?.name || appointment.patientName || 'غير محدد';

        // إذا كان مريض جديد، عرض الاسم باللون الأحمر وبدون رابط
        if (appointment.isNewPatient || appointment.patientId === 0) {
          return (
            <span className="text-red-600 font-medium">{patientName} (جديد)</span>
          );
        }

        // إذا كان مريض موجود، عرض الاسم كرابط
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/patients/${appointment.patientId}`;
            }}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
          >
            {patientName}
          </button>
        );
      }
    },
    {
      header: 'الطبيب',
      accessor: (appointment: Appointment) => {
        const doctor = allDoctors.find(d => d.id === appointment.doctorId);
        return doctor?.name || appointment.doctorName || 'غير محدد';
      }
    },
    {
      header: 'نوع العلاج',
      accessor: (appointment: Appointment) => appointment.treatmentType || appointment.treatment
    },
    {
      header: 'حالة الحجز',
      accessor: (appointment: Appointment) => {
        const s = appointment.status;
        if (s === 'scheduled') return 'مجدول';
        if (s === 'waiting_list') return 'قائمة الانتظار';
        if (s === 'completed') return 'منفذ';
        if (s === 'cancelled') return 'ملغى';
        return s;
      }
    },
    {
      header: 'الإجراءات',
      accessor: (appointment: Appointment) => (
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditAppointment(appointment);
            }}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="تعديل الموعد"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAppointment(appointment.id);
            }}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="حذف الموعد"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="px-6 space-y-8">


        {/* Header */}
        <div className="flex justify-start items-center" style={{ marginTop: '25px' }}>
          <div className="flex space-x-3 rtl:space-x-reverse" style={{ marginTop: '10px' }}>
            <button
              onClick={handleAddAppointment}
              className="flex items-center px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-white transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
              }}
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة موعد لمريض موجود
            </button>
            <button
              onClick={handleAddNewPatient}
              className="flex items-center px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-white transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)'
              }}
            >
              <UserPlusIcon className="h-5 w-5 ml-2" />
              موعد لمريض جديد
            </button>
          </div>
        </div>

        {/* Optimized Calendar */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          {optimizedError ? (
            <div className="p-8 text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">خطأ في تحميل التقويم</h3>
              <p className="text-gray-600 mb-4">{optimizedError}</p>
              <button
                onClick={refreshOptimized}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <OptimizedCalendar
              currentDate={calendarState.currentDate}
              selectedDate={calendarState.selectedDate}
              calendarDays={getVisibleCalendarDays()}
              onDateSelect={selectDate}
              onNavigate={navigateCalendar}
              isLoading={isOptimizedLoading}
            />
          )}
        </div>

        {/* Selected Day Appointments Table */}
        <div className="card animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <div className="p-8">
            {/* مؤشر التحديث */}
            {isRefreshing && (
              <div className="mb-4 bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                <span className="text-blue-800 text-sm">جاري تحديث المواعيد...</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl ml-3">
                  <ClipboardDocumentListIcon className="h-6 w-6" style={{ color: '#8A85B3' }} />
                </div>
                مواعيد {format(new Date(calendarState.selectedDate), 'EEEE d MMMM', { locale: ar })}
              </h2>

              {selectedDayAppointments.length > 0 && (
                <div className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)' }}>
                  {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'موعد' : 'مواعيد'}
                </div>
              )}
            </div>

            <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
              <Table
                columns={appointmentColumns}
                data={selectedDayAppointments}
                keyExtractor={(item) => item.id}
                emptyMessage="لا توجد مواعيد في هذا اليوم"
              />
            </div>
          </div>
        </div>

        {/* Add Appointment Modal */}
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
                      {isNewPatientAppointment ? 'إضافة موعد لمريض جديد' : 'إضافة موعد لمريض موجود'}
                    </h3>
                    {isNewPatientAppointment && (
                      <p className="text-sm text-red-600 mt-1">
                        سيتم عرض اسم المريض باللون الأحمر في الجدول
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseAddModal}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label htmlFor="patientInput" className="block text-sm font-medium text-gray-700 mb-1">
                        المريض <span className="text-red-500">*</span>
                        {isNewPatientAppointment && (
                          <span className="text-red-600 text-xs mr-2">(مريض جديد)</span>
                        )}
                      </label>

                      {isNewPatientAppointment ? (
                        // إدخال مباشر لاسم المريض الجديد
                        <input
                          id="newPatientName"
                          name="newPatientName"
                          type="text"
                          value={newPatientName}
                          onChange={(e) => {
                            const value = e.target.value;
                            // السماح بالكتابة فقط إذا كان النص عربي أو فارغ
                            if (value === '' || isArabicOnly(value)) {
                              setNewPatientName(value);
                            }
                          }}
                          placeholder="اسم المريض الجديد (عربي فقط)..."
                          className="block w-full rounded-lg border-2 border-red-200 shadow-sm focus:border-red-500 focus:ring-red-500 text-sm h-10 px-3 bg-red-50"
                          required
                          dir="rtl"
                        />
                      ) : (
                        // البحث في المرضى الموجودين
                        <>
                          <input
                            id="patientSearch"
                            name="patientSearch"
                            type="text"
                            value={patientSearchTerm}
                            onChange={(e) => {
                              const value = e.target.value;
                              // السماح بالكتابة فقط إذا كان النص عربي أو فارغ
                              if (value === '' || isArabicOnly(value)) {
                                setPatientSearchTerm(value);
                                setShowPatientDropdown(value.length > 0);
                              }
                            }}
                            onFocus={() => setShowPatientDropdown(patientSearchTerm.length > 0)}
                            onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                            placeholder="ابحث عن المريض (عربي فقط)..."
                            className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                            required
                            dir="rtl"
                          />
                          {showPatientDropdown && patientSearchTerm.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {filteredPatients.length > 0 ? (
                                filteredPatients.slice(0, 5).map(patient => (
                                  <div
                                    key={patient.id}
                                    onClick={() => handlePatientSelect(patient)}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 last:rounded-b-lg"
                                  >
                                    {patient.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                  لا توجد نتائج مطابقة
                                  <div className="text-xs text-red-600 mt-1">
                                    استخدم "موعد لمريض جديد" لإضافة مريض جديد
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
                        الطبيب {isNewPatientAppointment && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        id="doctorId"
                        name="doctorId"
                        value={newAppointment.doctorId}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, doctorId: e.target.value }))}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                        required={isNewPatientAppointment}
                      >
                        <option value="">اختر الطبيب</option>
                        {activeDoctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      التاريخ <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative day-dropdown">
                        <button
                          type="button"
                          onClick={() => setShowDayDropdown(!showDayDropdown)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3 text-right bg-white hover:bg-gray-50"
                        >
                          {newAppointment.day}
                          <span className="float-left mt-1">▼</span>
                        </button>
                        {showDayDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-2">
                            <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setNewAppointment(prev => ({ ...prev, day: day.toString() }));
                                    setShowDayDropdown(false);
                                  }}
                                  className={`p-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                                    newAppointment.day === day.toString() ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <select
                          value={newAppointment.month}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, month: e.target.value }))}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={newAppointment.year}
                          onChange={(e) => setNewAppointment(prev => ({ ...prev, year: e.target.value }))}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          {Array.from({ length: 2 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوقت <span className="text-red-500">*</span>
                    </label>
                    {addModalSlots.length > 0 ? (
                      <select
                        value={newAppointment.time}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, time: e.target.value }))}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      >
                        {addModalSlots.map(slot => (
                          <option key={slot.time} value={slot.time}>{slot.time}</option>
                        ))}
                      </select>
                    ) : addModalIsWorkingDay ? (
                      <p className="text-sm text-amber-600">لا توجد فترات لهذا اليوم. تحقق من ساعات العمل في الإعدادات.</p>
                    ) : (
                      <p className="text-sm text-amber-600">هذا اليوم عطلة أو غير ضمن أيام العمل.</p>
                    )}
                    {addModalSlots.length === 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <select value={newAppointment.hour} onChange={(e) => setNewAppointment(prev => ({ ...prev, hour: e.target.value }))} className="rounded border px-2 py-1.5 text-sm">
                          {newAppointment.period === 'صباحاً' ? [1,2,3,4,5,6,7,8,9,10,11].map(h => <option key={h} value={h}>{h}</option>) : [12,1,2,3,4,5,6,7,8,9,10,11].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <select value={newAppointment.minute} onChange={(e) => setNewAppointment(prev => ({ ...prev, minute: e.target.value }))} className="rounded border px-2 py-1.5 text-sm">
                          <option value="00">00</option><option value="30">30</option>
                        </select>
                        <select value={newAppointment.period} onChange={(e) => setNewAppointment(prev => ({ ...prev, period: e.target.value as 'صباحاً'|'مساءً' }))} className="rounded border px-2 py-1.5 text-sm">
                          <option value="صباحاً">صباحاً</option><option value="مساءً">مساءً</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-1">نوع العلاج</label>
                      <select
                        id="treatment"
                        name="treatment"
                        value={newAppointment.treatmentType}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewAppointment(prev => ({ ...prev, treatmentType: v, treatment: v === 'Examination' ? 'فحص' : v }));
                        }}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      >
                        <option value="Examination">فحص (Examination)</option>
                        {procedureGroups.map(g => (
                          <option key={g.id} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">حالة الحجز</label>
                      <select
                        value={newAppointment.status}
                        onChange={(e) => setNewAppointment(prev => ({ ...prev, status: e.target.value as Appointment['status'] }))}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      >
                        <option value="scheduled">مجدول</option>
                        <option value="waiting_list">قائمة الانتظار</option>
                        <option value="completed">منفذ</option>
                        <option value="cancelled">ملغى</option>
                      </select>
                    </div>
                  </div>


                </div>

                <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                    onClick={handleCloseAddModal}
                    disabled={isLoading}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white ${
                      ((!isNewPatientAppointment && !newAppointment.patientId) ||
                       (isNewPatientAppointment && (!newPatientName.trim() || !newAppointment.doctorId)) ||
                       !newAppointment.day || (addModalSlots.length > 0 ? !newAppointment.time : !newAppointment.hour) || isLoading)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}
                    onClick={handleSaveAppointment}
                    disabled={(!isNewPatientAppointment && !newAppointment.patientId) ||
                             (isNewPatientAppointment && (!newPatientName.trim() || !newAppointment.doctorId)) ||
                             !newAppointment.day || (addModalSlots.length > 0 ? !newAppointment.time : !newAppointment.hour) || isLoading}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'إضافة الموعد'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Appointment Modal */}
        {isEditModalOpen && currentAppointment && (
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
                    <h3 className="text-xl font-bold text-gray-800">تعديل الموعد</h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalAnimating(true);
                      setTimeout(() => {
                        setIsEditModalOpen(false);
                        setIsModalAnimating(false);
                        setCurrentAppointment(null);
                      }, 300);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        المريض
                      </label>
                      <input
                        type="text"
                        value={currentAppointment.patientName || ''}
                        disabled
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm bg-gray-100 text-gray-500 text-sm h-10 px-3"
                      />
                    </div>

                    <div>
                      <label htmlFor="editDoctorId" className="block text-sm font-medium text-gray-700 mb-1">
                        الطبيب
                      </label>
                      <select
                        id="editDoctorId"
                        name="editDoctorId"
                        value={currentAppointment.doctorId || ''}
                        onChange={(e) => {
                          const doctor = activeDoctors.find(d => d.id === parseInt(e.target.value));
                          setCurrentAppointment(prev => prev ? ({
                            ...prev,
                            doctorId: e.target.value ? parseInt(e.target.value) : undefined,
                            doctorName: doctor?.name || ''
                          }) : null);
                        }}
                        className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                      >
                        <option value="">اختر الطبيب</option>
                        {activeDoctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      التاريخ <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative day-dropdown">
                        <button
                          type="button"
                          onClick={() => setShowDayDropdown(!showDayDropdown)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3 text-right bg-white hover:bg-gray-50"
                        >
                          {currentAppointment.day}
                          <span className="float-left mt-1">▼</span>
                        </button>
                        {showDayDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-2">
                            <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setCurrentAppointment(prev => prev ? ({ ...prev, day: day.toString() }) : null);
                                    setShowDayDropdown(false);
                                  }}
                                  className={`p-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                                    currentAppointment.day === day.toString() ? 'bg-blue-100 text-blue-600 font-bold' : 'text-gray-700'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <select
                          value={currentAppointment.month}
                          onChange={(e) => setCurrentAppointment(prev => prev ? ({ ...prev, month: e.target.value }) : null)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={currentAppointment.year}
                          onChange={(e) => setCurrentAppointment(prev => prev ? ({ ...prev, year: e.target.value }) : null)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          {Array.from({ length: 2 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوقت <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <select
                          value={currentAppointment.hour}
                          onChange={(e) => setCurrentAppointment(prev => prev ? ({ ...prev, hour: e.target.value }) : null)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          {currentAppointment.period === 'صباحاً'
                            ? Array.from({ length: 11 }, (_, i) => i + 1).map(hour => (
                                <option key={hour} value={hour}>{hour}</option>
                              ))
                            : [12, ...Array.from({ length: 11 }, (_, i) => i + 1)].map(hour => (
                                <option key={hour} value={hour}>{hour}</option>
                              ))
                          }
                        </select>
                      </div>
                      <div>
                        <select
                          value={currentAppointment.minute}
                          onChange={(e) => setCurrentAppointment(prev => prev ? ({ ...prev, minute: e.target.value }) : null)}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={currentAppointment.period}
                          onChange={(e) => {
                            const newPeriod = e.target.value;
                            setCurrentAppointment(prev => prev ? ({
                              ...prev,
                              period: newPeriod,
                              // إعادة تعيين الساعة إلى قيمة صالحة للفترة الجديدة
                              hour: newPeriod === 'صباحاً' ? '9' : '12'
                            }) : null);
                          }}
                          className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3"
                          size={1}
                        >
                          <option value="صباحاً">صباحاً</option>
                          <option value="مساءً">مساءً</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="editTreatment" className="block text-sm font-medium text-gray-700 mb-1">
                      العلاج
                    </label>
                    <select
                      id="editTreatment"
                      name="editTreatment"
                      value={currentAppointment.treatment}
                      onChange={(e) => setCurrentAppointment(prev => prev ? ({ ...prev, treatment: e.target.value }) : null)}
                      className="block w-full rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm h-10 px-3 treatment-select"
                    >
                      <option value="فحص">فحص</option>
                      {treatmentTemplates.map(treatment => (
                        <option key={treatment.id} value={treatment.name}>
                          {treatment.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-4 rtl:space-x-reverse pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-2 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                    onClick={() => {
                      setIsModalAnimating(true);
                      setTimeout(() => {
                        setIsEditModalOpen(false);
                        setIsModalAnimating(false);
                        setCurrentAppointment(null);
                      }, 300);
                    }}
                    disabled={isLoading}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-2 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white ${
                      (!currentAppointment.day || !currentAppointment.hour || isLoading)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                    }}
                    onClick={handleUpdateAppointment}
                    disabled={!currentAppointment.day || !currentAppointment.hour || isLoading}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
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
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Appointments;