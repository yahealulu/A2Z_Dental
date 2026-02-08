import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Pages - الصفحات الخفيفة يتم تحميلها مباشرة
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import PatientPayments from './pages/PatientPayments';
import Doctors from './pages/Doctors';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import PatientDetails from './pages/PatientDetails';
import SharePatient from './pages/SharePatient';

// الصفحات الثقيلة مع lazy loading
import {
  RevenueWithSuspense,
  ExpensesWithSuspense,
  PatientsWithSuspense,
  TreatmentsWithSuspense,
  LabRequestsWithSuspense
} from './components/LazyPages';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotificationContainer from './components/NotificationContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ErrorList } from './components/ErrorDisplay';

// Page titles
const pageTitles: Record<string, string> = {
  '/': 'لوحة التحكم',
  '/patients': 'المرضى',
  '/appointments': 'المواعيد',
  '/treatments': 'قوالب العلاجات',
  '/expenses': 'مصاريف العيادة',
  '/patient-payments': 'دفعات المرضى',
  '/invoices': 'الفواتير',
  '/payments': 'الدفعات',
  '/revenue': 'الإيرادات',
  '/doctors': 'الأطباء',
  '/staff': 'طاقم العيادة',
  '/lab-requests': 'طلبات المخبر',
  '/settings': 'الإعدادات'
};

// Main layout component
const MainLayout = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('لوحة التحكم');

  // Update page title based on current route
  useEffect(() => {
    setPageTitle(pageTitles[location.pathname] || 'لوحة التحكم');
  }, [location]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'mr-0' : 'mr-64'} transition-all duration-300`}>
        <Header title={pageTitle} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            {/* الصفحات الخفيفة - تحميل مباشر */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients/:id" element={<PatientDetails />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/patient-payments" element={<PatientPayments />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/settings" element={<Settings />} />

            {/* الصفحات الثقيلة - lazy loading مع Error Boundaries */}
            <Route path="/patients" element={
              <ErrorBoundary componentName="Patients" showDetails={true}>
                <PatientsWithSuspense />
              </ErrorBoundary>
            } />
            <Route path="/treatments" element={
              <ErrorBoundary componentName="Treatments" showDetails={true}>
                <TreatmentsWithSuspense />
              </ErrorBoundary>
            } />
            <Route path="/expenses" element={
              <ErrorBoundary componentName="Expenses" showDetails={true}>
                <ExpensesWithSuspense />
              </ErrorBoundary>
            } />
            <Route path="/revenue" element={
              <ErrorBoundary componentName="Revenue" showDetails={true}>
                <RevenueWithSuspense />
              </ErrorBoundary>
            } />
            <Route path="/lab-requests" element={
              <ErrorBoundary componentName="LabRequests" showDetails={true}>
                <LabRequestsWithSuspense />
              </ErrorBoundary>
            } />
          </Routes>
        </main>
      </div>

      {/* Notification Container */}
      <NotificationContainer />

      {/* عرض الأخطاء للمستخدم - فقط الأخطاء الحرجة */}
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <ErrorList maxErrors={2} showOnlyRecent={true} />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/share/:token" element={<SharePatient />} />
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
