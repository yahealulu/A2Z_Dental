import { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTreatmentStore, type Treatment, type TreatmentSession } from '../store/treatmentStore';
import { usePatientStore } from '../store/patientStore';
import { useDoctorStore } from '../store/doctorStore';
import { notify } from '../store/notificationStore';
import ConfirmationModal from './ConfirmationModal';

interface TreatmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatment: Treatment;
  onEditSession?: (session: TreatmentSession) => void;
  onAddSession?: () => void;
  onCompleteTreatment?: () => void;
  onCancelTreatment?: () => void;
}

const TreatmentDetailsModal = ({
  isOpen,
  onClose,
  treatment,
  onEditSession,
  onAddSession,
  onCompleteTreatment,
  onCancelTreatment
}: TreatmentDetailsModalProps) => {
  const { updateSession, getTreatmentById } = useTreatmentStore();
  const { getPatientById } = usePatientStore();
  const { getDoctorById } = useDoctorStore();

  // الحصول على البيانات المحدثة من الـ store
  const currentTreatment = getTreatmentById(treatment.id) || treatment;

  // حالات التحكم
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TreatmentSession | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // الحصول على بيانات المريض والطبيب
  const patient = getPatientById(currentTreatment.patientId);
  const doctor = currentTreatment.doctorId ? getDoctorById(currentTreatment.doctorId) : null;

  // التعامل مع تحرير الجلسة
  const handleEditSession = (session: TreatmentSession) => {
    setEditingSession(session);
    setEditNotes(session.notes);
    setIsEditingNotes(true);
  };

  // حفظ تحرير الجلسة
  const handleSaveEdit = async () => {
    if (!editingSession || !editNotes.trim()) return;

    try {
      await updateSession(editingSession.id, editNotes.trim());
      notify.success('تم تحديث الجلسة بنجاح');
      setIsEditingNotes(false);
      setEditingSession(null);
      setEditNotes('');
    } catch (error) {
      console.error('خطأ في تحديث الجلسة:', error);
      notify.error('حدث خطأ في تحديث الجلسة');
    }
  };

  // إلغاء تحرير الجلسة
  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    setEditingSession(null);
    setEditNotes('');
  };



  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      onClose();
      setIsModalAnimating(false);
      setIsEditingNotes(false);
      setEditingSession(null);
      setEditNotes('');
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

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled_incomplete':
      case 'cancelled_no_sessions':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // تحديد نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'جاري';
      case 'completed':
        return 'مكتمل';
      case 'cancelled_incomplete':
        return 'ملغي (جلسات مكتملة)';
      case 'cancelled_no_sessions':
        return 'ملغي (بدون جلسات)';
      default:
        return status;
    }
  };

  return (
    <>
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
        <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[95vh] overflow-y-auto transform transition-all duration-300 ${
          isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`} onClick={(e) => e.stopPropagation()}>
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  تفاصيل العلاج: {currentTreatment.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>المريض: {patient?.name || 'غير محدد'}</span>
                  {doctor && <span>الطبيب: {doctor.name}</span>}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentTreatment.status)}`}>
                    {getStatusText(currentTreatment.status)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* معلومات العلاج */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4 text-sm leading-none">
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-500">تاريخ البداية:</span>
                  <span className="text-gray-800">{format(new Date(currentTreatment.startDate), 'dd/MM/yyyy', { locale: ar })}</span>
                </span>

                {currentTreatment.endDate && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium text-gray-500">تاريخ الانتهاء:</span>
                    <span className="text-gray-800">{format(new Date(currentTreatment.endDate), 'dd/MM/yyyy', { locale: ar })}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-500">التكلفة:</span>
                  <span className="text-gray-800 font-semibold">{currentTreatment.cost.toLocaleString()} أ.ل.س</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-gray-500">عدد الجلسات:</span>
                  <span className="text-gray-800">{currentTreatment.sessions.length} جلسة</span>
                </span>

                {currentTreatment.teethNumbers && currentTreatment.teethNumbers.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium text-gray-500">الأسنان:</span>
                    <span className="text-gray-800">{currentTreatment.teethNumbers.join(', ')}</span>
                  </span>
                )}
              </div>

              {currentTreatment.description && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-500 text-sm">الوصف:</span>
                    <span className="text-gray-800 text-sm">{currentTreatment.description}</span>
                  </div>
                </div>
              )}
            </div>

            {/* الجلسات */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">الجلسات</h4>
                {currentTreatment.status === 'in_progress' && onAddSession && (
                  <button
                    onClick={onAddSession}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #2A7B9B 0%, #8A85B3 50%, #A472AE 100%)' }}
                  >
                    إضافة جلسة
                  </button>
                )}
              </div>

              {currentTreatment.sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد جلسات مسجلة لهذا العلاج
                </div>
              ) : (
                <div className="space-y-3">
                  {currentTreatment.sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">الجلسة {session.sessionNumber}</span>
                          <span className="text-sm text-gray-500">
                            {format(new Date(session.date), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                        </div>
                        {currentTreatment.status === 'in_progress' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSession(session)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="تحرير"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {isEditingNotes && editingSession?.id === session.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              disabled={!editNotes.trim()}
                            >
                              حفظ
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-sm">{session.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            {currentTreatment.status === 'in_progress' && (
              <div className="flex justify-end gap-4">
                {onCancelTreatment && (
                  <button
                    onClick={onCancelTreatment}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-all duration-300"
                  >
                    إلغاء العلاج
                  </button>
                )}
                {onCompleteTreatment && (
                  <button
                    onClick={onCompleteTreatment}
                    className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
                  >
                    إكمال العلاج
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مودال التأكيد */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </>
  );
};

export default TreatmentDetailsModal;
