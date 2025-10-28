import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-8 w-8 text-blue-600 ml-3" />
          <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        </div>
        <p className="text-gray-600">إدارة إعدادات النظام والعيادة</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p>صفحة الإعدادات فارغة حالياً</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
