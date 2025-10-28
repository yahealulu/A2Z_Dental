import { create } from 'zustand';

// تعريف أنواع الإشعارات
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

// تعريف نموذج الإشعار
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // بالميلي ثانية، افتراضي 2000 (ثانيتين)
  createdAt: number;
  persistent?: boolean; // إشعار مستمر لا يختفي تلقائياً
}

// واجهة حالة المتجر
interface NotificationState {
  notifications: Notification[];
  persistentNotifications: Notification[]; // إشعارات مستمرة منفصلة

  // الأفعال الأساسية
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // أفعال الإشعارات المستمرة
  addPersistentNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'persistent'>) => string;
  removePersistentNotification: (id: string) => void;
  clearPersistentNotifications: () => void;

  // أفعال مخصصة لأنواع الإشعارات
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;

  // أفعال مخصصة للإشعارات المستمرة
  showPersistentInfo: (title: string, message?: string) => string;
  showPersistentWarning: (title: string, message?: string) => string;
}

// إنشاء معرف فريد للإشعار
const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// إنشاء المتجر
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  persistentNotifications: [],

  // إضافة إشعار جديد
  addNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration || 2000
    };

    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // إزالة الإشعار تلقائياً بعد المدة المحددة (إلا إذا كان مستمراً)
    if (!newNotification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  // إزالة إشعار محدد
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(notification => notification.id !== id)
    }));
  },

  // مسح جميع الإشعارات
  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // إضافة إشعار مستمر
  addPersistentNotification: (notification) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      persistent: true
    };

    set(state => ({
      persistentNotifications: [...state.persistentNotifications, newNotification]
    }));

    return id;
  },

  // إزالة إشعار مستمر محدد
  removePersistentNotification: (id) => {
    set(state => ({
      persistentNotifications: state.persistentNotifications.filter(notification => notification.id !== id)
    }));
  },

  // مسح جميع الإشعارات المستمرة
  clearPersistentNotifications: () => {
    set({ persistentNotifications: [] });
  },

  // إشعار نجاح (أخضر)
  showSuccess: (title, message, duration) => {
    return get().addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  },

  // إشعار خطأ (أحمر)
  showError: (title, message, duration) => {
    return get().addNotification({
      type: 'error',
      title,
      message,
      duration
    });
  },

  // إشعار معلومات (أزرق)
  showInfo: (title, message, duration) => {
    return get().addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  },

  // إشعار تحذير (أصفر)
  showWarning: (title, message, duration) => {
    return get().addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  },

  // إشعار معلومات مستمر
  showPersistentInfo: (title, message) => {
    return get().addPersistentNotification({
      type: 'info',
      title,
      message
    });
  },

  // إشعار تحذير مستمر
  showPersistentWarning: (title, message) => {
    return get().addPersistentNotification({
      type: 'warning',
      title,
      message
    });
  }
}));

// دوال مساعدة للاستخدام السريع
export const notify = {
  success: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().showSuccess(title, message, duration),

  error: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().showError(title, message, duration),

  info: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().showInfo(title, message, duration),

  warning: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().showWarning(title, message, duration),

  // إشعارات مستمرة
  persistentInfo: (title: string, message?: string) =>
    useNotificationStore.getState().showPersistentInfo(title, message),

  persistentWarning: (title: string, message?: string) =>
    useNotificationStore.getState().showPersistentWarning(title, message),

  // إزالة إشعار مستمر
  removePersistent: (id: string) =>
    useNotificationStore.getState().removePersistentNotification(id)
};
