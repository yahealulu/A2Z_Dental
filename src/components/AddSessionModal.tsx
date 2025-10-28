import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useTreatmentStore, type Treatment } from '../store/treatmentStore';
import { notify } from '../store/notificationStore';

interface AddSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatment: Treatment;
}

const AddSessionModal = ({ isOpen, onClose, treatment }: AddSessionModalProps) => {
  const { addSession } = useTreatmentStore();

  // حالة بيانات الجلسة
  const [sessionData, setSessionData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  // حالات التحكم
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // التعامل مع تغيير البيانات
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // التحقق من صحة البيانات
  const isFormValid = () => {
    return sessionData.notes.trim().length >= 2;
  };

  // إرسال النموذج
  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);

    try {
      // إضافة الجلسة
      await addSession(treatment.id, sessionData.notes.trim(), sessionData.date);

      // إشعار النجاح
      notify.success('تم إضافة الجلسة بنجاح');

      // إغلاق النافذة مع انيميشن
      setIsModalAnimating(true);
      setTimeout(() => {
        handleClose();
        setIsModalAnimating(false);
        setIsLoading(false);
      }, 300);

    } catch (error) {
      console.error('خطأ في إضافة الجلسة:', error);
      notify.error('حدث خطأ في إضافة الجلسة');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSessionData({
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      handleClose();
      setIsModalAnimating(false);
    }, 300);
  };

  // إضافة تأخير عند فتح المودال
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
      onClick={handleCloseModal}
    >
      <div className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                إضافة جلسة جديدة
              </h3>
              <p className="text-gray-500 text-sm mt-1">للعلاج: {treatment.name}</p>
              <p className="text-blue-600 text-sm font-medium mt-1">
                الجلسة رقم: {treatment.sessions.length + 1}
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

          {/* النموذج */}
          <div className="space-y-4">
            {/* تاريخ الجلسة */}
            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                تاريخ الجلسة <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={sessionData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white"
                required
              />
            </div>

            {/* ملاحظات الجلسة */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                ملاحظات الجلسة <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={sessionData.notes}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-300 bg-gray-50 hover:bg-white resize-none"
                placeholder="اكتب ملاحظات مفصلة حول الجلسة..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                يجب أن تحتوي الملاحظات على حرفين على الأقل
              </p>
            </div>
          </div>

          {/* الأزرار */}
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
                !isFormValid()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              style={
                !isFormValid()
                  ? {}
                  : { background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }
              }
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'جاري الإضافة...' : 'إضافة الجلسة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSessionModal;
