import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { BanknotesIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { usePaymentStore } from '../store/paymentStore';
import Table from '../components/Table';

const Payments = () => {
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const getDailyPayments = usePaymentStore(s => s.getDailyPayments);
  const payments = useMemo(
    () => getDailyPayments(filterDate).slice().sort((a, b) => b.id - a.id),
    [filterDate, getDailyPayments]
  );

  const columns = [
    { header: 'المبلغ', accessor: (p: { amount: number }) => p.amount },
    { header: 'التاريخ', accessor: (p: { paymentDate: string }) => p.paymentDate },
    { header: 'طريقة الدفع', accessor: (p: { paymentMethod: string }) => p.paymentMethod || '—' },
    { header: 'المريض', accessor: (p: { patientName: string }) => p.patientName },
    { header: 'ملاحظات', accessor: (p: { notes?: string }) => p.notes ?? '—' },
    { header: 'سجّل بواسطة', accessor: (p: { recordedBy?: string }) => p.recordedBy ?? '—' }
  ];

  const goPrev = () => {
    const d = new Date(filterDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setFilterDate(format(d, 'yyyy-MM-dd'));
  };
  const goNext = () => {
    const d = new Date(filterDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setFilterDate(format(d, 'yyyy-MM-dd'));
  };

  const totalDay = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BanknotesIcon className="h-8 w-8 text-primary-600" />
        الدفعات
      </h1>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">التاريخ:</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrev} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center font-medium" dir="ltr">
            {filterDate}
          </span>
          <button type="button" onClick={goNext} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <span className="text-sm font-semibold text-gray-800">إجمالي اليوم: {totalDay}</span>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={payments}
          keyExtractor={(p: { id: number }) => p.id}
          emptyMessage="لا توجد دفعات في هذا التاريخ"
        />
      </div>
    </div>
  );
};

export default Payments;
