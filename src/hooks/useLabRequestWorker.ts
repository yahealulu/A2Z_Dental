import { useEffect, useRef, useCallback, useState } from 'react';
import type { LabRequest } from '../store/labRequestStore';

interface DeliveryStatus {
  type: 'overdue' | 'today' | 'tomorrow' | 'future';
  daysOverdue?: number;
  daysRemaining?: number;
  message: string;
  color: string;
}

export type LabRequestWithDeliveryStatus = Omit<LabRequest, 'status'> & { status: DeliveryStatus };

interface WorkerMessage {
  type: string;
  data: any;
}

interface FilterOptions {
  searchQuery?: string;
  labId?: number;
  workTypeId?: number;
  deliveryStatus?: string;
}

interface PaginationOptions {
  currentPage: number;
  pageSize: number;
}

export const useLabRequestWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // تهيئة Worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker('/workers/labRequestWorker.js');
        
        workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
          const { type, data } = e.data;
          
          switch (type) {
            case 'BATCH_PROGRESS':
              setProcessingProgress(data.percentage);
              break;
            case 'BATCH_PROCESSING_COMPLETE':
            case 'OVERDUE_REQUESTS_PROCESSED':
            case 'DELIVERY_STATUS_CALCULATED':
            case 'FILTER_AND_PAGINATE_COMPLETE':
              setIsProcessing(false);
              setProcessingProgress(0);
              break;
          }
        };
        
        workerRef.current.onerror = (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Worker error:', error);
          }
          setIsProcessing(false);
        };
        
        setIsWorkerReady(true);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to create worker:', error);
        }
        setIsWorkerReady(false);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // حساب حالة التسليم للطلبات
  const calculateDeliveryStatus = useCallback((
    requests: LabRequest[],
    callback: (results: Array<{ id: string; status: DeliveryStatus }>) => void
  ) => {
    if (!workerRef.current || !isWorkerReady) {
      // Fallback للحساب المحلي إذا لم يكن Worker متاحاً
      const results = requests.map(request => ({
        id: String(request.id),
        status: getDeliveryStatusFallback(request.expectedReturnDate)
      }));
      callback(results);
      return;
    }

    setIsProcessing(true);
    
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'DELIVERY_STATUS_CALCULATED') {
        workerRef.current?.removeEventListener('message', handleMessage);
        callback(e.data.data);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.postMessage({
      type: 'CALCULATE_DELIVERY_STATUS',
      data: requests
    });
  }, [isWorkerReady]);

  // معالجة الطلبات المتأخرة
  const processOverdueRequests = useCallback((
    requests: LabRequest[],
    callback: (data: {
      overdueRequests: LabRequestWithDeliveryStatus[];
      todayRequests: LabRequestWithDeliveryStatus[];
      overdueCount: number;
      todayCount: number;
    }) => void
  ) => {
    if (!workerRef.current || !isWorkerReady) {
      // Fallback للحساب المحلي
      const overdueRequests: LabRequestWithDeliveryStatus[] = [];
      const todayRequests: LabRequestWithDeliveryStatus[] = [];
      
      requests.forEach(request => {
        const status = getDeliveryStatusFallback(request.expectedReturnDate);
        if (status.type === 'overdue') {
          overdueRequests.push({ ...request, status });
        } else if (status.type === 'today') {
          todayRequests.push({ ...request, status });
        }
      });
      
      callback({
        overdueRequests,
        todayRequests,
        overdueCount: overdueRequests.length,
        todayCount: todayRequests.length
      });
      return;
    }

    setIsProcessing(true);
    
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'OVERDUE_REQUESTS_PROCESSED') {
        workerRef.current?.removeEventListener('message', handleMessage);
        callback(e.data.data);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.postMessage({
      type: 'PROCESS_OVERDUE_REQUESTS',
      data: requests
    });
  }, [isWorkerReady]);

  // تصفية وتقسيم الطلبات
  const filterAndPaginate = useCallback((
    requests: LabRequest[],
    filters: FilterOptions,
    pagination: PaginationOptions,
    callback: (data: {
      requests: LabRequestWithDeliveryStatus[];
      totalFiltered: number;
      totalPages: number;
      currentPage: number;
    }) => void
  ) => {
    if (!workerRef.current || !isWorkerReady) {
      // Fallback للمعالجة المحلية
      let filtered = requests;
      
      // تطبيق التصفية
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(request =>
          request.patientName.toLowerCase().includes(query) ||
          request.labName.toLowerCase().includes(query) ||
          request.workTypeName.toLowerCase().includes(query) ||
          request.color.toLowerCase().includes(query) ||
          request.notes?.toLowerCase().includes(query)
        );
      }
      
      if (filters.labId) {
        filtered = filtered.filter(request => request.labId === filters.labId);
      }
      
      if (filters.workTypeId) {
        filtered = filtered.filter(request => request.workTypeId === filters.workTypeId);
      }
      
      // تطبيق التقسيم
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedRequests = filtered.slice(startIndex, endIndex);
      
      // إضافة حالة التسليم
      const requestsWithStatus: LabRequestWithDeliveryStatus[] = paginatedRequests.map(request => ({
        ...request,
        status: getDeliveryStatusFallback(request.expectedReturnDate)
      }));
      
      callback({
        requests: requestsWithStatus,
        totalFiltered: filtered.length,
        totalPages: Math.ceil(filtered.length / pagination.pageSize),
        currentPage: pagination.currentPage
      });
      return;
    }

    setIsProcessing(true);
    
    const handleMessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'FILTER_AND_PAGINATE_COMPLETE') {
        workerRef.current?.removeEventListener('message', handleMessage);
        callback(e.data.data);
      }
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.postMessage({
      type: 'FILTER_AND_PAGINATE',
      data: { requests, filters, pagination }
    });
  }, [isWorkerReady]);

  return {
    isWorkerReady,
    isProcessing,
    processingProgress,
    calculateDeliveryStatus,
    processOverdueRequests,
    filterAndPaginate
  };
};

// دالة مساعدة للحساب المحلي (Fallback)
function getDeliveryStatusFallback(expectedReturnDate: string): DeliveryStatus {
  const today = new Date();
  const returnDate = new Date(expectedReturnDate);
  
  today.setHours(0, 0, 0, 0);
  returnDate.setHours(0, 0, 0, 0);
  
  const diffTime = returnDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      type: 'overdue',
      daysOverdue: Math.abs(diffDays),
      message: `متأخر ${Math.abs(diffDays)} يوم`,
      color: 'text-red-600 bg-red-50'
    };
  } else if (diffDays === 0) {
    return {
      type: 'today',
      message: 'اليوم',
      color: 'text-orange-600 bg-orange-50'
    };
  } else if (diffDays === 1) {
    return {
      type: 'tomorrow',
      message: 'غداً',
      color: 'text-yellow-600 bg-yellow-50'
    };
  } else {
    return {
      type: 'future',
      daysRemaining: diffDays,
      message: `${diffDays} يوم متبقي`,
      color: 'text-green-600 bg-green-50'
    };
  }
}
