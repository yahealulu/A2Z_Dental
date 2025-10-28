import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { type Treatment } from '../store/treatmentStore';

interface CompleteTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatment: Treatment | null;
  onConfirm: (finalNotes: string, newCost?: number) => void;
  isLoading?: boolean;
}

const CompleteTreatmentModal: React.FC<CompleteTreatmentModalProps> = ({
  isOpen,
  onClose,
  treatment,
  onConfirm,
  isLoading = false
}) => {
  const [finalNotes, setFinalNotes] = useState('');
  const [newCost, setNewCost] = useState<string>('');
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // تأثير الانيميشن عند فتح المودال
  useEffect(() => {
    if (isOpen && treatment) {
      setIsModalAnimating(true); // ابدأ مخفي
      setShowModal(true);
      setNewCost(treatment.cost.toString()); // تهيئة التكلفة الحالية
      setFinalNotes('تم الانتهاء من العلاج'); // تعيين النص الافتراضي
      setIsEditingCost(false);
      // تأخير صغير لبدء الانيميشن
      const timer = setTimeout(() => {
        setIsModalAnimating(false); // ثم اظهر
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
      setIsModalAnimating(false);
    }
  }, [isOpen, treatment]);

  const handleClose = () => {
    if (isLoading) return;

    setIsModalAnimating(true);
    setTimeout(() => {
      onClose();
      setFinalNotes('تم الانتهاء من العلاج'); // إعادة تعيين النص الافتراضي
      setNewCost('');
      setIsEditingCost(false);
      setIsModalAnimating(false);
    }, 300);
  };

  const handleSubmit = () => {
    if (isLoading) return;

    // التحقق من صحة التكلفة الجديدة إذا تم تعديلها
    let finalCost: number | undefined = undefined;
    if (isEditingCost) {
      const parsedCost = parseFloat(newCost);
      if (isNaN(parsedCost) || parsedCost < 0) {
        return; // لا نفعل شيء إذا كانت التكلفة غير صحيحة
      }
      finalCost = parsedCost;
    }

    onConfirm(finalNotes.trim(), finalCost);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      handleClose();
    }
  };

  if (!showModal || !treatment) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-500 ${
        isModalAnimating ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0
      }}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-6 transform transition-all duration-500 ${
          isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* رأس المودال */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                إكمال العلاج
              </h3>
              <p className="text-gray-500 text-sm mt-1">تأكيد إنهاء العلاج وحفظه في السجل</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* معلومات العلاج */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center text-sm text-gray-600 mb-3">
              <span className="font-medium">{treatment.name}</span>
              <span className="mx-2">•</span>
              <span>{treatment.sessions.length} جلسة</span>
            </div>

            {/* قسم التكلفة مع إمكانية التعديل */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-gray-600">التكلفة:</span>
              {!isEditingCost ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {treatment.cost.toLocaleString()} أ.ل.س
                  </span>
                  <button
                    onClick={() => setIsEditingCost(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    disabled={isLoading}
                  >
                    تعديل
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="التكلفة"
                    disabled={isLoading}
                    min="0"
                    step="0.01"
                  />
                  <span className="text-sm text-gray-600">أ.ل.س</span>
                  <button
                    onClick={() => {
                      setIsEditingCost(false);
                      setNewCost(treatment.cost.toString());
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* تحذير عند تعديل التكلفة */}
            {isEditingCost && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800 text-center">
                  ⚠️ تعديل التكلفة سيؤثر على حسابات المريض في صفحة الدفعات وتفاصيل المريض
                </p>
              </div>
            )}
          </div>

          {/* خانة الملاحظات النهائية */}
          <div className="mb-6">
            <label htmlFor="finalNotes" className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات نهائية (اختيارية)
            </label>
            <textarea
              id="finalNotes"
              value={finalNotes}
              onChange={(e) => setFinalNotes(e.target.value)}
              className="block w-full rounded-xl border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 resize-none transition-all duration-200"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-8 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:shadow-md disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 py-3 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: isLoading
                  ? '#9CA3AF'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)'
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الإكمال...
                </div>
              ) : (
                'إكمال العلاج'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteTreatmentModal;
