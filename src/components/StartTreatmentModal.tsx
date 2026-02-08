import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Treatment } from '../store/treatmentStore';
import { useDoctorStore } from '../store/doctorStore';

export interface StartTreatmentInvoiceData {
  subtotal: number;
  diagnosticFeeOrExtra: number;
  discountValue: number;
  discountType: 'percent' | 'amount';
  totalAfterDiscount: number;
  doctorId?: number;
  doctorName?: string;
}

interface StartTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  treatment: Treatment | null;
  onConfirm: (data: StartTreatmentInvoiceData) => void;
  isLoading?: boolean;
}

const StartTreatmentModal: React.FC<StartTreatmentModalProps> = ({
  isOpen,
  onClose,
  treatment,
  onConfirm,
  isLoading = false
}) => {
  const { getActiveDoctors } = useDoctorStore();
  const [diagnosticFee, setDiagnosticFee] = useState('0');
  const [discountValue, setDiscountValue] = useState('0');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('amount');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);

  const subtotal = treatment?.cost ?? 0;
  const diag = parseFloat(diagnosticFee) || 0;
  const discount = parseFloat(discountValue) || 0;
  const beforeDiscount = subtotal + diag;
  const totalAfterDiscount =
    discountType === 'percent'
      ? beforeDiscount - (beforeDiscount * discount) / 100
      : beforeDiscount - discount;
  const finalTotal = Math.max(0, totalAfterDiscount);

  useEffect(() => {
    if (isOpen && treatment) {
      setDiagnosticFee('0');
      setDiscountValue('0');
      setDiscountType('amount');
      setDoctorId(treatment.doctorId ?? '');
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isOpen, treatment]);

  const doctors = getActiveDoctors();
  const selectedDoctor = doctorId ? doctors.find(d => d.id === doctorId) : undefined;

  const handleSubmit = () => {
    onConfirm({
      subtotal,
      diagnosticFeeOrExtra: diag,
      discountValue: discount,
      discountType,
      totalAfterDiscount: finalTotal,
      doctorId: doctorId ? Number(doctorId) : undefined,
      doctorName: selectedDoctor?.name
    });
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!showModal || !treatment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">بدء العلاج وإنشاء الفاتورة</h3>
          <button type="button" onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">العلاج: {treatment.name}</p>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span>المبلغ الأساسي</span>
            <span>{subtotal} أ.ل.س</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رسوم تشخيص / إضافي</label>
            <input
              type="number"
              min={0}
              value={diagnosticFee}
              onChange={e => setDiagnosticFee(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span>الإجمالي قبل الخصم</span>
            <span>{beforeDiscount} أ.ل.س</span>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'amount')}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="amount">مبلغ</option>
              <option value="percent">نسبة مئوية</option>
            </select>
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
              placeholder={discountType === 'percent' ? '%' : '0'}
            />
          </div>
          <div className="flex justify-between font-medium">
            <span>الإجمالي النهائي</span>
            <span>{finalTotal} أ.ل.س</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الطبيب</label>
            <select
              value={doctorId}
              onChange={e => setDoctorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">—</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'جاري...' : 'بدء العلاج وإنشاء الفاتورة'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartTreatmentModal;
