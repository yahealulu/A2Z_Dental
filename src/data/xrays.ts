// نموذج بيانات الصور الشعاعية
export interface XRay {
  id: number;
  patientId: number;
  type: XRayType;
  imageUrl: string;
  date: string;
  notes?: string;
}

// أنواع الصور الشعاعية
export type XRayType = 'panorama' | 'cephalometric' | 'periapical' | 'cbct' | 'occlusal' | 'bitewing';

// ترجمة أنواع الصور الشعاعية
export const xrayTypeNames: Record<XRayType, string> = {
  'panorama': 'بانوراما',
  'cephalometric': 'سيفالوميتريك',
  'periapical': 'ذروية',
  'cbct': 'CBCT',
  'occlusal': 'إطباقية',
  'bitewing': 'مجنحة'
};

// قائمة بأنواع الصور الشعاعية للاختيار
export const xrayTypeOptions = [
  { value: 'panorama', label: 'بانوراما' },
  { value: 'cephalometric', label: 'سيفالوميتريك' },
  { value: 'periapical', label: 'ذروية' },
  { value: 'cbct', label: 'CBCT' },
  { value: 'occlusal', label: 'إطباقية' },
  { value: 'bitewing', label: 'مجنحة' }
];
