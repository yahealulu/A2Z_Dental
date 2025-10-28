import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'warning',
  isLoading = false
}: ConfirmationModalProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmButtonStyle: {
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            color: 'white'
          }
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmButtonStyle: {
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white'
          }
        };
      case 'info':
        return {
          icon: CheckCircleIcon,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButtonStyle: {
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white'
          }
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmButtonStyle: {
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: 'white'
          }
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
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
      onClick={handleClose}
    >
      {/* المودال */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-6 transform transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-xl hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* محتوى المودال */}
        <div className="p-8">
          {/* الأيقونة */}
          <div className="flex items-center justify-center mb-6">
            <div className={`rounded-full p-4 ${config.iconBg}`}>
              <IconComponent className={`h-10 w-10 ${config.iconColor}`} />
            </div>
          </div>

          {/* العنوان */}
          <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
            {title}
          </h3>

          {/* الرسالة */}
          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {message}
          </p>

          {/* الأزرار */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-bold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:scale-105"
              style={config.confirmButtonStyle}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';

export default ConfirmationModal;
