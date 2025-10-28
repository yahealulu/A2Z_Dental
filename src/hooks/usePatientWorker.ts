import { useRef, useCallback, useEffect, useState } from 'react';
import type { Patient } from '../store/patientStore';

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

interface SearchResult {
  patient: Patient;
  score: number;
  matchedFields: string[];
}

interface PatientStats {
  total: number;
  male: number;
  female: number;
  withMedicalHistory: number;
  recentlyAdded: number;
  averageAge: number;
  ageDistribution: {
    '0-18': number;
    '19-30': number;
    '31-50': number;
    '51-70': number;
    '70+': number;
  };
}

export const usePatientWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, (result: any, error?: string) => void>>(new Map());
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // تهيئة Web Worker
  useEffect(() => {
    try {
      // إنشاء Worker من الملف
      const workerBlob = new Blob([
        `importScripts('${window.location.origin}/src/workers/patientWorker.ts');`
      ], { type: 'application/javascript' });
      
      // محاولة إنشاء Worker مباشرة من الكود
      const workerCode = `
        // Web Worker لمعالجة بيانات المرضى في الخلفية
        
        // ... (نسخ كامل من كود patientWorker.ts)
        // سيتم تضمين الكود هنا لضمان العمل
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      workerRef.current = new Worker(workerUrl);
      
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, payload, error } = e.data;
        const callback = pendingCallbacks.current.get(id);
        
        if (callback) {
          callback(payload, error);
          pendingCallbacks.current.delete(id);
        }
      };

      workerRef.current.onerror = (error) => {
        setWorkerError(`Worker error: ${error.message}`);
        setIsWorkerReady(false);
      };

      setIsWorkerReady(true);
      setWorkerError(null);

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          URL.revokeObjectURL(workerUrl);
        }
        pendingCallbacks.current.clear();
      };
    } catch (error) {
      setWorkerError(`Failed to create worker: ${error}`);
      setIsWorkerReady(false);
    }
  }, []);

  // إرسال رسالة للـ Worker
  const sendMessage = useCallback(<T>(
    type: WorkerMessage['type'],
    payload: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isWorkerReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      
      pendingCallbacks.current.set(id, (result, error) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      });

      const message: WorkerMessage = { type, payload, id };
      workerRef.current.postMessage(message);
    });
  }, [isWorkerReady]);

  // بناء فهرس البحث
  const buildIndex = useCallback(async (patients: Patient[]) => {
    try {
      const result = await sendMessage('BUILD_INDEX', { patients });
      return result;
    } catch (error) {
      console.error('Failed to build search index:', error);
      throw error;
    }
  }, [sendMessage]);

  // البحث في المرضى
  const searchPatients = useCallback(async (
    query: string,
    options: {
      maxResults?: number;
      minScore?: number;
      sortBy?: 'relevance' | 'name' | 'recent';
    } = {}
  ): Promise<SearchResult[]> => {
    try {
      const result = await sendMessage<SearchResult[]>('SEARCH', { query, options });
      return result;
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw error;
    }
  }, [sendMessage]);

  // حساب الإحصائيات
  const calculateStats = useCallback(async (patients: Patient[]): Promise<PatientStats> => {
    try {
      const result = await sendMessage<PatientStats>('CALCULATE_STATS', { patients });
      return result;
    } catch (error) {
      console.error('Failed to calculate stats:', error);
      throw error;
    }
  }, [sendMessage]);

  // ترتيب المرضى
  const sortPatients = useCallback(async (
    patients: Patient[],
    sortBy: string,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<Patient[]> => {
    try {
      const result = await sendMessage<Patient[]>('SORT_PATIENTS', { patients, sortBy, order });
      return result;
    } catch (error) {
      console.error('Failed to sort patients:', error);
      throw error;
    }
  }, [sendMessage]);

  // تصفية المرضى
  const filterPatients = useCallback(async (
    patients: Patient[],
    filters: {
      gender?: 'male' | 'female' | 'all';
      ageRange?: { min: number; max: number };
      hasMedicalHistory?: boolean;
      isActive?: boolean;
      hasRecentVisit?: boolean;
    }
  ): Promise<Patient[]> => {
    try {
      const result = await sendMessage<Patient[]>('FILTER_PATIENTS', { patients, filters });
      return result;
    } catch (error) {
      console.error('Failed to filter patients:', error);
      throw error;
    }
  }, [sendMessage]);

  // معلومات حالة Worker
  const workerStatus = {
    isReady: isWorkerReady,
    error: workerError,
    pendingOperations: pendingCallbacks.current.size
  };

  return {
    buildIndex,
    searchPatients,
    calculateStats,
    sortPatients,
    filterPatients,
    workerStatus
  };
};
