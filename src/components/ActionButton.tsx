import React from 'react';

interface ActionButtonProps {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}

const ActionButton = React.memo(({
  label,
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  iconPosition = 'right',
  disabled = false
}: ActionButtonProps) => {

  // تحسين ألوان الأزرار مع تدرجات لونية
  const variantClasses = {
    primary: 'bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:ring-primary-500 text-white border-transparent',
    secondary: 'bg-gradient-to-l from-gray-200 to-gray-100 hover:from-gray-300 hover:to-gray-200 focus:ring-gray-500 text-gray-700 border-gray-300',
    danger: 'bg-gradient-to-l from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:ring-red-500 text-white border-transparent',
    success: 'bg-gradient-to-l from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:ring-green-500 text-white border-transparent',
    warning: 'bg-gradient-to-l from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 focus:ring-yellow-500 text-white border-transparent'
  };

  // تحسين أحجام الأزرار مع زوايا مدورة أفضل
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3.5 text-base rounded-xl'
  };

  // تحسين أحجام الأيقونات
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // تحسين المسافات بين الأيقونات والنص
  const iconSpacing = iconPosition === 'right'
    ? 'ml-2 -mr-0.5 rtl:mr-2 rtl:-ml-0.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5'
    : 'mr-2 -ml-0.5 rtl:ml-2 rtl:-mr-0.5 transition-transform duration-300 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5';

  // تأثير التعطيل
  const disabledClasses = disabled
    ? 'opacity-60 cursor-not-allowed'
    : 'transform hover:scale-[1.02] active:scale-[0.98]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center border font-bold
        shadow-button hover:shadow-button-hover transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}
      `}
    >
      {iconPosition === 'left' && (
        <Icon
          className={`${iconSizes[size]} ${iconSpacing}`}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">{label}</span>
      {iconPosition === 'right' && (
        <Icon
          className={`${iconSizes[size]} ${iconSpacing}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

export default ActionButton;
