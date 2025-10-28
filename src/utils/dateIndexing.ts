import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

// نوع البيانات للفهرس الزمني
export interface DateIndex<T> {
  byDate: Map<string, T[]>;
  byMonth: Map<string, T[]>;
  byYear: Map<string, T[]>;
  byWeek: Map<string, T[]>;
  sortedDates: string[];
  lastUpdate: number;
}

// نوع البيانات لنطاق التاريخ
export interface DateRange {
  start: string;
  end: string;
}

// نوع البيانات للإحصائيات الزمنية
export interface DateRangeStats {
  totalItems: number;
  dateRange: DateRange;
  itemsPerDay: Map<string, number>;
  itemsPerMonth: Map<string, number>;
  itemsPerYear: Map<string, number>;
}

// إنشاء فهرس زمني محسن
export class OptimizedDateIndex<T extends { date?: string; paymentDate?: string }> {
  private index: DateIndex<T>;
  private getDateField: (item: T) => string;

  constructor(getDateField: (item: T) => string) {
    this.getDateField = getDateField;
    this.index = {
      byDate: new Map(),
      byMonth: new Map(),
      byYear: new Map(),
      byWeek: new Map(),
      sortedDates: [],
      lastUpdate: 0
    };
  }

  // بناء الفهرس من البيانات
  buildIndex(items: T[]): void {
    // مسح الفهرس القديم
    this.clearIndex();

    const dateSet = new Set<string>();

    items.forEach(item => {
      const dateStr = this.getDateField(item);
      if (!dateStr) return;

      const date = parseISO(dateStr);
      const dayKey = format(date, 'yyyy-MM-dd');
      const monthKey = format(date, 'yyyy-MM');
      const yearKey = format(date, 'yyyy');
      const weekKey = format(date, 'yyyy-ww');

      // فهرسة يومية
      if (!this.index.byDate.has(dayKey)) {
        this.index.byDate.set(dayKey, []);
      }
      this.index.byDate.get(dayKey)!.push(item);
      dateSet.add(dayKey);

      // فهرسة شهرية
      if (!this.index.byMonth.has(monthKey)) {
        this.index.byMonth.set(monthKey, []);
      }
      this.index.byMonth.get(monthKey)!.push(item);

      // فهرسة سنوية
      if (!this.index.byYear.has(yearKey)) {
        this.index.byYear.set(yearKey, []);
      }
      this.index.byYear.get(yearKey)!.push(item);

      // فهرسة أسبوعية
      if (!this.index.byWeek.has(weekKey)) {
        this.index.byWeek.set(weekKey, []);
      }
      this.index.byWeek.get(weekKey)!.push(item);
    });

    // ترتيب التواريخ
    this.index.sortedDates = Array.from(dateSet).sort();
    this.index.lastUpdate = Date.now();
  }

  // مسح الفهرس
  private clearIndex(): void {
    this.index.byDate.clear();
    this.index.byMonth.clear();
    this.index.byYear.clear();
    this.index.byWeek.clear();
    this.index.sortedDates = [];
  }

  // الحصول على البيانات حسب التاريخ
  getByDate(date: string): T[] {
    return this.index.byDate.get(date) || [];
  }

  // الحصول على البيانات حسب الشهر
  getByMonth(year: number, month: number): T[] {
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return this.index.byMonth.get(monthKey) || [];
  }

  // الحصول على البيانات حسب السنة
  getByYear(year: number): T[] {
    return this.index.byYear.get(year.toString()) || [];
  }

  // الحصول على البيانات في نطاق زمني
  getByDateRange(startDate: string, endDate: string): T[] {
    const result: T[] = [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    this.index.sortedDates.forEach(dateStr => {
      const date = parseISO(dateStr);
      if (date >= start && date <= end) {
        result.push(...this.getByDate(dateStr));
      }
    });

    return result;
  }

  // البحث السريع في التواريخ المرتبة
  findNearestDates(targetDate: string, count: number = 5): string[] {
    const targetIndex = this.index.sortedDates.indexOf(targetDate);
    if (targetIndex === -1) {
      // إذا لم يوجد التاريخ، ابحث عن أقرب تاريخ
      const target = parseISO(targetDate);
      let closestIndex = 0;
      let minDiff = Math.abs(parseISO(this.index.sortedDates[0]).getTime() - target.getTime());

      for (let i = 1; i < this.index.sortedDates.length; i++) {
        const diff = Math.abs(parseISO(this.index.sortedDates[i]).getTime() - target.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }

      const start = Math.max(0, closestIndex - Math.floor(count / 2));
      const end = Math.min(this.index.sortedDates.length, start + count);
      return this.index.sortedDates.slice(start, end);
    }

    const start = Math.max(0, targetIndex - Math.floor(count / 2));
    const end = Math.min(this.index.sortedDates.length, start + count);
    return this.index.sortedDates.slice(start, end);
  }

  // الحصول على إحصائيات النطاق الزمني
  getDateRangeStats(startDate?: string, endDate?: string): DateRangeStats {
    const items = startDate && endDate 
      ? this.getByDateRange(startDate, endDate)
      : Array.from(this.index.byDate.values()).flat();

    const itemsPerDay = new Map<string, number>();
    const itemsPerMonth = new Map<string, number>();
    const itemsPerYear = new Map<string, number>();

    items.forEach(item => {
      const dateStr = this.getDateField(item);
      if (!dateStr) return;

      const date = parseISO(dateStr);
      const dayKey = format(date, 'yyyy-MM-dd');
      const monthKey = format(date, 'yyyy-MM');
      const yearKey = format(date, 'yyyy');

      itemsPerDay.set(dayKey, (itemsPerDay.get(dayKey) || 0) + 1);
      itemsPerMonth.set(monthKey, (itemsPerMonth.get(monthKey) || 0) + 1);
      itemsPerYear.set(yearKey, (itemsPerYear.get(yearKey) || 0) + 1);
    });

    const actualStartDate = startDate || this.index.sortedDates[0] || format(new Date(), 'yyyy-MM-dd');
    const actualEndDate = endDate || this.index.sortedDates[this.index.sortedDates.length - 1] || format(new Date(), 'yyyy-MM-dd');

    return {
      totalItems: items.length,
      dateRange: {
        start: actualStartDate,
        end: actualEndDate
      },
      itemsPerDay,
      itemsPerMonth,
      itemsPerYear
    };
  }

  // الحصول على معلومات الفهرس
  getIndexInfo() {
    return {
      totalDates: this.index.sortedDates.length,
      totalMonths: this.index.byMonth.size,
      totalYears: this.index.byYear.size,
      totalWeeks: this.index.byWeek.size,
      dateRange: this.index.sortedDates.length > 0 ? {
        start: this.index.sortedDates[0],
        end: this.index.sortedDates[this.index.sortedDates.length - 1]
      } : null,
      lastUpdate: new Date(this.index.lastUpdate).toLocaleString()
    };
  }

  // التحقق من صحة الفهرس
  isIndexValid(maxAge: number = 300000): boolean { // 5 دقائق افتراضياً
    return Date.now() - this.index.lastUpdate < maxAge;
  }
}

// دوال مساعدة للتواريخ
export const dateUtils = {
  // تحويل التاريخ إلى مفاتيح مختلفة
  toDateKey: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  },

  toMonthKey: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM');
  },

  toYearKey: (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy');
  },

  // الحصول على نطاق الشهر
  getMonthRange: (year: number, month: number): DateRange => {
    const date = new Date(year, month - 1, 1);
    return {
      start: format(startOfMonth(date), 'yyyy-MM-dd'),
      end: format(endOfMonth(date), 'yyyy-MM-dd')
    };
  },

  // الحصول على نطاق السنة
  getYearRange: (year: number): DateRange => {
    const date = new Date(year, 0, 1);
    return {
      start: format(startOfYear(date), 'yyyy-MM-dd'),
      end: format(endOfYear(date), 'yyyy-MM-dd')
    };
  },

  // التحقق من وجود التاريخ في النطاق
  isDateInRange: (date: string, range: DateRange): boolean => {
    return date >= range.start && date <= range.end;
  }
};
