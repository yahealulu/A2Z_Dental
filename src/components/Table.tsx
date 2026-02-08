
import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

const Table = React.memo(<T,>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'لا توجد بيانات'
}: TableProps<T>) => {
  return (
    <div className="overflow-x-auto rounded-xl shadow-card transition-all duration-300 hover:shadow-card-hover animate-fade-in" dir="rtl">
      <table className="w-full table-fixed divide-y divide-gray-200 rounded-xl overflow-hidden">
        {/* رأس الجدول مع تدرج لوني محسن */}
        <thead>
          <tr className="bg-gradient-to-l from-primary-600 to-primary-500 border-b border-primary-400/30">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider shadow-inner-light ${column.className || ''}`}
                style={{ width: `${100 / columns.length}%` }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* جسم الجدول مع تأثيرات تفاعلية محسنة */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}
                  ${onRowClick ? 'cursor-pointer transition-all duration-200' : ''}
                  group relative overflow-hidden`}
              >
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-center transition-all duration-200 ${column.className || ''} relative`}
                  >

                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-10 text-center text-sm text-gray-500 animate-fade-in"
              >
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}) as <T>(props: TableProps<T>) => React.ReactElement;

(Table as React.FC & { displayName?: string }).displayName = 'Table';

export default Table;
