import { useState } from 'react';
import { UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useStaffStore } from '../store/staffStore';
import { notify } from '../store/notificationStore';

const Staff = () => {
  const { getStaffList, getOwner, getNurses, addNurse, updateNursePermissions } = useStaffStore();
  const [showAddNurse, setShowAddNurse] = useState(false);
  const [nurseName, setNurseName] = useState('');
  const staff = getStaffList();
  const owner = getOwner();
  const nurses = getNurses();

  const handleAddNurse = async () => {
    if (!nurseName.trim()) {
      notify.error('اسم الممرضة مطلوب');
      return;
    }
    try {
      await addNurse({ name: nurseName.trim() });
      setNurseName('');
      setShowAddNurse(false);
      notify.success('تمت إضافة الممرضة');
    } catch (e) {
      notify.error((e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">طاقم العيادة</h1>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">حساب الطبيب (مالك العيادة)</h2>
        {owner && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <UserIcon className="h-8 w-8 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">{owner.name}</p>
              <p className="text-sm text-gray-500">مالك العيادة</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">الممرضات</h2>
          <button
            type="button"
            onClick={() => setShowAddNurse(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            <UserPlusIcon className="h-5 w-5" />
            إضافة ممرضة
          </button>
        </div>

        {showAddNurse && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex gap-2 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                value={nurseName}
                onChange={e => setNurseName(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 w-48"
                placeholder="اسم الممرضة"
              />
            </div>
            <button type="button" onClick={handleAddNurse} className="px-4 py-2 rounded-lg bg-primary-600 text-white">حفظ</button>
            <button type="button" onClick={() => { setShowAddNurse(false); setNurseName(''); }} className="px-4 py-2 rounded-lg border border-gray-300">إلغاء</button>
          </div>
        )}

        {nurses.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {nurses.map(u => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <span className="text-sm text-gray-500">ممرضة</span>
                </div>
                <span className="text-xs text-gray-400">الصلاحيات: {u.permissions?.length ? u.permissions.join(', ') : '—'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">لا توجد ممرضات. استخدم «إضافة ممرضة» لإضافة حسابات الممرضات.</p>
        )}
      </div>
    </div>
  );
};

export default Staff;
