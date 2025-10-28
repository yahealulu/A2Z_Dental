import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { Patient } from '../store/patientStore';

// فهرس البحث المحلي
interface SearchIndex {
  id: number;
  name: string;
  email?: string;
  address?: string;
  searchableText: string;
  nameTokens: string[];
}

// نتائج البحث مع النقاط
interface SearchResult {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

// خيارات البحث
interface SearchOptions {
  fuzzySearch?: boolean;
  maxResults?: number;
  minScore?: number;
  sortBy?: 'relevance' | 'name' | 'recent';
}

export const usePatientSearch = (patients: Patient[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isIndexing, setIsIndexing] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // بناء فهرس البحث
  const searchIndex = useMemo(() => {
    if (!patients.length) return [];
    
    setIsIndexing(true);
    
    const index: SearchIndex[] = patients.map(patient => {
      const searchableText = [
        patient.name,
        patient.email || '',
        patient.address || ''
      ].join(' ').toLowerCase();

      const nameTokens = patient.name.toLowerCase().split(/\s+/).filter(token => token.length > 0);

      return {
        id: patient.id,
        name: patient.name.toLowerCase(),
        email: patient.email?.toLowerCase(),
        address: patient.address?.toLowerCase(),
        searchableText,
        nameTokens
      };
    });

    setIsIndexing(false);
    return index;
  }, [patients]);

  // البحث المؤجل
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // دالة حساب النقاط للبحث الذكي
  const calculateScore = useCallback((index: SearchIndex, query: string): number => {
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
  }, []);

  // البحث الذكي مع النقاط
  const searchPatients = useCallback((
    query: string,
    options: SearchOptions = {}
  ): SearchResult[] => {
    const {
      maxResults = 50,
      minScore = 5,
      sortBy = 'relevance'
    } = options;

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
  }, [searchIndex, patients, calculateScore]);

  // البحث السريع (للاستخدام في الواجهة)
  const filteredPatients = useMemo(() => {
    const results = searchPatients(debouncedQuery);
    return results.map(result => result.patient);
  }, [searchPatients, debouncedQuery]);

  // إحصائيات البحث
  const searchStats = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return {
        totalResults: patients.length,
        searchTime: 0,
        hasResults: patients.length > 0
      };
    }

    const startTime = performance.now();
    const results = searchPatients(debouncedQuery);
    const endTime = performance.now();

    return {
      totalResults: results.length,
      searchTime: Math.round(endTime - startTime),
      hasResults: results.length > 0
    };
  }, [searchPatients, debouncedQuery, patients.length]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filteredPatients,
    searchPatients,
    searchStats,
    isIndexing,
    searchIndex: searchIndex.length
  };
};
