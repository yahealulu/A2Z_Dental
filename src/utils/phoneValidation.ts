/**
 * Country calling code and expected digit length for phone validation.
 * Default Syria +963 with 9 digits.
 */
export interface CountryPhoneRule {
  code: string;   // e.g. "+963"
  digits: number; // number of digits after the code
  name: string;
}

export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  { code: '+963', digits: 9, name: 'سوريا' },
  { code: '+966', digits: 9, name: 'السعودية' },
  { code: '+971', digits: 9, name: 'الإمارات' },
  { code: '+962', digits: 9, name: 'الأردن' },
  { code: '+961', digits: 8, name: 'لبنان' },
  { code: '+964', digits: 10, name: 'العراق' },
  { code: '+20', digits: 10, name: 'مصر' },
  { code: '+90', digits: 10, name: 'تركيا' },
  { code: '+1', digits: 10, name: 'الولايات المتحدة/كندا' },
  { code: '+44', digits: 10, name: 'بريطانيا' },
  { code: '+33', digits: 9, name: 'فرنسا' },
  { code: '+49', digits: 10, name: 'ألمانيا' },
  { code: '+39', digits: 9, name: 'إيطاليا' },
  { code: '+34', digits: 9, name: 'إسبانيا' },
  { code: '+31', digits: 9, name: 'هولندا' },
  { code: '+32', digits: 9, name: 'بلجيكا' },
  { code: '+41', digits: 9, name: 'سويسرا' },
  { code: '+43', digits: 10, name: 'النمسا' },
  { code: '+46', digits: 9, name: 'السويد' },
  { code: '+47', digits: 8, name: 'النرويج' },
  { code: '+45', digits: 8, name: 'الدنمارك' },
  { code: '+358', digits: 9, name: 'فنلندا' },
  { code: '+353', digits: 9, name: 'أيرلندا' },
  { code: '+351', digits: 9, name: 'البرتغال' },
  { code: '+30', digits: 10, name: 'اليونان' },
  { code: '+48', digits: 9, name: 'بولندا' },
  { code: '+7', digits: 10, name: 'روسيا' },
  { code: '+81', digits: 10, name: 'اليابان' },
  { code: '+86', digits: 11, name: 'الصين' },
  { code: '+91', digits: 10, name: 'الهند' },
  { code: '+61', digits: 9, name: 'أستراليا' },
  { code: '+27', digits: 9, name: 'جنوب أفريقيا' },
  { code: '+212', digits: 9, name: 'المغرب' },
  { code: '+213', digits: 9, name: 'الجزائر' },
  { code: '+216', digits: 8, name: 'تونس' },
  { code: '+218', digits: 10, name: 'ليبيا' },
  { code: '+249', digits: 9, name: 'السودان' },
  { code: '+966', digits: 9, name: 'السعودية' },
  { code: '+973', digits: 8, name: 'البحرين' },
  { code: '+965', digits: 8, name: 'الكويت' },
  { code: '+974', digits: 8, name: 'قطر' },
  { code: '+968', digits: 8, name: 'عمان' },
  { code: '+967', digits: 9, name: 'اليمن' },
  { code: '+970', digits: 9, name: 'فلسطين' }
];

const DEFAULT_COUNTRY = COUNTRY_PHONE_RULES[0]; // Syria

export function getCountryByCode(code: string): CountryPhoneRule | undefined {
  return COUNTRY_PHONE_RULES.find(c => c.code === code);
}

export function getDefaultCountry(): CountryPhoneRule {
  return DEFAULT_COUNTRY;
}

/**
 * Validate national digits (without country code) for a given country.
 */
export function validatePhoneNational(countryCode: string, nationalDigits: string): { valid: boolean; error?: string } {
  const country = getCountryByCode(countryCode) ?? DEFAULT_COUNTRY;
  const digitsOnly = nationalDigits.replace(/\D/g, '');
  if (digitsOnly.length === 0) return { valid: false, error: 'رقم الهاتف مطلوب' };
  if (digitsOnly.length < country.digits) return { valid: false, error: `رقم غير مكتمل (يجب ${country.digits} أرقام)` };
  if (digitsOnly.length > country.digits) return { valid: false, error: `أرقام زائدة (يجب ${country.digits} أرقام فقط)` };
  return { valid: true };
}

/**
 * Format full phone for display: +963 9xx xxx xxx
 */
export function formatPhoneDisplay(countryCode: string, nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, '');
  if (!digits) return '';
  return `${countryCode} ${digits}`;
}
