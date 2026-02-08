import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import type { Expense } from '../store/expenseStore';
import { AdvancedIndexingEngine } from './advancedIndexing';

// نوع البيانات للفلاتر المتقدمة
export interface AdvancedExpenseFilters {
  // التصفية الأساسية
  category?: string;
  isPaid?: boolean;
  searchTerm?: string;
  
  // التصفية بالتاريخ
  dateFrom?: string;
  dateTo?: string;
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  
  // التصفية بالمبلغ
  amountMin?: number;
  amountMax?: number;
  amountRange?: 'low' | 'medium' | 'high' | 'custom';
  
  // التصفية المتقدمة
  categories?: string[];
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

// نوع البيانات للفهرس المحسن
export interface ExpenseFilterIndex {
  byCategory: Map<string, Expense[]>;
  byPaymentStatus: Map<boolean, Expense[]>;
  byDateRange: Map<string, Expense[]>;
  byAmountRange: Map<string, Expense[]>;
  searchIndex: Map<string, Set<number>>; // فهرس البحث النصي
  lastUpdate: number;
}

// فئات المبالغ المحددة مسبقاً
export const AMOUNT_RANGES = {
  low: { min: 0, max: 50000, label: 'منخفض (أقل من 50,000)' },
  medium: { min: 50000, max: 200000, label: 'متوسط (50,000 - 200,000)' },
  high: { min: 200000, max: Infinity, label: 'عالي (أكثر من 200,000)' }
};

// نطاقات التاريخ المحددة مسبقاً
export const getDateRanges = () => {
  const today = new Date();
  const startOfToday = format(today, 'yyyy-MM-dd');
  const startOfWeek = format(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const startOfMonthDate = format(startOfMonth(today), 'yyyy-MM-dd');
  const endOfMonthDate = format(endOfMonth(today), 'yyyy-MM-dd');
  const startOfQuarter = format(new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1), 'yyyy-MM-dd');
  const startOfYear = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
  
  return {
    today: { start: startOfToday, end: startOfToday, label: 'اليوم' },
    week: { start: startOfWeek, end: startOfToday, label: 'آخر 7 أيام' },
    month: { start: startOfMonthDate, end: endOfMonthDate, label: 'هذا الشهر' },
    quarter: { start: startOfQuarter, end: startOfToday, label: 'هذا الربع' },
    year: { start: startOfYear, end: startOfToday, label: 'هذا العام' }
  };
};

// فئة لإدارة فهرسة وتصفية المصروفات المحسنة
export class ExpenseFilterEngine {
  private index: ExpenseFilterIndex;
  private expenses: Expense[];
  private advancedIndex: AdvancedIndexingEngine<Expense>;

  constructor(expenses: Expense[]) {
    this.expenses = expenses;
    this.index = {
      byCategory: new Map(),
      byPaymentStatus: new Map(),
      byDateRange: new Map(),
      byAmountRange: new Map(),
      searchIndex: new Map(),
      lastUpdate: 0
    };

    // إنشاء الفهرس المتقدم
    this.advancedIndex = new AdvancedIndexingEngine(
      expenses,
      (expense) => [(expense as Expense & { description?: string }).description, expense.category].filter(Boolean).join(' ')
    );

    this.buildIndex();
  }

  // بناء الفهرس الشامل
  private buildIndex(): void {
    this.clearIndex();
    
    this.expenses.forEach((expense, expenseIndex) => {
      // فهرسة حسب الفئة
      if (!this.index.byCategory.has(expense.category)) {
        this.index.byCategory.set(expense.category, []);
      }
      this.index.byCategory.get(expense.category)!.push(expense);

      // فهرسة حسب حالة الدفع
      if (!this.index.byPaymentStatus.has(expense.isPaid)) {
        this.index.byPaymentStatus.set(expense.isPaid, []);
      }
      this.index.byPaymentStatus.get(expense.isPaid)!.push(expense);

      // فهرسة حسب نطاق المبلغ
      const amountRange = this.getAmountRangeKey(expense.amount);
      if (!this.index.byAmountRange.has(amountRange)) {
        this.index.byAmountRange.set(amountRange, []);
      }
      this.index.byAmountRange.get(amountRange)!.push(expense);

      // فهرسة البحث النصي
      this.indexSearchTerms(expense, expenseIndex);
    });

    this.index.lastUpdate = Date.now();
  }

  // مسح الفهرس
  private clearIndex(): void {
    this.index.byCategory.clear();
    this.index.byPaymentStatus.clear();
    this.index.byDateRange.clear();
    this.index.byAmountRange.clear();
    this.index.searchIndex.clear();
  }

  // فهرسة مصطلحات البحث
  private indexSearchTerms(expense: Expense, expenseIndex: number): void {
    const searchableText = [
      (expense as Expense & { description?: string }).description,
      expense.category,
      expense.amount.toString()
    ].join(' ').toLowerCase();

    // تقسيم النص إلى كلمات وفهرستها
    const words = searchableText.split(/\s+/).filter(word => word.length > 1);
    
    words.forEach(word => {
      if (!this.index.searchIndex.has(word)) {
        this.index.searchIndex.set(word, new Set());
      }
      this.index.searchIndex.get(word)!.add(expenseIndex);
    });
  }

  // تحديد نطاق المبلغ
  private getAmountRangeKey(amount: number): string {
    if (amount < AMOUNT_RANGES.low.max) return 'low';
    if (amount < AMOUNT_RANGES.medium.max) return 'medium';
    return 'high';
  }

  // البحث النصي المحسن باستخدام الفهرس المتقدم
  private searchByText(searchTerm: string): Set<number> {
    if (!searchTerm || searchTerm.length < 2) {
      return new Set(this.expenses.map((_, index) => index));
    }

    // استخدام الفهرس المتقدم للبحث
    const results = this.advancedIndex.search(searchTerm, {
      fuzzy: true // تفعيل البحث الضبابي
    });

    // تحويل النتائج إلى فهارس
    const resultIndexes = new Set<number>();
    results.forEach(expense => {
      const index = this.expenses.findIndex(e => e.id === expense.id);
      if (index !== -1) {
        resultIndexes.add(index);
      }
    });

    return resultIndexes;
  }

  // بحث متقدم مع خيارات إضافية
  public advancedSearch(
    searchTerm: string,
    options: {
      exact?: boolean;
      fuzzy?: boolean;
      category?: string;
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
    } = {}
  ): Expense[] {
    return this.advancedIndex.search(searchTerm, options);
  }

  // تطبيق التصفية المتقدمة
  public applyFilters(filters: AdvancedExpenseFilters): Expense[] {
    let filteredExpenses = [...this.expenses];

    // التصفية حسب الفئة
    if (filters.category) {
      filteredExpenses = this.index.byCategory.get(filters.category) || [];
    }

    // التصفية حسب الفئات المتعددة
    if (filters.categories && filters.categories.length > 0) {
      const categoryExpenses = new Set<Expense>();
      filters.categories.forEach(category => {
        const expenses = this.index.byCategory.get(category) || [];
        expenses.forEach(expense => categoryExpenses.add(expense));
      });
      filteredExpenses = filteredExpenses.filter(expense => categoryExpenses.has(expense));
    }

    // التصفية حسب حالة الدفع
    if (filters.isPaid !== undefined) {
      const statusExpenses = this.index.byPaymentStatus.get(filters.isPaid) || [];
      filteredExpenses = filteredExpenses.filter(expense => statusExpenses.includes(expense));
    }

    // التصفية حسب نطاق التاريخ
    if (filters.dateRange && filters.dateRange !== 'custom') {
      const dateRanges = getDateRanges();
      const range = dateRanges[filters.dateRange];
      if (range) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.date >= range.start && expense.date <= range.end
        );
      }
    } else if (filters.dateFrom || filters.dateTo) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = expense.date;
        const afterStart = !filters.dateFrom || expenseDate >= filters.dateFrom;
        const beforeEnd = !filters.dateTo || expenseDate <= filters.dateTo;
        return afterStart && beforeEnd;
      });
    }

    // التصفية حسب نطاق المبلغ
    if (filters.amountRange && filters.amountRange !== 'custom') {
      const range = AMOUNT_RANGES[filters.amountRange];
      if (range) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.amount >= range.min && expense.amount < range.max
        );
      }
    } else if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const aboveMin = filters.amountMin === undefined || expense.amount >= filters.amountMin;
        const belowMax = filters.amountMax === undefined || expense.amount <= filters.amountMax;
        return aboveMin && belowMax;
      });
    }

    // البحث النصي
    if (filters.searchTerm) {
      const searchIndexes = this.searchByText(filters.searchTerm);
      filteredExpenses = filteredExpenses.filter((_, index) => 
        searchIndexes.has(this.expenses.indexOf(_))
      );
    }

    // الترتيب
    if (filters.sortBy) {
      filteredExpenses.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'category':
            comparison = a.category.localeCompare(b.category);
            break;
        }
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filteredExpenses;
  }

  // الحصول على إحصائيات التصفية
  public getFilterStats(): {
    totalExpenses: number;
    categoryCounts: Record<string, number>;
    paymentStatusCounts: { paid: number; unpaid: number };
    amountRangeCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    this.index.byCategory.forEach((expenses, category) => {
      categoryCounts[category] = expenses.length;
    });

    const paidExpenses = this.index.byPaymentStatus.get(true) || [];
    const unpaidExpenses = this.index.byPaymentStatus.get(false) || [];

    const amountRangeCounts: Record<string, number> = {};
    this.index.byAmountRange.forEach((expenses, range) => {
      amountRangeCounts[range] = expenses.length;
    });

    return {
      totalExpenses: this.expenses.length,
      categoryCounts,
      paymentStatusCounts: {
        paid: paidExpenses.length,
        unpaid: unpaidExpenses.length
      },
      amountRangeCounts
    };
  }

  // الحصول على البيانات بالفهرس المتقدم
  public getByAdvancedIndex(
    indexType: 'byDate' | 'byMonth' | 'byYear' | 'byWeek',
    key: string
  ): Expense[] {
    return this.advancedIndex.getByIndex(indexType, key);
  }

  // الحصول على البيانات المركبة (تاريخ + فئة)
  public getByDateAndCategory(date: string, category: string): Expense[] {
    const fullIndex = this.advancedIndex.getFullIndex();
    const dateMap = fullIndex.byDateAndCategory.get(date);
    return dateMap?.get(category) || [];
  }

  // الحصول على البيانات المركبة (شهر + فئة)
  public getByMonthAndCategory(month: string, category: string): Expense[] {
    const fullIndex = this.advancedIndex.getFullIndex();
    const monthMap = fullIndex.byMonthAndCategory.get(month);
    return monthMap?.get(category) || [];
  }

  // الحصول على البيانات المركبة (حالة + فئة)
  public getByStatusAndCategory(isPaid: boolean, category: string): Expense[] {
    const fullIndex = this.advancedIndex.getFullIndex();
    const statusKey = isPaid ? 'paid' : 'unpaid';
    const statusMap = fullIndex.byStatusAndCategory.get(statusKey);
    return statusMap?.get(category) || [];
  }

  // الحصول على البيانات مرتبة
  public getSortedExpenses(sortBy: 'amount' | 'date'): Expense[] {
    const fullIndex = this.advancedIndex.getFullIndex();
    return sortBy === 'amount' ? fullIndex.sortedByAmount : fullIndex.sortedByDate;
  }

  // الحصول على إحصائيات الفهرس المتقدم
  public getAdvancedIndexStats() {
    return this.advancedIndex.getIndexStats();
  }

  // البحث السريع بالمعرف
  public getById(id: number): Expense | undefined {
    const fullIndex = this.advancedIndex.getFullIndex();
    return fullIndex.byId.get(id);
  }

  // الحصول على المصروفات في نطاق مبلغ
  public getByAmountRange(rangeKey: string): Expense[] {
    const fullIndex = this.advancedIndex.getFullIndex();
    return fullIndex.amountRangeIndex.get(rangeKey) || [];
  }

  // تحديث البيانات
  public updateExpenses(newExpenses: Expense[]): void {
    this.expenses = newExpenses;
    this.advancedIndex.updateData(newExpenses);
    this.buildIndex();
  }
}
