// Web Worker لمعالجة بيانات المرضى في الخلفية

interface Patient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  gender?: 'male' | 'female';
  address?: string;
  notes?: string;
  medicalHistory?: string;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

interface SearchIndex {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  searchableText: string;
  nameTokens: string[];
  phoneTokens: string[];
}

interface SearchResult {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

interface WorkerMessage {
  type: 'BUILD_INDEX' | 'SEARCH' | 'CALCULATE_STATS' | 'SORT_PATIENTS' | 'FILTER_PATIENTS';
  payload: any;
  id: string;
}

interface WorkerResponse {
  type: string;
  payload: any;
  id: string;
  error?: string;
}

// فهرس البحث المحلي
let searchIndex: SearchIndex[] = [];
let patients: Patient[] = [];

// بناء فهرس البحث
function buildSearchIndex(patientList: Patient[]): SearchIndex[] {
  patients = patientList;
  
  return patientList.map(patient => {
    const searchableText = [
      patient.name,
      patient.phone,
      patient.email || '',
      patient.address || ''
    ].join(' ').toLowerCase();

    const nameTokens = patient.name.toLowerCase().split(/\s+/).filter(token => token.length > 0);
    const phoneTokens = patient.phone.split(/\D+/).filter(token => token.length > 0);

    return {
      id: patient.id,
      name: patient.name.toLowerCase(),
      phone: patient.phone,
      email: patient.email?.toLowerCase(),
      address: patient.address?.toLowerCase(),
      searchableText,
      nameTokens,
      phoneTokens
    };
  });
}

// حساب النقاط للبحث الذكي
function calculateScore(index: SearchIndex, query: string): number {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) return 0;

  let score = 0;
  const queryTokens = queryLower.split(/\s+/);

  // البحث في الاسم (أعلى أولوية)
  if (index.name.includes(queryLower)) {
    score += 100;
    if (index.name.startsWith(queryLower)) {
      score += 50; // بداية الاسم
    }
  }

  // البحث في رموز الاسم
  queryTokens.forEach(token => {
    index.nameTokens.forEach(nameToken => {
      if (nameToken.startsWith(token)) {
        score += 30;
      } else if (nameToken.includes(token)) {
        score += 15;
      }
    });
  });

  // البحث في رقم الهاتف
  if (index.phone.includes(queryLower)) {
    score += 80;
    if (index.phone.startsWith(queryLower)) {
      score += 40;
    }
  }

  // البحث في رموز الهاتف
  queryTokens.forEach(token => {
    index.phoneTokens.forEach(phoneToken => {
      if (phoneToken.startsWith(token)) {
        score += 25;
      } else if (phoneToken.includes(token)) {
        score += 10;
      }
    });
  });

  // البحث في البريد الإلكتروني
  if (index.email && index.email.includes(queryLower)) {
    score += 40;
  }

  // البحث في العنوان
  if (index.address && index.address.includes(queryLower)) {
    score += 20;
  }

  // البحث العام في النص القابل للبحث
  if (index.searchableText.includes(queryLower)) {
    score += 10;
  }

  return score;
}

// البحث الذكي
function searchPatients(query: string, options: {
  maxResults?: number;
  minScore?: number;
  sortBy?: 'relevance' | 'name' | 'recent';
} = {}): SearchResult[] {
  const { maxResults = 50, minScore = 5, sortBy = 'relevance' } = options;

  if (!query.trim()) {
    return patients.map(patient => ({
      patient,
      score: 0,
      matchedFields: []
    }));
  }

  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase().trim();

  searchIndex.forEach(index => {
    const patient = patients.find(p => p.id === index.id);
    if (!patient) return;

    const score = calculateScore(index, query);
    if (score >= minScore) {
      const matchedFields: string[] = [];
      
      if (index.name.includes(queryLower)) matchedFields.push('name');
      if (index.phone.includes(queryLower)) matchedFields.push('phone');
      if (index.email && index.email.includes(queryLower)) matchedFields.push('email');
      if (index.address && index.address.includes(queryLower)) matchedFields.push('address');

      results.push({
        patient,
        score,
        matchedFields
      });
    }
  });

  // ترتيب النتائج
  results.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.patient.name.localeCompare(b.patient.name);
      case 'recent':
        const aDate = new Date(a.patient.createdAt || 0);
        const bDate = new Date(b.patient.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      case 'relevance':
      default:
        return b.score - a.score;
    }
  });

  return results.slice(0, maxResults);
}

// حساب الإحصائيات
function calculateStats(patientList: Patient[]) {
  const activePatients = patientList.filter(p => p.isActive !== false);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    total: activePatients.length,
    male: activePatients.filter(p => p.gender === 'male').length,
    female: activePatients.filter(p => p.gender === 'female').length,
    withMedicalHistory: activePatients.filter(p => p.medicalHistory && p.medicalHistory.trim().length > 0).length,
    recentlyAdded: activePatients.filter(p =>
      p.createdAt && new Date(p.createdAt) > thirtyDaysAgo
    ).length,
    averageAge: calculateAverageAge(activePatients),
    ageDistribution: calculateAgeDistribution(activePatients)
  };
}

// حساب متوسط العمر
function calculateAverageAge(patientList: Patient[]): number {
  const patientsWithAge = patientList.filter(p => p.birthDate);
  if (patientsWithAge.length === 0) return 0;

  const totalAge = patientsWithAge.reduce((sum, patient) => {
    const age = calculateAge(patient.birthDate!);
    return sum + age;
  }, 0);

  return Math.round(totalAge / patientsWithAge.length);
}

// حساب توزيع الأعمار
function calculateAgeDistribution(patientList: Patient[]) {
  const distribution = {
    '0-18': 0,
    '19-30': 0,
    '31-50': 0,
    '51-70': 0,
    '70+': 0
  };

  patientList.forEach(patient => {
    if (!patient.birthDate) return;
    
    const age = calculateAge(patient.birthDate);
    if (age <= 18) distribution['0-18']++;
    else if (age <= 30) distribution['19-30']++;
    else if (age <= 50) distribution['31-50']++;
    else if (age <= 70) distribution['51-70']++;
    else distribution['70+']++;
  });

  return distribution;
}

// حساب العمر
function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// ترتيب المرضى
function sortPatients(patientList: Patient[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Patient[] {
  const sorted = [...patientList].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'age':
        const ageA = a.birthDate ? calculateAge(a.birthDate) : 0;
        const ageB = b.birthDate ? calculateAge(b.birthDate) : 0;
        comparison = ageA - ageB;
        break;
      case 'createdAt':
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        comparison = dateA.getTime() - dateB.getTime();
        break;
      case 'lastVisit':
        const visitA = a.lastVisit || '';
        const visitB = b.lastVisit || '';
        comparison = visitA.localeCompare(visitB);
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

// تصفية المرضى
function filterPatients(patientList: Patient[], filters: {
  gender?: 'male' | 'female' | 'all';
  ageRange?: { min: number; max: number };
  hasMedicalHistory?: boolean;
  isActive?: boolean;
  hasRecentVisit?: boolean;
}): Patient[] {
  return patientList.filter(patient => {
    // تصفية حسب الجنس
    if (filters.gender && filters.gender !== 'all' && patient.gender !== filters.gender) {
      return false;
    }

    // تصفية حسب العمر
    if (filters.ageRange && patient.birthDate) {
      const age = calculateAge(patient.birthDate);
      if (age < filters.ageRange.min || age > filters.ageRange.max) {
        return false;
      }
    }

    // تصفية حسب التاريخ الطبي
    if (filters.hasMedicalHistory !== undefined) {
      const hasHistory = patient.medicalHistory && typeof patient.medicalHistory === 'string' && patient.medicalHistory.trim().length > 0;
      if (filters.hasMedicalHistory !== hasHistory) {
        return false;
      }
    }

    // تصفية حسب الحالة النشطة
    if (filters.isActive !== undefined && patient.isActive !== filters.isActive) {
      return false;
    }

    // تصفية حسب الزيارة الحديثة
    if (filters.hasRecentVisit !== undefined) {
      const hasRecentVisit = patient.lastVisit && patient.lastVisit.trim().length > 0;
      if (filters.hasRecentVisit !== hasRecentVisit) {
        return false;
      }
    }

    return true;
  });
}

// معالج الرسائل
self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { type, payload, id } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'BUILD_INDEX':
        searchIndex = buildSearchIndex(payload.patients);
        result = { indexSize: searchIndex.length };
        break;

      case 'SEARCH':
        result = searchPatients(payload.query, payload.options);
        break;

      case 'CALCULATE_STATS':
        result = calculateStats(payload.patients);
        break;

      case 'SORT_PATIENTS':
        result = sortPatients(payload.patients, payload.sortBy, payload.order);
        break;

      case 'FILTER_PATIENTS':
        result = filterPatients(payload.patients, payload.filters);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      payload: result,
      id
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      payload: null,
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    self.postMessage(response);
  }
};
