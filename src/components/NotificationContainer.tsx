import React, { useEffect, useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNotificationStore, type Notification, type NotificationType } from '../store/notificationStore';

// مكون الإشعار الواحد
interface NotificationItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // تأثير الظهور
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // دالة إزالة الإشعار مع أنيميشن
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  // الحصول على أيقونة ولون الإشعار
  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          bgColor: 'bg-green-500',
          borderColor: 'border-green-400',
          iconColor: 'text-white'
        };
      case 'error':
        return {
          icon: XCircleIcon,
          bgColor: 'bg-red-500',
          borderColor: 'border-red-400',
          iconColor: 'text-white'
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-400',
          iconColor: 'text-white'
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-500',
          borderColor: 'border-yellow-400',
          iconColor: 'text-white'
        };
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-400',
          iconColor: 'text-white'
        };
    }
  };

  const config = getNotificationConfig(notification.type);
  const IconComponent = config.icon;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        ${config.bgColor} ${config.borderColor}
        border-r-4 rounded-lg shadow-lg backdrop-blur-sm
        p-4 max-w-sm w-full
        flex items-start space-x-3 rtl:space-x-reverse
      `}>
        {/* الأيقونة */}
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        {/* المحتوى */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {notification.title}
          </p>
          {notification.message && (
            <p className="mt-1 text-sm text-white opacity-90">
              {notification.message}
            </p>
          )}
        </div>

        {/* زر الإغلاق */}
        <div className="flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition-colors duration-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// مكون حاوي الإشعارات
const NotificationContainer: React.FC = React.memo(() => {
  const {
    notifications,
    persistentNotifications,
    removeNotification,
    removePersistentNotification
  } = useNotificationStore();

  // إذا لم تكن هناك إشعارات، لا نعرض شيئاً
  if (notifications.length === 0 && persistentNotifications.length === 0) {
    return null;
  }

  return (
    <>
      {/* الإشعارات العادية - أعلى يمين */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={removeNotification}
              />
            ))}
          </div>
        </div>
      )}

      {/* الإشعارات المستمرة - أعلى وسط */}
      {persistentNotifications.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            {persistentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={removePersistentNotification}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
});

NotificationContainer.displayName = 'NotificationContainer';

export default NotificationContainer;
