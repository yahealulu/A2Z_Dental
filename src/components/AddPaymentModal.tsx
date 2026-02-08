import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { usePaymentStore } from '../store/paymentStore';
import { useTreatmentStore } from '../store/treatmentStore';
import { notify } from '../store/notificationStore';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
}

const AddPaymentModal = ({ isOpen, onClose, patientId, patientName }: AddPaymentModalProps) => {
  const { addPayment, getTotalPaidByPatientId } = usePaymentStore();
  const { getTotalCostByPatientId } = useTreatmentStore();
  const [paymentData, setPaymentData] = useState({
    amount: '' as string | number,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '' as string
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // حساب المبلغ المتبقي للمريض
  const totalCost = getTotalCostByPatientId(patientId);
  const totalPaid = getTotalPaidByPatientId(patientId);
  const remainingAmount = totalCost - totalPaid;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData({
      ...paymentData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // التحقق من صحة البيانات
    const amount = typeof paymentData.amount === 'string'
      ? parseFloat(paymentData.amount)
      : paymentData.amount;

    if (!amount || amount <= 0) {
      return; // لا نفعل شيء إذا كان المبلغ غير صحيح
    }

    // التحقق من أن المبلغ لا يتجاوز المبلغ المتبقي
    if (amount > remainingAmount) {
      return; // لا نفعل شيء إذا كان المبلغ أكبر من المتبقي
    }

    setIsLoading(true);

    // إضافة الدفعة
    addPayment({
      patientId,
      patientName,
      amount,
      paymentDate: paymentData.paymentDate,
      notes: paymentData.notes ?? '',
      paymentMethod: 'نقداً'
    });

    // إشعار النجاح
    notify.success('تم إضافة الدفعة بنجاح');

    // إغلاق النافذة مع انيميشن
    setIsModalAnimating(true);
    setTimeout(() => {
      onClose();
      setIsModalAnimating(false);
      setIsLoading(false);
      setPaymentData({
        amount: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
    }, 300);
  };

  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      onClose();
      setIsModalAnimating(false);
    }, 300);
  };

  // إضافة تأخير عند فتح المودال
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsModalAnimating(true);
      setTimeout(() => {
        setShowModal(true);
        setTimeout(() => setIsModalAnimating(false), 50);
      }, 300);
    } else {
      setShowModal(false);
    }
  }, [isOpen]);

  if (!showModal) return null;

  return (
    <div
      className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${
        isModalAnimating ? 'opacity-0' : 'opacity-100'
      }`}
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
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                إضافة دفعة جديدة
              </h3>
              <p className="text-gray-500 text-sm mt-1">للمريض: {patientName}</p>
              <p className="text-blue-600 text-sm font-medium mt-2">
                المبلغ المتبقي: {remainingAmount.toLocaleString()} أ.ل.س
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                المبلغ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={paymentData.amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 text-sm rounded-lg border-2 transition-all duration-300 bg-gray-50 hover:bg-white ${
                  (() => {
                    const amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : paymentData.amount;
                    return amount > remainingAmount && amount > 0
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
                  })()
                }`}
                required
              />
              {(() => {
                const amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : paymentData.amount;
                return amount > remainingAmount && amount > 0 ? (
                  <p className="text-red-500 text-xs mt-1">
                    المبلغ أكبر من المتبقي ({remainingAmount.toLocaleString()} أ.ل.س)
                  </p>
                ) : null;
              })()}
            </div>

            <div>
              <label htmlFor="paymentDate" className="block text-sm font-semibold text-gray-700 mb-2">
                تاريخ الدفع <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={paymentData.paymentDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                required
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 rtl:space-x-reverse">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={handleCloseModal}
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              type="button"
              className={`px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                (() => {
                  const amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : paymentData.amount;
                  return !paymentData.amount || amount <= 0 || amount > remainingAmount
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'shadow-lg hover:shadow-xl transform hover:scale-105';
                })()
              }`}
              style={
                (() => {
                  const amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : paymentData.amount;
                  return !paymentData.amount || amount <= 0 || amount > remainingAmount
                    ? {}
                    : { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' };
                })()
              }
              onClick={handleSubmit}
              disabled={(() => {
                const amount = typeof paymentData.amount === 'string' ? parseFloat(paymentData.amount) : paymentData.amount;
                return isLoading || !paymentData.amount || amount <= 0 || amount > remainingAmount;
              })()}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة الدفعة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentModal;