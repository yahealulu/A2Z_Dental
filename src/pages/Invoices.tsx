import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DocumentTextIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useInvoiceStore } from '../store/invoiceStore';
import { usePatientStore } from '../store/patientStore';
import { usePaymentStore } from '../store/paymentStore';
import Table from '../components/Table';

const Invoices = () => {
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const invoices = useInvoiceStore(s => s.invoices);
  const getInvoicesByDate = useInvoiceStore(s => s.getInvoicesByDate);
  const getTotalPaidForInvoice = useInvoiceStore(s => s.getTotalPaidForInvoice);
  const getPatientById = usePatientStore(s => s.getPatientById);

  const filteredInvoices = useMemo(() => {
    return getInvoicesByDate(filterDate).slice().sort((a, b) => b.invoiceNumber - a.invoiceNumber);
  }, [filterDate, getInvoicesByDate, invoices]);

  const paymentStatus = (inv: { id: number; totalAfterDiscount: number }) => {
    const paid = getTotalPaidForInvoice(inv.id);
    if (paid >= inv.totalAfterDiscount) return { label: 'مدفوع', className: 'text-green-600' };
    if (paid > 0) return { label: 'مدفوع جزئياً', className: 'text-amber-600' };
    return { label: 'غير مدفوع', className: 'text-red-600' };
  };

  const columns = [
    { header: 'رقم الفاتورة', accessor: (inv: { invoiceNumber: number }) => inv.invoiceNumber },
    {
      header: 'المريض',
      accessor: (inv: { patientId: number }) => getPatientById(inv.patientId)?.name ?? `#${inv.patientId}`
    },
    { header: 'التاريخ', accessor: (inv: { date: string }) => inv.date },
    {
      header: 'حالة الدفع',
      accessor: (inv: { id: number; totalAfterDiscount: number }) => {
        const s = paymentStatus(inv);
        return <span className={s.className}>{s.label}</span>;
      }
    },
    { header: 'الإجمالي بعد الخصم', accessor: (inv: { totalAfterDiscount: number }) => inv.totalAfterDiscount },
    {
      header: 'المدفوع',
      accessor: (inv: { id: number }) => getTotalPaidForInvoice(inv.id)
    },
    { header: 'الطبيب', accessor: (inv: { doctorName?: string }) => inv.doctorName ?? '—' }
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-primary-600" />
        الفواتير
      </h1>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">التاريخ:</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goPrev} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center font-medium" dir="ltr">
            {format(new Date(filterDate + 'T12:00:00'), 'yyyy-MM-dd', { locale: ar })}
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
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          data={filteredInvoices}
          keyExtractor={(inv: { id: number }) => inv.id}
          emptyMessage="لا توجد فواتير في هذا التاريخ"
        />
      </div>
    </div>
  );
};

export default Invoices;
