// Web Worker لمعالجة طلبات المخبر في الخلفية
// يتم استخدامه لحساب الطلبات المتأخرة والمطلوب تسليمها اليوم

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'CALCULATE_DELIVERY_STATUS':
      calculateDeliveryStatus(data);
      break;
    case 'PROCESS_OVERDUE_REQUESTS':
      processOverdueRequests(data);
      break;
    case 'BATCH_PROCESS_REQUESTS':
      batchProcessRequests(data);
      break;
    default:
      // إزالة console.warn في الإنتاج
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.warn('Unknown worker message type:', type);
      }
  }
};

// حساب حالة التسليم لطلب واحد
function getDeliveryStatus(expectedReturnDate) {
  const today = new Date();
  const returnDate = new Date(expectedReturnDate);
  
  // إزالة الوقت للمقارنة بالتاريخ فقط
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

// حساب حالة التسليم لمجموعة من الطلبات
function calculateDeliveryStatus(requests) {
  const results = requests.map(request => ({
    id: request.id,
    status: getDeliveryStatus(request.expectedReturnDate)
  }));
  
  self.postMessage({
    type: 'DELIVERY_STATUS_CALCULATED',
    data: results
  });
}

// معالجة الطلبات المتأخرة
function processOverdueRequests(requests) {
  const overdueRequests = [];
  const todayRequests = [];
  
  requests.forEach(request => {
    const status = getDeliveryStatus(request.expectedReturnDate);
    
    if (status.type === 'overdue') {
      overdueRequests.push({
        ...request,
        status
      });
    } else if (status.type === 'today') {
      todayRequests.push({
        ...request,
        status
      });
    }
  });
  
  self.postMessage({
    type: 'OVERDUE_REQUESTS_PROCESSED',
    data: {
      overdueRequests,
      todayRequests,
      overdueCount: overdueRequests.length,
      todayCount: todayRequests.length
    }
  });
}

// معالجة مجموعية للطلبات (Batch Processing)
function batchProcessRequests(data) {
  const { requests, batchSize = 50 } = data;
  const results = [];
  
  // معالجة الطلبات في مجموعات صغيرة لتجنب blocking
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchResults = batch.map(request => ({
      id: request.id,
      patientName: request.patientName,
      labName: request.labName,
      workTypeName: request.workTypeName,
      expectedReturnDate: request.expectedReturnDate,
      status: getDeliveryStatus(request.expectedReturnDate)
    }));
    
    results.push(...batchResults);
    
    // إرسال تحديث للتقدم
    self.postMessage({
      type: 'BATCH_PROGRESS',
      data: {
        processed: i + batch.length,
        total: requests.length,
        percentage: Math.round(((i + batch.length) / requests.length) * 100)
      }
    });
  }
  
  self.postMessage({
    type: 'BATCH_PROCESSING_COMPLETE',
    data: results
  });
}

// دالة مساعدة لتصفية الطلبات
function filterRequests(requests, filters) {
  return requests.filter(request => {
    // تصفية البحث النصي
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = 
        request.patientName.toLowerCase().includes(query) ||
        request.labName.toLowerCase().includes(query) ||
        request.workTypeName.toLowerCase().includes(query) ||
        request.color.toLowerCase().includes(query) ||
        (request.notes && request.notes.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // تصفية المخبر
    if (filters.labId && request.labId !== filters.labId) {
      return false;
    }
    
    // تصفية نوع العمل
    if (filters.workTypeId && request.workTypeId !== filters.workTypeId) {
      return false;
    }
    
    // تصفية حالة التسليم
    if (filters.deliveryStatus && filters.deliveryStatus !== 'all') {
      const status = getDeliveryStatus(request.expectedReturnDate);
      if (status.type !== filters.deliveryStatus) {
        return false;
      }
    }
    
    return true;
  });
}

// معالجة التصفية والتقسيم
self.addEventListener('message', function(e) {
  if (e.data.type === 'FILTER_AND_PAGINATE') {
    const { requests, filters, pagination } = e.data.data;
    
    // تطبيق التصفية
    const filteredRequests = filterRequests(requests, filters);
    
    // تطبيق التقسيم
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    
    // حساب حالة التسليم للطلبات المعروضة فقط
    const requestsWithStatus = paginatedRequests.map(request => ({
      ...request,
      status: getDeliveryStatus(request.expectedReturnDate)
    }));
    
    self.postMessage({
      type: 'FILTER_AND_PAGINATE_COMPLETE',
      data: {
        requests: requestsWithStatus,
        totalFiltered: filteredRequests.length,
        totalPages: Math.ceil(filteredRequests.length / pagination.pageSize),
        currentPage: pagination.currentPage
      }
    });
  }
});

// إزالة console.log في الإنتاج
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
  console.log('Lab Request Worker initialized successfully');
}
