import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// تعريف نموذج الإعدادات
export interface Settings {
  // إعدادات العيادة
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail?: string;
  clinicLogo?: string;

  // إعدادات العمل
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  appointmentDuration: number; // بالدقائق

  // إعدادات المواعيد
  allowOnlineBooking: boolean;
  requireConfirmation: boolean;
  reminderSettings: {
    enabled: boolean;
    daysBefore: number;
    method: 'sms' | 'email' | 'both';
  };

  // إعدادات الدفع
  currency: string;
  taxRate: number;
  paymentMethods: string[];

  // إعدادات النظام
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'auto';
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  timeFormat: '12h' | '24h';

  // إعدادات النسخ الاحتياطي
  autoBackup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    lastBackup?: string;
  };

  // إعدادات الأمان
  sessionTimeout: number; // بالدقائق
  requirePasswordChange: boolean;
  passwordChangeInterval: number; // بالأيام

  // إعدادات الإشعارات
  notifications: {
    appointments: boolean;
    payments: boolean;
    reminders: boolean;
    system: boolean;
  };

  // إعدادات التقارير
  defaultReportPeriod: 'week' | 'month' | 'quarter' | 'year';
  includeInactiveData: boolean;

  // معلومات النظام
  version: string;
  lastUpdated?: string;
  createdAt?: string;
}

// الإعدادات الافتراضية
const DEFAULT_SETTINGS: Settings = {
  // إعدادات العيادة
  clinicName: 'عيادة الأسنان',
  clinicAddress: '',
  clinicPhone: '',
  clinicEmail: '',

  // إعدادات العمل
  workingHours: {
    start: '08:00',
    end: '18:00'
  },
  workingDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  appointmentDuration: 30,

  // إعدادات المواعيد
  allowOnlineBooking: false,
  requireConfirmation: true,
  reminderSettings: {
    enabled: true,
    daysBefore: 1,
    method: 'sms'
  },

  // إعدادات الدفع
  currency: 'أ.ل.س',
  taxRate: 15,
  paymentMethods: ['نقداً', 'بطاقة ائتمان', 'تحويل بنكي'],

  // إعدادات النظام
  language: 'ar',
  theme: 'light',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '24h',

  // إعدادات النسخ الاحتياطي
  autoBackup: {
    enabled: false,
    frequency: 'weekly'
  },

  // إعدادات الأمان
  sessionTimeout: 60,
  requirePasswordChange: false,
  passwordChangeInterval: 90,

  // إعدادات الإشعارات
  notifications: {
    appointments: true,
    payments: true,
    reminders: true,
    system: true
  },

  // إعدادات التقارير
  defaultReportPeriod: 'month',
  includeInactiveData: false,

  // معلومات النظام
  version: '1.0.0'
};

// واجهة حالة المتجر
interface SettingsState {
  settings: Settings;

  // الأفعال الأساسية
  updateSettings: (newSettings: Partial<Settings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;

  // إعدادات العيادة
  updateClinicInfo: (info: Partial<Pick<Settings, 'clinicName' | 'clinicAddress' | 'clinicPhone' | 'clinicEmail' | 'clinicLogo'>>) => Promise<boolean>;

  // إعدادات العمل
  updateWorkingHours: (hours: Settings['workingHours']) => Promise<boolean>;
  updateWorkingDays: (days: string[]) => Promise<boolean>;
  updateAppointmentDuration: (duration: number) => Promise<boolean>;

  // إعدادات المواعيد
  updateAppointmentSettings: (settings: Partial<Pick<Settings, 'allowOnlineBooking' | 'requireConfirmation' | 'reminderSettings'>>) => Promise<boolean>;

  // إعدادات الدفع
  updatePaymentSettings: (settings: Partial<Pick<Settings, 'currency' | 'taxRate' | 'paymentMethods'>>) => Promise<boolean>;

  // إعدادات النظام
  updateSystemSettings: (settings: Partial<Pick<Settings, 'language' | 'theme' | 'dateFormat' | 'timeFormat'>>) => Promise<boolean>;

  // إعدادات النسخ الاحتياطي
  updateBackupSettings: (settings: Settings['autoBackup']) => Promise<boolean>;
  updateLastBackupTime: () => Promise<boolean>;

  // إعدادات الأمان
  updateSecuritySettings: (settings: Partial<Pick<Settings, 'sessionTimeout' | 'requirePasswordChange' | 'passwordChangeInterval'>>) => Promise<boolean>;

  // إعدادات الإشعارات
  updateNotificationSettings: (settings: Settings['notifications']) => Promise<boolean>;

  // إعدادات التقارير
  updateReportSettings: (settings: Partial<Pick<Settings, 'defaultReportPeriod' | 'includeInactiveData'>>) => Promise<boolean>;

  // وظائف مساعدة
  getFormattedDate: (date: Date) => string;
  getFormattedTime: (date: Date) => string;
  isWorkingDay: (day: string) => boolean;
  isWorkingHour: (time: string) => boolean;

  // النسخ الاحتياطي
  exportSettings: () => string;
  importSettings: (data: string) => Promise<{ success: boolean; errors: string[] }>;
}

// وظائف مساعدة للتحقق من صحة البيانات
const validateSettingsData = (settings: Partial<Settings>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (settings.clinicName && settings.clinicName.trim().length < 2) {
    errors.push('اسم العيادة يجب أن يكون على الأقل حرفين');
  }

  if (settings.clinicPhone && !/^(05|09)\d{8}$/.test(settings.clinicPhone)) {
    errors.push('رقم هاتف العيادة يجب أن يبدأ بـ 05 أو 09 ويتكون من 10 أرقام');
  }

  if (settings.clinicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.clinicEmail)) {
    errors.push('البريد الإلكتروني للعيادة غير صحيح');
  }

  if (settings.appointmentDuration && (settings.appointmentDuration < 15 || settings.appointmentDuration > 180)) {
    errors.push('مدة الموعد يجب أن تكون بين 15 و 180 دقيقة');
  }

  if (settings.taxRate && (settings.taxRate < 0 || settings.taxRate > 100)) {
    errors.push('معدل الضريبة يجب أن يكون بين 0 و 100');
  }

  if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
    errors.push('مهلة الجلسة يجب أن تكون بين 5 و 480 دقيقة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// إنشاء المتجر
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      // الأفعال الأساسية
      updateSettings: async (newSettings) => {
        try {
          const validation = validateSettingsData(newSettings);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          set(state => ({
            settings: {
              ...state.settings,
              ...newSettings,
              lastUpdated: new Date().toISOString()
            }
          }));

          return true;
        } catch (error) {
          return false;
        }
      },

      resetSettings: async () => {
        try {
          set({
            settings: {
              ...DEFAULT_SETTINGS,
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            }
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      // إعدادات العيادة
      updateClinicInfo: async (info) => {
        return get().updateSettings(info);
      },

      // إعدادات العمل
      updateWorkingHours: async (hours) => {
        return get().updateSettings({ workingHours: hours });
      },

      updateWorkingDays: async (days) => {
        return get().updateSettings({ workingDays: days });
      },

      updateAppointmentDuration: async (duration) => {
        return get().updateSettings({ appointmentDuration: duration });
      },

      // إعدادات المواعيد
      updateAppointmentSettings: async (settings) => {
        return get().updateSettings(settings);
      },

      // إعدادات الدفع
      updatePaymentSettings: async (settings) => {
        return get().updateSettings(settings);
      },

      // إعدادات النظام
      updateSystemSettings: async (settings) => {
        return get().updateSettings(settings);
      },

      // إعدادات النسخ الاحتياطي
      updateBackupSettings: async (settings) => {
        return get().updateSettings({ autoBackup: settings });
      },

      updateLastBackupTime: async () => {
        const currentSettings = get().settings;
        return get().updateSettings({
          autoBackup: {
            ...currentSettings.autoBackup,
            lastBackup: new Date().toISOString()
          }
        });
      },

      // إعدادات الأمان
      updateSecuritySettings: async (settings) => {
        return get().updateSettings(settings);
      },

      // إعدادات الإشعارات
      updateNotificationSettings: async (settings) => {
        return get().updateSettings({ notifications: settings });
      },

      // إعدادات التقارير
      updateReportSettings: async (settings) => {
        return get().updateSettings(settings);
      },

      // وظائف مساعدة
      getFormattedDate: (date) => {
        const settings = get().settings;

        switch (settings.dateFormat) {
          case 'dd/mm/yyyy':
            return date.toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric' });
          case 'mm/dd/yyyy':
            return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
          case 'yyyy-mm-dd':
            return date.toISOString().split('T')[0];
          default:
            return date.toLocaleDateString();
        }
      },

      getFormattedTime: (date) => {
        const settings = get().settings;
        const options: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: settings.timeFormat === '12h'
        };

        return date.toLocaleTimeString(settings.language === 'ar' ? 'ar-SA' : 'en-US', options);
      },

      isWorkingDay: (day) => {
        return get().settings.workingDays.includes(day);
      },

      isWorkingHour: (time) => {
        const settings = get().settings;
        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;

        const [startHours, startMinutes] = settings.workingHours.start.split(':').map(Number);
        const startTimeInMinutes = startHours * 60 + startMinutes;

        const [endHours, endMinutes] = settings.workingHours.end.split(':').map(Number);
        const endTimeInMinutes = endHours * 60 + endMinutes;

        return timeInMinutes >= startTimeInMinutes && timeInMinutes <= endTimeInMinutes;
      },

      // النسخ الاحتياطي
      exportSettings: () => {
        const data = {
          settings: get().settings,
          exportDate: new Date().toISOString(),
          version: get().settings.version
        };
        return JSON.stringify(data, null, 2);
      },

      importSettings: async (data) => {
        try {
          const parsed = JSON.parse(data);

          if (!parsed.settings) {
            throw new Error('بيانات غير صحيحة');
          }

          const validation = validateSettingsData(parsed.settings);
          if (!validation.isValid) {
            return {
              success: false,
              errors: validation.errors
            };
          }

          set({
            settings: {
              ...DEFAULT_SETTINGS,
              ...parsed.settings,
              lastUpdated: new Date().toISOString()
            }
          });

          return {
            success: true,
            errors: []
          };
        } catch (error) {
          return {
            success: false,
            errors: ['خطأ في قراءة البيانات']
          };
        }
      }
    }),
    {
      name: 'dental-settings-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            settings: {
              ...DEFAULT_SETTINGS,
              ...persistedState.settings,
              lastUpdated: new Date().toISOString()
            }
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // تم تحميل إعدادات النظام من localStorage

          // تحديث الإعدادات إذا لم تكن موجودة
          if (!state.settings.createdAt) {
            state.settings.createdAt = new Date().toISOString();
          }
        }
      }
    }
  )
);
