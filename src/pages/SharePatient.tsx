import { useParams } from 'react-router-dom';
import { useShareStore } from '../store/shareStore';
import { usePatientStore } from '../store/patientStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { usePrescriptionStore } from '../store/prescriptionStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { usePaymentStore } from '../store/paymentStore';
import { useTreatmentStore } from '../store/treatmentStore';
import { DocumentTextIcon, CalendarIcon, BanknotesIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const SharePatient = () => {
  const { token } = useParams<{ token: string }>();
  const getPatientIdByToken = useShareStore(s => s.getPatientIdByToken);
  const patientId = token ? getPatientIdByToken(token) : null;
  const getPatientById = usePatientStore(s => s.getPatientById);
  const patient = patientId != null ? getPatientById(patientId) : undefined;

  const getAppointmentsByPatientId = useAppointmentStore(s => s.getAppointmentsByPatientId);
  const getPrescriptionsByPatientId = usePrescriptionStore(s => s.getPrescriptionsByPatientId);
  const getInvoicesByPatientId = useInvoiceStore(s => s.getInvoicesByPatientId);
  const getPaymentsByInvoiceId = usePaymentStore(s => s.getPaymentsByInvoiceId);
  const getTotalPaidByInvoiceId = usePaymentStore(s => s.getTotalPaidByInvoiceId);
  const getTreatmentsByPatient = useTreatmentStore(s => s.getTreatmentsByPatient);

  const appointments = patientId != null ? getAppointmentsByPatientId(patientId) : [];
  const prescriptions = patientId != null ? getPrescriptionsByPatientId(patientId) : [];
  const invoices = patientId != null ? getInvoicesByPatientId(patientId) : [];
  const treatments = patientId != null ? getTreatmentsByPatient(patientId) : [];

  if (token == null || patientId == null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-gray-600">رابط غير صالح أو منتهي الصلاحية.</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-gray-600">المريض غير موجود.</p>
        </div>
      </div>
    );
  }

  const statusLabel = (s: string) => {
    if (s === 'scheduled') return 'مجدول';
    if (s === 'waiting_list') return 'قائمة الانتظار';
    if (s === 'completed') return 'منفذ';
    if (s === 'cancelled') return 'ملغى';
    return s;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500 mt-1">عرض للقراءة فقط — رابط مشاركة</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5" />
              المواعيد
            </h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد مواعيد.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {appointments.slice(0, 20).map(apt => (
                  <li key={apt.id} className="py-2 flex justify-between text-sm">
                    <span>{apt.date} — {apt.time}</span>
                    <span>{statusLabel(apt.status)} — {apt.doctorName}</span>
                  </li>
                ))}
                {appointments.length > 20 && <li className="py-2 text-gray-500">... و {appointments.length - 20} أخرى</li>}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <DocumentTextIcon className="h-5 w-5" />
              الوصفات
            </h2>
            {prescriptions.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد وصفات.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {prescriptions.slice(0, 20).map(p => (
                  <li key={p.id} className="py-2 text-sm">
                    {p.medicineName} — {p.dosage}، {p.numberOfDays} يوم {p.note ? `(${p.note})` : ''}
                  </li>
                ))}
                {prescriptions.length > 20 && <li className="py-2 text-gray-500">... و {prescriptions.length - 20} أخرى</li>}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <DocumentTextIcon className="h-5 w-5" />
              الفواتير
            </h2>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد فواتير.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {invoices.slice(0, 20).map(inv => {
                  const paid = getTotalPaidByInvoiceId(inv.id);
                  const status = paid >= inv.totalAfterDiscount ? 'مدفوع' : paid > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
                  return (
                    <li key={inv.id} className="py-2 flex justify-between text-sm">
                      <span>#{inv.invoiceNumber} — {inv.date} — {inv.totalAfterDiscount}</span>
                      <span>{status}</span>
                    </li>
                  );
                })}
                {invoices.length > 20 && <li className="py-2 text-gray-500">... و {invoices.length - 20} أخرى</li>}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <BanknotesIcon className="h-5 w-5" />
              الدفعات
            </h2>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد دفعات مرتبطة بفواتير.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {invoices.flatMap(inv => getPaymentsByInvoiceId(inv.id)).slice(0, 20).map(p => (
                  <li key={p.id} className="py-2 flex justify-between text-sm">
                    <span>{p.paymentDate} — {p.amount}</span>
                    <span>{p.paymentMethod}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <ClipboardDocumentListIcon className="h-5 w-5" />
              السجل الطبي (علاجات)
            </h2>
            {treatments.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد علاجات مسجلة.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {treatments.slice(0, 30).map(t => (
                  <li key={t.id} className="py-2 text-sm">
                    {t.name} — {t.status} {t.teethNumbers?.length ? `— أسنان: ${t.teethNumbers.join(', ')}` : ''} {t.doctorName ? `— ${t.doctorName}` : ''}
                  </li>
                ))}
                {treatments.length > 30 && <li className="py-2 text-gray-500">... و {treatments.length - 30} أخرى</li>}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SharePatient;
