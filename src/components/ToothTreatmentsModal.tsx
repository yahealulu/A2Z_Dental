
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useTreatmentStore } from '../store/treatmentStore';
import { usePatientStore } from '../store/patientStore';


interface ToothTreatmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number;
  patientId: number;
}

const ToothTreatmentsModal = ({ isOpen, onClose, toothNumber, patientId }: ToothTreatmentsModalProps) => {
  const { getTreatmentsByPatient } = useTreatmentStore();
  const { getPatientById } = usePatientStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  const handleCloseModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      onClose();
      setIsModalAnimating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const patient = getPatientById(patientId);
  const allTreatments = getTreatmentsByPatient(patientId);

  // تصفية العلاجات المرتبطة بهذا السن
  const toothTreatments = allTreatments.filter(treatment =>
    treatment.teethNumbers?.includes(toothNumber)
  );

  // قاموس أسماء الأسنان
  const toothNames: Record<number, string> = {
    // الأسنان الدائمة - الربع الأول (العلوي الأيمن)
    11: "القاطع المركزي العلوي الأيمن",
    12: "القاطع الجانبي العلوي الأيمن",
    13: "الناب العلوي الأيمن",
    14: "الضاحك الأول العلوي الأيمن",
    15: "الضاحك الثاني العلوي الأيمن",
    16: "الطاحن الأول العلوي الأيمن",
    17: "الطاحن الثاني العلوي الأيمن",
    18: "ضرس العقل العلوي الأيمن",
    // الأسنان الدائمة - الربع الثاني (العلوي الأيسر)
    21: "القاطع المركزي العلوي الأيسر",
    22: "القاطع الجانبي العلوي الأيسر",
    23: "الناب العلوي الأيسر",
    24: "الضاحك الأول العلوي الأيسر",
    25: "الضاحك الثاني العلوي الأيسر",
    26: "الطاحن الأول العلوي الأيسر",
    27: "الطاحن الثاني العلوي الأيسر",
    28: "ضرس العقل العلوي الأيسر",
    // الأسنان الدائمة - الربع الثالث (السفلي الأيسر)
    31: "القاطع المركزي السفلي الأيسر",
    32: "القاطع الجانبي السفلي الأيسر",
    33: "الناب السفلي الأيسر",
    34: "الضاحك الأول السفلي الأيسر",
    35: "الضاحك الثاني السفلي الأيسر",
    36: "الطاحن الأول السفلي الأيسر",
    37: "الطاحن الثاني السفلي الأيسر",
    38: "ضرس العقل السفلي الأيسر",
    // الأسنان الدائمة - الربع الرابع (السفلي الأيمن)
    41: "القاطع المركزي السفلي الأيمن",
    42: "القاطع الجانبي السفلي الأيمن",
    43: "الناب السفلي الأيمن",
    44: "الضاحك الأول السفلي الأيمن",
    45: "الضاحك الثاني السفلي الأيمن",
    46: "الطاحن الأول السفلي الأيمن",
    47: "الطاحن الثاني السفلي الأيمن",
    48: "ضرس العقل السفلي الأيمن",
    // الأسنان اللبنية
    51: "القاطع المركزي العلوي الأيمن (لبني)",
    52: "القاطع الجانبي العلوي الأيمن (لبني)",
    53: "الناب العلوي الأيمن (لبني)",
    54: "الطاحن الأول العلوي الأيمن (لبني)",
    55: "الطاحن الثاني العلوي الأيمن (لبني)",
    61: "القاطع المركزي العلوي الأيسر (لبني)",
    62: "القاطع الجانبي العلوي الأيسر (لبني)",
    63: "الناب العلوي الأيسر (لبني)",
    64: "الطاحن الأول العلوي الأيسر (لبني)",
    65: "الطاحن الثاني العلوي الأيسر (لبني)",
    71: "القاطع المركزي السفلي الأيسر (لبني)",
    72: "القاطع الجانبي السفلي الأيسر (لبني)",
    73: "الناب السفلي الأيسر (لبني)",
    74: "الطاحن الأول السفلي الأيسر (لبني)",
    75: "الطاحن الثاني السفلي الأيسر (لبني)",
    81: "القاطع المركزي السفلي الأيمن (لبني)",
    82: "القاطع الجانبي السفلي الأيمن (لبني)",
    83: "الناب السفلي الأيمن (لبني)",
    84: "الطاحن الأول السفلي الأيمن (لبني)",
    85: "الطاحن الثاني السفلي الأيمن (لبني)"
  };

  const toothName = toothNames[toothNumber] || `سن رقم ${toothNumber}`;

  return (
    <div
      className={`fixed bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
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
      <div className={`bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isModalAnimating ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              علاجات السن رقم {toothNumber}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {patient?.name} - {toothName}
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {toothTreatments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                العلاجات المرتبطة بهذا السن ({toothTreatments.length})
              </h3>

              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-right text-base font-semibold text-gray-900">العلاج</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-base font-semibold text-gray-900">التاريخ</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-base font-semibold text-gray-900">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {toothTreatments
                      .sort((a, b) => {
                        const dateA = a.status === 'completed' && a.endDate
                          ? new Date(a.endDate)
                          : new Date(a.startDate);
                        const dateB = b.status === 'completed' && b.endDate
                          ? new Date(b.endDate)
                          : new Date(b.startDate);
                        return dateB.getTime() - dateA.getTime();
                      })
                      .map(treatment => (
                        <tr key={treatment.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-base font-medium text-gray-900">
                            {treatment.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-base text-gray-500">
                            {(() => {
                              try {
                                if (treatment.status === 'completed' && treatment.endDate) {
                                  const endDate = new Date(treatment.endDate);
                                  return isNaN(endDate.getTime()) ? 'تاريخ غير صالح' : format(endDate, 'dd/MM/yyyy');
                                } else if (treatment.startDate) {
                                  const startDate = new Date(treatment.startDate);
                                  return isNaN(startDate.getTime()) ? 'تاريخ غير صالح' : format(startDate, 'dd/MM/yyyy');
                                }
                                return 'غير محدد';
                              } catch (error) {
                                return 'تاريخ غير صالح';
                              }
                            })()}
                          </td>
                          <td className="px-3 py-4 text-base text-gray-500 max-w-xs">
                            <div className="truncate" title={treatment.finalNotes || treatment.notes || ''}>
                              {treatment.finalNotes || treatment.notes || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد علاجات</h3>
              <p className="text-gray-500">لا توجد علاجات مرتبطة بهذا السن حتى الآن</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToothTreatmentsModal;
