import {
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface AppointmentCardProps {
  patientId: string | number;
  patientName: string;
  time: string;
  duration: number;
  treatment: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const AppointmentCard = ({
  patientId,
  patientName,
  time,
  duration,
  treatment,
  status
}: AppointmentCardProps) => {

  // تكوين محسن للحالات مع تأثيرات بصرية أفضل
  const statusConfig = {
    scheduled: {
      color: 'bg-blue-100 text-blue-800',
      borderColor: 'border-blue-200',
      gradientFrom: 'from-blue-600',
      gradientTo: 'to-blue-400',
      label: 'مجدول',
      icon: CalendarIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hoverBg: 'hover:bg-blue-50'
    },
    completed: {
      color: 'bg-green-100 text-green-800',
      borderColor: 'border-green-200',
      gradientFrom: 'from-green-600',
      gradientTo: 'to-green-400',
      label: 'مكتمل',
      icon: CheckCircleIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      hoverBg: 'hover:bg-green-50'
    },
    cancelled: {
      color: 'bg-red-100 text-red-800',
      borderColor: 'border-red-200',
      gradientFrom: 'from-red-600',
      gradientTo: 'to-red-400',
      label: 'ملغي',
      icon: ClockIcon,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      hoverBg: 'hover:bg-red-50'
    }
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className={`
      bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden
      border ${statusConfig[status].borderColor}
      transition-all duration-400 hover:translate-y-[-3px]
      group animate-scale-in
    `}>
      {/* شريط علوي مع تدرج لوني حسب الحالة */}
      <div className={`w-full h-2 bg-gradient-to-l ${statusConfig[status].gradientFrom} ${statusConfig[status].gradientTo}`}></div>

      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            {/* أيقونة الحالة مع تأثيرات حركية */}
            <div className={`
              ${statusConfig[status].iconBg} p-2.5 rounded-full mr-3
              transform transition-all duration-300
              group-hover:scale-110 group-hover:shadow-glow
            `}>
              <StatusIcon className={`h-5 w-5 ${statusConfig[status].iconColor} animate-bounce-light`} />
            </div>

            <div>
              {/* حالة الموعد */}
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-bold
                ${statusConfig[status].color} shadow-sm
              `}>
                {statusConfig[status].label}
              </span>

              {/* وقت الموعد */}
              <div className="mt-2 flex items-center text-sm font-medium text-gray-700">
                <ClockIcon className="h-4 w-4 ml-2 text-primary-500" />
                <span className="bg-gray-50 px-2 py-0.5 rounded-md">{time} ({duration} دقيقة)</span>
              </div>
            </div>
          </div>

          {/* زر عرض المريض */}
          <Link
            to={`/patients/${patientId}`}
            className={`
              text-primary-600 hover:text-primary-800
              bg-primary-50 hover:bg-primary-100
              px-3.5 py-1.5 rounded-full text-xs font-medium
              transition-all duration-300 transform hover:scale-105
              shadow-button hover:shadow-button-hover
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
            `}
          >
            عرض المريض
          </Link>
        </div>

        {/* معلومات المريض والعلاج */}
        <div className="mt-5 pt-3 border-t border-gray-100 space-y-3">
          {/* اسم المريض */}
          <div className={`
            flex items-center p-2 rounded-lg
            bg-gray-50 ${statusConfig[status].hoverBg}
            transition-all duration-300
          `}>
            <UserIcon className="h-5 w-5 text-primary-500 ml-2" />
            <Link
              to={`/patients/${patientId}`}
              className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors duration-300 hover:underline decoration-2 underline-offset-2"
            >
              {patientName}
            </Link>
          </div>

          {/* نوع العلاج */}
          <div className="flex items-center p-2 rounded-lg bg-gray-50 transition-all duration-300">
            <ClipboardDocumentIcon className="h-5 w-5 text-primary-500 ml-2" />
            <span className="text-sm text-gray-700">{treatment}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
