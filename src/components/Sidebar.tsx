
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  UserIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isMobile, isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'الرئيسية', icon: HomeIcon },
    { path: '/patients', name: 'المرضى', icon: UserGroupIcon },
    { path: '/appointments', name: 'المواعيد', icon: CalendarIcon },
    { path: '/treatments', name: 'قوالب العلاجات', icon: ClipboardDocumentListIcon },
    { path: '/patient-payments', name: 'دفعات المرضى', icon: BanknotesIcon },
    { path: '/revenue', name: 'الإيرادات', icon: ArrowTrendingUpIcon },
    { path: '/expenses', name: 'مصاريف العيادة', icon: BanknotesIcon },
    { path: '/doctors', name: 'الأطباء', icon: UserIcon },
    { path: '/lab-requests', name: 'طلبات المخبر', icon: BeakerIcon },
    { path: '/settings', name: 'الإعدادات', icon: Cog6ToothIcon },
  ];

  const handleItemClick = () => {
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* زر القائمة للجوال مع تأثيرات محسنة */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow-button hover:shadow-button-hover transition-all duration-300 transform hover:scale-110"
          aria-label="فتح القائمة"
        >
          <Bars3Icon className="h-6 w-6 text-primary-600" />
        </button>
      )}

      {/* خلفية الشريط الجانبي للجوال مع تأثير ضبابي */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-gray-700 bg-opacity-50 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* الشريط الجانبي مع تأثيرات محسنة */}
      <div
        className={`
          fixed top-0 right-0 h-full bg-white shadow-card-hover z-50
          transition-all duration-400 ease-in-out
          w-64 border-l border-gray-100
          ${isMobile && !isOpen ? 'translate-x-full' : 'translate-x-0'}
        `}
      >
        {/* زر الإغلاق للجوال مع تأثيرات محسنة */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-all duration-300 transform hover:rotate-90"
            aria-label="إغلاق القائمة"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        )}

        {/* الشعار */}
        <div className="flex items-center justify-center h-24 border-b border-gray-100 bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl font-black mb-1 tracking-wider" style={{ background: 'linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(138, 133, 179, 1) 50%, rgba(164, 114, 174, 1) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ATZ
            </div>
            <div className="text-xl font-bold tracking-wide" style={{ background: 'linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(138, 133, 179, 1) 50%, rgba(164, 114, 174, 1) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Dental Clinic
            </div>
          </div>
        </div>

        {/* عناصر القائمة مع تأثيرات محسنة */}
        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleItemClick}
              className={`
                flex items-center px-4 py-3 rounded-lg text-base font-semibold
                transition-all duration-300 group relative overflow-hidden
                ${location.pathname === item.path
                  ? 'bg-gradient-to-l from-primary-100 to-primary-50 text-primary-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'}
              `}
            >
              {/* مؤشر العنصر النشط */}
              {location.pathname === item.path && (
                <span className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-lg"></span>
              )}

              <item.icon className={`
                flex-shrink-0 h-6 w-6 ml-3 transition-all duration-300 transform group-hover:scale-110
                ${location.pathname === item.path ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'}
              `} />
              <span className="transition-all duration-300 group-hover:translate-x-1">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        {/* معلومات إضافية في أسفل الشريط الجانبي */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-500">
          <p>إصدار 1.0.0</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
