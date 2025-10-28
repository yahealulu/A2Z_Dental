import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles.css'
import App from './App'
import { usePatientStore } from './store/patientStore'
import { useTreatmentStore } from './store/treatmentStore'
import { usePaymentStore } from './store/paymentStore'
import { initializeProductionOptimizations } from './utils/productionOptimizations'

// إضافة معالج أخطاء عام
const globalErrorHandler = (event: ErrorEvent) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Global error caught:', event.error);
  }
};

window.addEventListener('error', globalErrorHandler);

// تنظيف عند إغلاق التطبيق
window.addEventListener('beforeunload', () => {
  window.removeEventListener('error', globalErrorHandler);
});

// إضافة معالج للوعود غير المعالجة
window.addEventListener('unhandledrejection', (event) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled promise rejection:', event.reason);
  }
});

// تم إزالة بيانات الاختبار - التطبيق الآن يعتمد على localStorage فقط

// تهيئة تحسينات الإنتاج
initializeProductionOptimizations();

// تهيئة قوالب العلاجات الافتراضية
const initializeTreatmentTemplates = () => {
  const treatmentStore = useTreatmentStore.getState();

  // تهيئة قوالب العلاجات الافتراضية إذا لم تكن موجودة
  if (treatmentStore.treatmentTemplates.length === 0) {
    console.log('🔄 Initializing default treatment templates...');
    treatmentStore.initializeDefaultTemplates();
    console.log('✅ Treatment templates initialized');
  }
};

// تشغيل التهيئة
initializeTreatmentTemplates();

// تنظيف stores عند إغلاق التطبيق
window.addEventListener('beforeunload', () => {
  // تنظيف stores
  usePatientStore.getState().patients = [];
  useTreatmentStore.getState().treatments = [];
  usePaymentStore.getState().payments = [];

  console.log('🧹 Stores cleaned up');
});

// تهيئة تطبيق React
const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  if (process.env.NODE_ENV === 'development') {
    console.error('Root element not found!');
  }
}
