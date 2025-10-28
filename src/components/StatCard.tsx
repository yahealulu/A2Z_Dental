
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  chart?: React.ReactNode;
}

const StatCard = React.memo(({ title, value, icon: Icon, color, chart }: StatCardProps) => {
  // استخراج اللون الأساسي من الفئة (مثال: 'bg-blue-500' -> 'blue')
  const baseColor = color.split('-')[1];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] group animate-fade-in">
      <div className={`w-full h-2 ${color.replace('bg-', 'bg-gradient-to-l from-') + '-600 to-' + baseColor + '-400'}`}></div>
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-full p-3 ${color} transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="mr-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="mt-1">
                <div className="text-xl font-bold text-gray-900 transition-all duration-300 group-hover:text-primary-600">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>

        {chart && (
          <div className="mt-2">
            {chart}
          </div>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
