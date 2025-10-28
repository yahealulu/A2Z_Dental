/**
 * مكون مساعد لعرض أرقام الأسنان الصحيحة
 */

import React, { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface ToothNumberHelperProps {
  onSelectTooth?: (toothNumber: number) => void;
}

const ToothNumberHelper: React.FC<ToothNumberHelperProps> = ({ onSelectTooth }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToothClick = (toothNumber: number) => {
    if (onSelectTooth) {
      onSelectTooth(toothNumber);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
        title="عرض أرقام الأسنان الصحيحة"
      >
        <QuestionMarkCircleIcon className="h-4 w-4 ml-1" />
        أرقام الأسنان الصحيحة
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-96">
          <div className="space-y-4">
            {/* الأسنان الدائمة */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">الأسنان الدائمة:</h4>
              <div className="space-y-2">
                {/* الفك العلوي الأيمن */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">العلوي الأيمن:</span>
                  {[11, 12, 13, 14, 15, 16, 17, 18].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك العلوي الأيسر */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">العلوي الأيسر:</span>
                  {[21, 22, 23, 24, 25, 26, 27, 28].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك السفلي الأيسر */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">السفلي الأيسر:</span>
                  {[31, 32, 33, 34, 35, 36, 37, 38].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك السفلي الأيمن */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">السفلي الأيمن:</span>
                  {[41, 42, 43, 44, 45, 46, 47, 48].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* الأسنان اللبنية */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">الأسنان اللبنية:</h4>
              <div className="space-y-2">
                {/* الفك العلوي الأيمن */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">العلوي الأيمن:</span>
                  {[51, 52, 53, 54, 55].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك العلوي الأيسر */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">العلوي الأيسر:</span>
                  {[61, 62, 63, 64, 65].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك السفلي الأيسر */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">السفلي الأيسر:</span>
                  {[71, 72, 73, 74, 75].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>

                {/* الفك السفلي الأيمن */}
                <div className="flex gap-1">
                  <span className="text-xs text-gray-500 w-16">السفلي الأيمن:</span>
                  {[81, 82, 83, 84, 85].map((tooth) => (
                    <button
                      key={tooth}
                      type="button"
                      onClick={() => handleToothClick(tooth)}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded border transition-colors"
                      title={`اختيار السن ${tooth}`}
                    >
                      {tooth}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* زر الإغلاق */}
            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToothNumberHelper;
