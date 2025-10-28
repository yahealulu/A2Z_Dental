import React, { useState } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  error?: string;
  icon?: React.ElementType;
}

const FormField = React.memo(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  error,
  icon: Icon
}: FormFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  // فئات CSS المشتركة للحقول
  const baseFieldClasses = `
    mt-1 block w-full rounded-lg border-gray-300
    transition-all duration-300 ease-in-out
    ${isFocused ? 'border-primary-500 ring-2 ring-primary-100 shadow-md' : 'shadow-sm hover:border-primary-300'}
    focus:border-primary-500 focus:ring-primary-500 sm:text-sm
  `;

  // فئات CSS للحاوية الخارجية
  const containerClasses = `
    mb-5 group transition-all duration-300
    ${isFocused ? 'scale-[1.01]' : ''}
    ${error ? 'animate-shake' : ''}
  `;

  // فئات CSS للتسمية
  const labelClasses = `
    block text-sm font-medium mb-1.5 flex items-center
    ${isFocused ? 'text-primary-600' : 'text-gray-700'}
    ${error ? 'text-red-600' : ''}
    transition-colors duration-300
  `;

  // التعامل مع التركيز والخروج من الحقل
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={containerClasses}>
      <label htmlFor={name} className={labelClasses}>
        {Icon && <Icon className="h-4 w-4 ml-1.5 text-primary-500" aria-hidden="true" />}
        {label} {required && <span className="text-red-500 mr-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <div className="relative">
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={4}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${baseFieldClasses} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {isFocused && <div className="absolute inset-y-0 right-0 w-1 bg-primary-500 rounded-l-lg"></div>}
        </div>
      ) : type === 'select' ? (
        <div className="relative">
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${baseFieldClasses} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''} appearance-none pr-10`}
          >
            <option value="">اختر...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {isFocused && <div className="absolute inset-y-0 right-0 w-1 bg-primary-500 rounded-l-lg"></div>}
        </div>
      ) : (
        <div className="relative">
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${baseFieldClasses} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          {isFocused && <div className="absolute inset-y-0 right-0 w-1 bg-primary-500 rounded-l-lg"></div>}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center">
          <svg className="h-4 w-4 ml-1 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
