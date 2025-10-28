import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { memoryManager, formatBytes, isMemoryPressure, type MemoryStats } from '../utils/memoryManager';
import { useComponentCleanup } from '../hooks/useMemoryLeakPrevention';

interface MemoryMonitorProps {
  onManualCleanup?: () => void;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ onManualCleanup }) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // تنظيف Memory Leaks عند إلغاء تحميل المكون
  useComponentCleanup('MemoryMonitor');
  const [isExpanded, setIsExpanded] = useState(false);

  // تحديث إحصائيات الذاكرة كل 30 ثانية
  useEffect(() => {
    const updateStats = () => {
      setMemoryStats(memoryManager.getMemoryStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, []);

  // إظهار المراقب فقط في بيئة التطوير وعند ضغط الذاكرة العالي
  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isHighMemoryPressure = memoryStats?.warningLevel === 'high' || memoryStats?.isOverLimit;

    // إظهار فقط في التطوير أو عند ضغط ذاكرة عالي جداً
    const shouldShow = isDevelopment && isHighMemoryPressure;
    setIsVisible(shouldShow);
  }, [memoryStats]);

  const handleManualCleanup = () => {
    const result = memoryManager.performGlobalCleanup();
    if (process.env.NODE_ENV === 'development') {
      console.log('Manual cleanup performed:', result);
    }

    if (onManualCleanup) {
      onManualCleanup();
    }

    // تحديث الإحصائيات فوراً
    setMemoryStats(memoryManager.getMemoryStats());
  };

  if (!isVisible || !memoryStats) {
    return null;
  }

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getWarningIcon = (level: string) => {
    if (level === 'high' || level === 'medium') {
      return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
    return <ChartBarIcon className="h-4 w-4" />;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* مؤشر مصغر */}
      <div 
        className={`rounded-lg border-2 cursor-pointer transition-all duration-300 ${getWarningColor(memoryStats.warningLevel)} ${
          isExpanded ? 'w-80' : 'w-auto'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {!isExpanded ? (
          // العرض المصغر
          <div className="p-2 flex items-center gap-2">
            {getWarningIcon(memoryStats.warningLevel)}
            <span className="text-xs font-medium">
              {formatBytes(memoryStats.totalCacheSize * 1024 * 1024)}
            </span>
            <EyeIcon className="h-3 w-3" />
          </div>
        ) : (
          // العرض المفصل
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getWarningIcon(memoryStats.warningLevel)}
                <span className="text-sm font-semibold">مراقب الذاكرة</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualCleanup();
                  }}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                  title="تنظيف يدوي"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                  <EyeSlashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {/* الإحصائيات العامة */}
              <div className="flex justify-between">
                <span>الحجم الكلي:</span>
                <span className="font-mono">
                  {formatBytes(memoryStats.totalCacheSize * 1024 * 1024)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>العناصر الكلية:</span>
                <span className="font-mono">{memoryStats.totalItems}</span>
              </div>

              {/* تفصيل الـ cache */}
              <div className="border-t pt-2 mt-2">
                <div className="text-xs font-medium mb-1">تفصيل الـ Cache:</div>
                {Object.entries(memoryStats.cacheBreakdown).map(([type, stats]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="truncate">{type}:</span>
                    <span className="font-mono">
                      {stats.items} ({formatBytes(stats.size)})
                    </span>
                  </div>
                ))}
              </div>

              {/* مؤشر الحالة */}
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      memoryStats.warningLevel === 'high' ? 'bg-red-500' :
                      memoryStats.warningLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                  <span className="text-xs">
                    {memoryStats.isOverLimit ? 'تجاوز الحد' : 
                     memoryStats.warningLevel === 'medium' ? 'تحذير' : 'طبيعي'}
                  </span>
                </div>
              </div>

              {/* رسالة تحذيرية */}
              {memoryStats.isOverLimit && (
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs text-red-600 font-medium">
                    ⚠️ تم تجاوز حد الذاكرة المسموح
                  </div>
                  <div className="text-xs text-red-500 mt-1">
                    سيتم التنظيف التلقائي قريباً
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* نصائح للمطور */}
      {process.env.NODE_ENV === 'development' && isExpanded && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="font-medium mb-1">💡 نصائح للمطور:</div>
          <ul className="text-xs space-y-1">
            <li>• اضغط على 🗑️ للتنظيف اليدوي</li>
            <li>• التنظيف التلقائي كل 10-15 دقيقة</li>
            <li>• الحد الأقصى: 50MB</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MemoryMonitor;
