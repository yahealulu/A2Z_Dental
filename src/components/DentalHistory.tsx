import CircleTeethChart from './CircleTeethChart';

interface DentalHistoryProps {
  patientId?: number;
}

export default function DentalHistory({
  patientId
}: DentalHistoryProps) {
  // معالجة النقر على السن - الآن يتم التعامل معها في CircleTeethChart
  const handleToothClick = () => {
    // لا نحتاج لفعل شيء هنا، CircleTeethChart سيتعامل مع النقر
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">السجل السني</h2>
          <div className="text-sm text-gray-600">
            انقر على أي سن لعرض التفاصيل والعلاجات
          </div>
        </div>

        <CircleTeethChart
          patientId={patientId || 0}
          onToothClick={handleToothClick}
        />
      </div>
    </>
  );
}
