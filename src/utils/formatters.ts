/**
 * دوال مساعدة لتنسيق البيانات في التطبيق
 */

/**
 * تنسيق الأرقام بإضافة فواصل بين كل ثلاثة أرقام
 * مثال: 1000 -> 1,000
 * @param value الرقم المراد تنسيقه
 * @returns الرقم بعد التنسيق كنص
 */
export const formatNumber = (value: number | string | undefined | null): string => {
  // التحقق من وجود القيمة
  if (value === undefined || value === null || value === '') {
    return '0';
  }

  // تحويل القيمة إلى نص إذا كانت رقماً
  const numStr = typeof value === 'number' ? value.toString() : value.toString();

  // إضافة فواصل بين كل ثلاثة أرقام
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * تنسيق المبلغ المالي مع إضافة رمز العملة
 * @param amount المبلغ المالي
 * @param currency رمز العملة (افتراضياً: أ.ل.س)
 * @returns المبلغ المالي منسقاً مع رمز العملة
 */
export const formatCurrency = (amount: number | string | undefined | null, currency: string = 'أ.ل.س'): string => {
  // التحقق من وجود المبلغ
  if (amount === undefined || amount === null || amount === '') {
    return `0 ${currency}`;
  }

  return `${formatNumber(amount)} ${currency}`;
};
