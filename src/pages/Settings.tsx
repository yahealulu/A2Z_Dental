import React, { useState, useRef } from 'react';
import {
  Cog6ToothIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSettingsStore } from '../store/settingsStore';
import { notify } from '../store/notificationStore';

const DAYS_OPTIONS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

const Settings = () => {
  const { settings, updateClinicInfo, updateWorkingHours, updateWorkingDays, updateAppointmentDuration } = useSettingsStore();
  const [activeSection, setActiveSection] = useState<'clinic' | 'schedule' | 'holidays'>('clinic');

  // Clinic form
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [clinicAddress, setClinicAddress] = useState(settings.clinicAddress);
  const [clinicPhone, setClinicPhone] = useState(settings.clinicPhone);
  const [clinicEmail, setClinicEmail] = useState(settings.clinicEmail ?? '');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Schedule form
  const [workingDays, setWorkingDays] = useState<string[]>(settings.workingDays);
  const [startTime, setStartTime] = useState(settings.workingHours.start);
  const [endTime, setEndTime] = useState(settings.workingHours.end);
  const [duration, setDuration] = useState(settings.appointmentDuration);

  // Holidays
  const [holidayDate, setHolidayDate] = useState('');
  const [holidays, setHolidays] = useState<string[]>(settings.holidays);

  const handleSaveClinic = async () => {
    const ok = await updateClinicInfo({
      clinicName: clinicName.trim(),
      clinicAddress: clinicAddress.trim(),
      clinicPhone: clinicPhone.trim(),
      clinicEmail: clinicEmail.trim() || undefined
    });
    if (ok) notify.success('تم حفظ بيانات العيادة');
    else notify.error('فشل الحفظ');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      notify.error('يرجى اختيار ملف صورة');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateClinicInfo({ clinicLogo: dataUrl });
      notify.success('تم رفع الشعار');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveSchedule = async () => {
    const ok =
      (await updateWorkingHours({ start: startTime, end: endTime })) &&
      (await updateWorkingDays(workingDays)) &&
      (await updateAppointmentDuration(duration));
    if (ok) notify.success('تم حفظ أوقات العمل');
    else notify.error('فشل الحفظ');
  };

  const toggleDay = (day: string) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAddHoliday = () => {
    if (!holidayDate.trim()) return;
    if (holidays.includes(holidayDate)) {
      notify.error('التاريخ مضاف مسبقاً');
      return;
    }
    setHolidays(prev => [...prev, holidayDate].sort());
    setHolidayDate('');
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(prev => prev.filter(d => d !== date));
  };

  const handleSaveHolidays = async () => {
    const ok = await useSettingsStore.getState().updateHolidays(holidays);
    if (ok) notify.success('تم حفظ العطل');
    else notify.error('فشل الحفظ');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-8 w-8 text-blue-600 ml-3" />
          <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        </div>
        <p className="text-gray-600">إعدادات العيادة وأوقات العمل والمواعيد</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'clinic' as const, label: 'بيانات العيادة', icon: BuildingOffice2Icon },
          { id: 'schedule' as const, label: 'أوقات العمل', icon: CalendarDaysIcon },
          { id: 'holidays' as const, label: 'العطل', icon: CalendarIcon }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
              activeSection === id
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      {/* Clinic section */}
      {activeSection === 'clinic' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">بيانات العيادة والشعار</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم العيادة</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="اسم العيادة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={e => setClinicAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="العنوان"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                <input
                  type="text"
                  value={clinicPhone}
                  onChange={e => setClinicPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="رقم الهاتف"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={clinicEmail}
                  onChange={e => setClinicEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="example@clinic.com"
                />
              </div>
              <button
                onClick={handleSaveClinic}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                حفظ بيانات العيادة
              </button>
            </div>
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">شعار العيادة (للفواتير)</label>
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors overflow-hidden"
              >
                {settings.clinicLogo ? (
                  <img src={settings.clinicLogo} alt="شعار العيادة" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-gray-400 p-2">
                    <PhotoIcon className="h-12 w-12 mx-auto mb-1" />
                    <span className="text-xs">اضغط لرفع شعار</span>
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Schedule section */}
      {activeSection === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">أيام وساعات العمل</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OPTIONS.map(day => (
                <label key={day} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">بداية الدوام</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نهاية الدوام</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مدة الموعد (دقيقة)</label>
              <input
                type="number"
                min={15}
                max={180}
                value={duration}
                onChange={e => setDuration(Number(e.target.value) || 30)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            المواعيد ستُعرض على أساس فترات نصف ساعة ضمن أوقات الدوام أعلاه.
          </p>
          <button
            onClick={handleSaveSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ClockIcon className="h-5 w-5" />
            حفظ أوقات العمل
          </button>
        </div>
      )}

      {/* Holidays section */}
      {activeSection === 'holidays' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">العطل الرسمية</h2>
          <div className="flex gap-2 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إضافة عطلة</label>
              <input
                type="date"
                value={holidayDate}
                onChange={e => setHolidayDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleAddHoliday}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              إضافة
            </button>
          </div>
          <ul className="space-y-2">
            {holidays.length === 0 ? (
              <li className="text-gray-500 text-sm">لا توجد عطل مضافة</li>
            ) : (
              holidays.map(date => (
                <li key={date} className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span>{date}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHoliday(date)}
                    className="text-red-600 hover:text-red-700 p-1"
                    aria-label="حذف"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <button
            onClick={handleSaveHolidays}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            حفظ العطل
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
