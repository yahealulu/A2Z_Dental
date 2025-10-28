// نظام فهرسة متقدم للبيانات

import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isValid } from 'date-fns';

// نوع البيانات للفهرس المتقدم
export interface AdvancedIndex<T> {
  // فهارس أساسية
  byId: Map<number, T>;
  byDate: Map<string, T[]>;
  byMonth: Map<string, T[]>;
  byYear: Map<string, T[]>;
  byWeek: Map<string, T[]>;
  
  // فهارس مركبة
  byDateAndCategory: Map<string, Map<string, T[]>>;
  byMonthAndCategory: Map<string, Map<string, T[]>>;
  byStatusAndCategory: Map<string, Map<string, T[]>>;
  
  // فهرس البحث النصي المحسن
  textIndex: Map<string, Set<number>>;
  wordIndex: Map<string, Set<number>>;
  phraseIndex: Map<string, Set<number>>;
  
  // فهارس رقمية
  amountRangeIndex: Map<string, T[]>;
  sortedByAmount: T[];
  sortedByDate: T[];
  
  // إحصائيات الفهرس
  stats: {
    totalItems: number;
    lastUpdate: number;
    indexSize: number;
    buildTime: number;
  };
}

// إعدادات الفهرسة
export const INDEXING_CONFIG = {
  // حد أدنى لطول الكلمة في البحث النصي
  MIN_WORD_LENGTH: 2,
  
  // حد أقصى لعدد الكلمات في العبارة
  MAX_PHRASE_LENGTH: 5,
  
  // نطاقات المبالغ للفهرسة
  AMOUNT_RANGES: [
    { key: 'very-low', min: 0, max: 10000, label: 'منخفض جداً' },
    { key: 'low', min: 10000, max: 50000, label: 'منخفض' },
    { key: 'medium', min: 50000, max: 100000, label: 'متوسط' },
    { key: 'high', min: 100000, max: 500000, label: 'عالي' },
    { key: 'very-high', min: 500000, max: Infinity, label: 'عالي جداً' }
  ],
  
  // كلمات يتم تجاهلها في البحث
  STOP_WORDS: ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك']
};

// فئة محرك الفهرسة المتقدم
export class AdvancedIndexingEngine<T extends { 
  id: number; 
  date: string; 
  category?: string; 
  amount?: number; 
  description?: string;
  isPaid?: boolean;
}> {
  private index: AdvancedIndex<T>;
  private data: T[];
  private getSearchableText: (item: T) => string;

  constructor(
    data: T[], 
    getSearchableText: (item: T) => string = (item) => 
      [item.description, item.category].filter(Boolean).join(' ')
  ) {
    this.data = data;
    this.getSearchableText = getSearchableText;
    this.index = this.createEmptyIndex();
    this.buildIndex();
  }

  // إنشاء فهرس فارغ
  private createEmptyIndex(): AdvancedIndex<T> {
    return {
      byId: new Map(),
      byDate: new Map(),
      byMonth: new Map(),
      byYear: new Map(),
      byWeek: new Map(),
      byDateAndCategory: new Map(),
      byMonthAndCategory: new Map(),
      byStatusAndCategory: new Map(),
      textIndex: new Map(),
      wordIndex: new Map(),
      phraseIndex: new Map(),
      amountRangeIndex: new Map(),
      sortedByAmount: [],
      sortedByDate: [],
      stats: {
        totalItems: 0,
        lastUpdate: 0,
        indexSize: 0,
        buildTime: 0
      }
    };
  }

  // بناء الفهرس الشامل
  private buildIndex(): void {
    const startTime = Date.now();
    
    // مسح الفهرس القديم
    this.index = this.createEmptyIndex();
    
    // بناء الفهارس الأساسية
    this.data.forEach(item => {
      this.indexItem(item);
    });
    
    // بناء الفهارس المرتبة
    this.buildSortedIndexes();
    
    // حساب الإحصائيات
    this.updateStats(startTime);
  }

  // فهرسة عنصر واحد
  private indexItem(item: T): void {
    // فهرسة بالمعرف
    this.index.byId.set(item.id, item);
    
    // فهرسة بالتاريخ
    this.indexByDate(item);
    
    // فهرسة بالفئة
    this.indexByCategory(item);
    
    // فهرسة بالمبلغ
    this.indexByAmount(item);
    
    // فهرسة نصية
    this.indexByText(item);
    
    // فهرسة مركبة
    this.indexComposite(item);
  }

  // فهرسة بالتاريخ
  private indexByDate(item: T): void {
    // التحقق من وجود التاريخ
    if (!item.date) {
      console.warn('Item missing date:', item);
      return;
    }

    try {
      const date = parseISO(item.date);

      // التحقق من صحة التاريخ
      if (!isValid(date)) {
        console.warn('Invalid date:', item.date, 'for item:', item);
        return;
      }

      const dateKey = format(date, 'yyyy-MM-dd');
      const monthKey = format(date, 'yyyy-MM');
      const yearKey = format(date, 'yyyy');
      const weekKey = format(startOfWeek(date), 'yyyy-MM-dd');

    // فهرسة يومية
    if (!this.index.byDate.has(dateKey)) {
      this.index.byDate.set(dateKey, []);
    }
    this.index.byDate.get(dateKey)!.push(item);

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
    } catch (error) {
      console.error('Error indexing by date:', error, 'for item:', item);
    }
  }

  // فهرسة بالفئة
  private indexByCategory(item: T): void {
    if (!item.category || !item.date) return;

    try {
      const category = item.category;
      const date = parseISO(item.date);

      // التحقق من صحة التاريخ
      if (!isValid(date)) {
        console.warn('Invalid date for category indexing:', item.date, 'for item:', item);
        return;
      }

      const dateKey = format(date, 'yyyy-MM-dd');
      const monthKey = format(date, 'yyyy-MM');
    
    // فهرسة تاريخ + فئة
    if (!this.index.byDateAndCategory.has(dateKey)) {
      this.index.byDateAndCategory.set(dateKey, new Map());
    }
    const dateMap = this.index.byDateAndCategory.get(dateKey)!;
    if (!dateMap.has(category)) {
      dateMap.set(category, []);
    }
    dateMap.get(category)!.push(item);

    // فهرسة شهر + فئة
    if (!this.index.byMonthAndCategory.has(monthKey)) {
      this.index.byMonthAndCategory.set(monthKey, new Map());
    }
    const monthMap = this.index.byMonthAndCategory.get(monthKey)!;
    if (!monthMap.has(category)) {
      monthMap.set(category, []);
    }
    monthMap.get(category)!.push(item);

    // فهرسة حالة + فئة
    if (item.isPaid !== undefined) {
      const statusKey = item.isPaid ? 'paid' : 'unpaid';
      if (!this.index.byStatusAndCategory.has(statusKey)) {
        this.index.byStatusAndCategory.set(statusKey, new Map());
      }
      const statusMap = this.index.byStatusAndCategory.get(statusKey)!;
      if (!statusMap.has(category)) {
        statusMap.set(category, []);
      }
      statusMap.get(category)!.push(item);
    }
    } catch (error) {
      console.error('Error indexing by category:', error, 'for item:', item);
    }
  }

  // فهرسة بالمبلغ
  private indexByAmount(item: T): void {
    if (item.amount === undefined) return;

    const amount = item.amount;
    const range = INDEXING_CONFIG.AMOUNT_RANGES.find(r => 
      amount >= r.min && amount < r.max
    );

    if (range) {
      if (!this.index.amountRangeIndex.has(range.key)) {
        this.index.amountRangeIndex.set(range.key, []);
      }
      this.index.amountRangeIndex.get(range.key)!.push(item);
    }
  }

  // فهرسة نصية متقدمة
  private indexByText(item: T): void {
    const text = this.getSearchableText(item).toLowerCase();
    const words = this.extractWords(text);
    const phrases = this.extractPhrases(words);

    // فهرسة الكلمات
    words.forEach(word => {
      if (!this.index.wordIndex.has(word)) {
        this.index.wordIndex.set(word, new Set());
      }
      this.index.wordIndex.get(word)!.add(item.id);
    });

    // فهرسة العبارات
    phrases.forEach(phrase => {
      if (!this.index.phraseIndex.has(phrase)) {
        this.index.phraseIndex.set(phrase, new Set());
      }
      this.index.phraseIndex.get(phrase)!.add(item.id);
    });

    // فهرسة النص الكامل
    if (!this.index.textIndex.has(text)) {
      this.index.textIndex.set(text, new Set());
    }
    this.index.textIndex.get(text)!.add(item.id);
  }

  // استخراج الكلمات
  private extractWords(text: string): string[] {
    return text
      .split(/\s+/)
      .map(word => word.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9]/g, ''))
      .filter(word => 
        word.length >= INDEXING_CONFIG.MIN_WORD_LENGTH && 
        !INDEXING_CONFIG.STOP_WORDS.includes(word)
      );
  }

  // استخراج العبارات
  private extractPhrases(words: string[]): string[] {
    const phrases: string[] = [];
    
    for (let i = 0; i < words.length; i++) {
      for (let j = 2; j <= Math.min(INDEXING_CONFIG.MAX_PHRASE_LENGTH, words.length - i); j++) {
        const phrase = words.slice(i, i + j).join(' ');
        phrases.push(phrase);
      }
    }
    
    return phrases;
  }

  // فهرسة مركبة
  private indexComposite(item: T): void {
    // يمكن إضافة فهارس مركبة أخرى هنا حسب الحاجة
    // مثل: تاريخ + مبلغ، فئة + مبلغ، إلخ
  }

  // بناء الفهارس المرتبة
  private buildSortedIndexes(): void {
    // ترتيب بالمبلغ
    this.index.sortedByAmount = [...this.data]
      .filter(item => item.amount !== undefined)
      .sort((a, b) => (a.amount || 0) - (b.amount || 0));

    // ترتيب بالتاريخ
    this.index.sortedByDate = [...this.data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // تحديث الإحصائيات
  private updateStats(startTime: number): void {
    const endTime = Date.now();
    const indexSize = this.calculateIndexSize();
    
    this.index.stats = {
      totalItems: this.data.length,
      lastUpdate: endTime,
      indexSize,
      buildTime: endTime - startTime
    };
  }

  // حساب حجم الفهرس
  private calculateIndexSize(): number {
    let size = 0;
    
    // حساب تقريبي لحجم الفهارس
    size += this.index.byId.size * 50; // تقدير متوسط
    size += this.index.byDate.size * 100;
    size += this.index.wordIndex.size * 30;
    size += this.index.phraseIndex.size * 50;
    
    return size;
  }

  // البحث المتقدم
  public search(query: string, options: {
    fuzzy?: boolean;
    exact?: boolean;
    category?: string;
    dateRange?: { start: string; end: string };
    amountRange?: { min: number; max: number };
  } = {}): T[] {
    const results = new Set<number>();
    const queryLower = query.toLowerCase();
    const words = this.extractWords(queryLower);

    if (options.exact) {
      // بحث دقيق
      this.index.textIndex.forEach((ids, text) => {
        if (text.includes(queryLower)) {
          ids.forEach(id => results.add(id));
        }
      });
    } else {
      // بحث بالكلمات
      words.forEach(word => {
        this.index.wordIndex.forEach((ids, indexedWord) => {
          if (options.fuzzy ? this.isFuzzyMatch(word, indexedWord) : indexedWord.includes(word)) {
            ids.forEach(id => results.add(id));
          }
        });
      });
    }

    // تطبيق فلاتر إضافية
    let filteredResults = Array.from(results)
      .map(id => this.index.byId.get(id)!)
      .filter(Boolean);

    if (options.category) {
      filteredResults = filteredResults.filter(item => item.category === options.category);
    }

    if (options.dateRange) {
      filteredResults = filteredResults.filter(item => 
        item.date >= options.dateRange!.start && item.date <= options.dateRange!.end
      );
    }

    if (options.amountRange && filteredResults[0]?.amount !== undefined) {
      filteredResults = filteredResults.filter(item => 
        (item.amount || 0) >= options.amountRange!.min && 
        (item.amount || 0) <= options.amountRange!.max
      );
    }

    return filteredResults;
  }

  // مطابقة ضبابية بسيطة
  private isFuzzyMatch(query: string, target: string): boolean {
    if (query.length <= 2) return target.includes(query);
    
    const threshold = Math.floor(query.length * 0.8);
    let matches = 0;
    
    for (let i = 0; i < query.length; i++) {
      if (target.includes(query[i])) {
        matches++;
      }
    }
    
    return matches >= threshold;
  }

  // الحصول على البيانات بالفهرس
  public getByIndex(indexType: keyof AdvancedIndex<T>, key: string): T[] {
    const indexMap = this.index[indexType] as Map<string, T[]>;
    return indexMap.get(key) || [];
  }

  // الحصول على إحصائيات الفهرس
  public getIndexStats() {
    return {
      ...this.index.stats,
      indexBreakdown: {
        byDate: this.index.byDate.size,
        byMonth: this.index.byMonth.size,
        byYear: this.index.byYear.size,
        wordIndex: this.index.wordIndex.size,
        phraseIndex: this.index.phraseIndex.size,
        amountRanges: this.index.amountRangeIndex.size
      }
    };
  }

  // تحديث البيانات وإعادة بناء الفهرس
  public updateData(newData: T[]): void {
    this.data = newData;
    this.buildIndex();
  }

  // الحصول على الفهرس الكامل (للاستخدام المتقدم)
  public getFullIndex(): AdvancedIndex<T> {
    return this.index;
  }
}
