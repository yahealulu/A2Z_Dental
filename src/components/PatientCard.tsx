import React from 'react';
import {
  PhoneIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface PatientCardProps {
  id: string | number;
  name: string;
  phone: string;
  birthdate?: string;
  lastVisit?: string;
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

const PatientCard = React.memo(({
  id,
  name,
  phone,
  birthdate,
  lastVisit,
  onEdit,
  onDelete
}: PatientCardProps) => {
  // حساب العمر من سنة الميلاد فقط
  const calculateAge = (birthdate?: string): string => {
    if (!birthdate) return '';

    // استخراج سنة الميلاد فقط
    const birthYear = parseInt(birthdate.substring(0, 4));
    const currentYear = new Date().getFullYear();

    // حساب العمر بناءً على السنة فقط
    const age = currentYear - birthYear;

    return age.toString();
  };

  const age = calculateAge(birthdate);

  return (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden border border-gray-100 group">
      {/* شريط علوي مع اللون الجديد */}
      <div className="w-full h-2" style={{ backgroundColor: '#37839F' }}></div>

      <div className="p-6">
        {/* رأس البطاقة */}
        <div className="flex justify-between">
          <div className="flex items-start">
            {/* أيقونة المستخدم */}
            <div className="p-2.5 rounded-full mr-3" style={{ backgroundColor: 'rgba(55, 131, 159, 0.1)' }}>
              <UserIcon className="h-6 w-6" style={{ color: '#37839F' }} />
            </div>

            <div className="mr-2.5">
              <Link
                to={`/patients/${id}`}
                className="text-lg font-bold hover:underline decoration-2 underline-offset-2"
                style={{ color: '#37839F' }}
              >
                {name}
              </Link>
              {age && (
                <div className="flex items-center mt-1.5 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">
                    العمر: {age} سنة
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* أزرار التعديل والحذف */}
          <div className="flex space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => onEdit(id)}
              className="p-2 rounded-full text-gray-400 focus:outline-none"
              style={{ color: '#9CA3AF', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#37839F';
                e.currentTarget.style.backgroundColor = 'rgba(55, 131, 159, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9CA3AF';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="تعديل"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none"
              aria-label="حذف"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* معلومات الاتصال */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center text-base font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
            <PhoneIcon className="h-5 w-5 ml-2" style={{ color: '#37839F' }} />
            <span>{phone}</span>
          </div>
        </div>

        {/* آخر زيارة */}
        {lastVisit && (
          <div className="mt-5 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 ml-2" style={{ color: '#37839F' }} />
              <p className="text-sm text-gray-600">
                آخر زيارة: <span className="font-medium text-gray-800">{lastVisit}</span>
              </p>
            </div>
          </div>
        )}

        {/* زر عرض التفاصيل */}
        <div className="mt-5 text-center">
          <Link
            to={`/patients/${id}`}
            className="inline-block w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg shadow-button focus:outline-none"
            style={{
              background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
            }}
          >
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </div>
  );
});

PatientCard.displayName = 'PatientCard';

export default PatientCard;
