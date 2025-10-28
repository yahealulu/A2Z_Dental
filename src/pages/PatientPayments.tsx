import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { usePatientStore, type Patient } from '../store/patientStore';
import { useTreatmentStore } from '../store/treatmentStore';
import { usePaymentStore } from '../store/paymentStore';
import AddPaymentModal from '../components/AddPaymentModal';

// نموذج للمريض مع بيانات الدفع
interface PatientWithPayment extends Patient {
  totalCost: number;
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

const PatientPayments = () => {
  const navigate = useNavigate();
  const { patients } = usePatientStore();
  const {
    getTotalCostByPatientIdCompletedAfterClosure,
    getPaymentDistributionCompletedAfterClosure,
    getPaymentDistribution, // للعلاجات النشطة (المبدوءة)
    treatments
  } = useTreatmentStore();
  const {
    getTotalPaidByPatientIdAfterClosure,
    payments
  } = usePaymentStore();
  const { getLastAccountClosure } = usePatientStore();

  // حالة البحث
  const [searchQuery, setSearchQuery] = useState('');

  // حالة النوافذ المنبثقة
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null);

  // بيانات المرضى مع حساب المبالغ ونظام إخفاء العلاجات المدفوعة بالكامل
  const patientsWithPaymentData = useMemo(() => {
    return patients.map((patient: Patient) => {
      // الحصول على آخر تسكير حساب
      const lastAccountClosure = getLastAccountClosure(patient.id);
      const closureDate = lastAccountClosure?.closureDate;

      // استخدام النظام الجديد الذي يشمل جميع العلاجات النشطة (المبدوءة)
      const totalPaidAfterClosure = getTotalPaidByPatientIdAfterClosure(patient.id, closureDate);

      // الحصول على توزيع الدفعات للعلاجات النشطة (المبدوءة)
      const paymentDistribution = getPaymentDistribution(patient.id, totalPaidAfterClosure);

      const paymentStatus =
        paymentDistribution.remainingAmount <= 0 && paymentDistribution.totalCost > 0
          ? 'paid'
          : paymentDistribution.totalPaid > 0
            ? 'partial'
            : 'unpaid';

      return {
        ...patient,
        totalCost: paymentDistribution.totalCost,
        totalPaid: paymentDistribution.totalPaid,
        remainingAmount: paymentDistribution.remainingAmount,
        paymentStatus
      } as PatientWithPayment;
    });
  }, [patients, getTotalCostByPatientIdCompletedAfterClosure, getTotalPaidByPatientIdAfterClosure, getPaymentDistributionCompletedAfterClosure, getLastAccountClosure, treatments, payments]);

  // تصفية المرضى حسب البحث
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patientsWithPaymentData;

    const query = searchQuery.toLowerCase();
    return patientsWithPaymentData.filter((patient: PatientWithPayment) =>
      patient.name.toLowerCase().includes(query)
    );
  }, [patientsWithPaymentData, searchQuery]);

  // فصل المرضى حسب حالة الدفع
  // المرضى الذين عليهم مستحقات (المبلغ المتبقي أكبر من الصفر بعد إخفاء العلاجات المدفوعة بالكامل)
  const patientsWithPendingPayments = useMemo(() => {
    return filteredPatients.filter((patient: PatientWithPayment) => {
      // استخدام النظام الجديد الذي يخفي العلاجات المدفوعة بالكامل
      return patient.remainingAmount > 0;
    });
  }, [filteredPatients]);



  // فتح نافذة إضافة دفعة
  const handleOpenPaymentModal = (patient: { id: number; name: string }) => {
    setSelectedPatient(patient);
    setIsPaymentModalOpen(true);
  };

  // التنقل إلى صفحة المريض
  const handleNavigateToPatient = (patientId: number) => {
    navigate(`/patients/${patientId}`);
  };

  // تحويل حالة الدفع إلى اللون المناسب
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'unpaid':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // تحويل حالة الدفع إلى النص المناسب
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'partial':
        return 'دفعة جزئية';
      case 'unpaid':
        return 'غير مدفوع';
      default:
        return 'غير محدد';
    }
  };

  return (
    <div className="p-6 min-h-screen">

      {/* شريط البحث محسن بألوان التدرج */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 relative overflow-hidden">
        {/* خلفية تدرج خفيفة */}
        <div className="absolute inset-0 opacity-5" style={{
          background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
        }}></div>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border-2 border-gray-200 bg-gray-50 pr-12 py-3 focus:border-transparent focus:ring-2 focus:ring-offset-2 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-500"

            placeholder="البحث عن اسم المريض..."
          />
        </div>
      </div>

      {/* جدول المرضى مع دفعات معلقة */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 relative overflow-hidden">
          {/* خلفية تدرج */}
          <div className="absolute inset-0 opacity-10" style={{
            background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
          }}></div>
          <div className="relative">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="w-1 h-6 rounded-sm ml-3" style={{
                background: 'linear-gradient(135deg, #2A7B9B 0%, #A472AE 100%)'
              }}></div>
              المرضى مع مستحقات معلقة ({patientsWithPendingPayments.length})
            </h2>
          </div>
        </div>

        {patientsWithPendingPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-right" style={{
                  background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)'
                }}>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">اسم المريض</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">رقم الهاتف</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">إجمالي العلاجات</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">المدفوع</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">المتبقي</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">حالة الدفع</th>
                  <th className="px-3 py-4 text-sm font-bold text-white border-b border-white/20">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patientsWithPendingPayments.map((patient: PatientWithPayment) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td
                      className="px-3 py-3 text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleNavigateToPatient(patient.id)}
                    >
                      {patient.name}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{patient.phone}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{patient.totalCost.toLocaleString()} أ.ل.س</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{patient.totalPaid.toLocaleString()} أ.ل.س</td>
                    <td className="px-3 py-3 text-sm font-medium text-red-600">{patient.remainingAmount.toLocaleString()} أ.ل.س</td>
                    <td className="px-3 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentStatusColor(patient.paymentStatus)}`}>
                        {getPaymentStatusText(patient.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPaymentModal({id: patient.id, name: patient.name});
                        }}
                        className="px-3 py-2 text-white text-xs font-medium rounded-lg shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #8A85B3 0%, #9B95C9 100%)'
                        }}
                        title="إضافة دفعة"
                      >
                        إضافة دفعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">لا يوجد مرضى مع مستحقات معلقة</p>
          </div>
        )}
      </div>

      {/* نوافذ منبثقة */}
      {selectedPatient && (
        <AddPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
        />
      )}
    </div>
  );
};

export default PatientPayments;