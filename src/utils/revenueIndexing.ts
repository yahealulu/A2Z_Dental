// نظام فهرسة متقدم للإيرادات والدفعات

import { format, parseISO, isValid } from 'date-fns';
import { AdvancedIndexingEngine } from './advancedIndexing';

// نوع البيانات للدفعة مع معلومات إضافية
export interface EnhancedPayment {
  id: number;
  amount: number;
  paymentDate: string;
  patientId: number;
  patientName?: string;
  treatmentType?: string;
  notes?: string;
  category?: string; // للتوافق مع نظام الفهرسة
  description?: string; // للبحث النصي
}

// نوع البيانات لفهرس الإيرادات المتقدم
export interface RevenueIndexConfig {
  // فهارس زمنية متقدمة
  byQuarter: Map<string, EnhancedPayment[]>;
  bySemester: Map<string, EnhancedPayment[]>;
  byDayOfWeek: Map<string, EnhancedPayment[]>;
  byTimeOfDay: Map<string, EnhancedPayment[]>;
  
  // فهارس المرضى
  byPatient: Map<number, EnhancedPayment[]>;
  byPatientAndMonth: Map<string, Map<number, EnhancedPayment[]>>;
  
  // فهارس العلاجات
  byTreatmentType: Map<string, EnhancedPayment[]>;
  byTreatmentAndDate: Map<string, Map<string, EnhancedPayment[]>>;
  
  // فهارس الإحصائيات
  dailyTotals: Map<string, number>;
  monthlyTotals: Map<string, number>;
  patientTotals: Map<number, number>;
  treatmentTotals: Map<string, number>;
}

// فئة محرك فهرسة الإيرادات المتقدم
export class RevenueIndexingEngine {
  private advancedIndex: AdvancedIndexingEngine<EnhancedPayment>;
  private customIndex: RevenueIndexConfig;
  private payments: EnhancedPayment[];

  constructor(payments: EnhancedPayment[]) {
    this.payments = payments;
    this.customIndex = this.createEmptyCustomIndex();
    
    // تحويل البيانات لتتوافق مع AdvancedIndexingEngine
    const adaptedPayments = payments.map(payment => ({
      ...payment,
      date: payment.paymentDate // تحويل paymentDate إلى date
    }));

    // إنشاء الفهرس المتقدم
    this.advancedIndex = new AdvancedIndexingEngine(
      adaptedPayments,
      (payment) => [
        payment.patientName,
        payment.treatmentType,
        payment.notes,
        payment.amount.toString()
      ].filter(Boolean).join(' ')
    );
    
    this.buildCustomIndex();
  }

  // إنشاء فهرس مخصص فارغ
  private createEmptyCustomIndex(): RevenueIndexConfig {
    return {
      byQuarter: new Map(),
      bySemester: new Map(),
      byDayOfWeek: new Map(),
      byTimeOfDay: new Map(),
      byPatient: new Map(),
      byPatientAndMonth: new Map(),
      byTreatmentType: new Map(),
      byTreatmentAndDate: new Map(),
      dailyTotals: new Map(),
      monthlyTotals: new Map(),
      patientTotals: new Map(),
      treatmentTotals: new Map()
    };
  }

  // بناء الفهرس المخصص
  private buildCustomIndex(): void {
    this.customIndex = this.createEmptyCustomIndex();
    
    this.payments.forEach(payment => {
      this.indexPayment(payment);
    });
  }

  // فهرسة دفعة واحدة
  private indexPayment(payment: EnhancedPayment): void {
    // التحقق من وجود تاريخ الدفعة
    if (!payment.paymentDate) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Payment missing paymentDate:', payment);
      }
      return;
    }

    try {
      const date = parseISO(payment.paymentDate);

      // التحقق من صحة التاريخ
      if (!isValid(date)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid payment date:', payment.paymentDate, 'for payment:', payment);
        }
        return;
      }
    
    // فهرسة زمنية متقدمة
    this.indexByAdvancedTime(payment, date);
    
    // فهرسة المرضى
    this.indexByPatient(payment);
    
    // فهرسة العلاجات
    this.indexByTreatment(payment);
    
      // فهرسة الإحصائيات
      this.indexStatistics(payment);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error indexing payment:', error, 'for payment:', payment);
      }
    }
  }

  // فهرسة زمنية متقدمة
  private indexByAdvancedTime(payment: EnhancedPayment, date: Date): void {
    // فهرسة بالربع
    const quarter = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    if (!this.customIndex.byQuarter.has(quarter)) {
      this.customIndex.byQuarter.set(quarter, []);
    }
    this.customIndex.byQuarter.get(quarter)!.push(payment);

    // فهرسة بالنصف سنوي
    const semester = `${date.getFullYear()}-S${date.getMonth() < 6 ? 1 : 2}`;
    if (!this.customIndex.bySemester.has(semester)) {
      this.customIndex.bySemester.set(semester, []);
    }
    this.customIndex.bySemester.get(semester)!.push(payment);

    // فهرسة بيوم الأسبوع
    const dayOfWeek = date.getDay().toString();
    if (!this.customIndex.byDayOfWeek.has(dayOfWeek)) {
      this.customIndex.byDayOfWeek.set(dayOfWeek, []);
    }
    this.customIndex.byDayOfWeek.get(dayOfWeek)!.push(payment);

    // فهرسة بوقت اليوم (صباح، ظهر، مساء)
    const hour = date.getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';
    
    if (!this.customIndex.byTimeOfDay.has(timeOfDay)) {
      this.customIndex.byTimeOfDay.set(timeOfDay, []);
    }
    this.customIndex.byTimeOfDay.get(timeOfDay)!.push(payment);
  }

  // فهرسة المرضى
  private indexByPatient(payment: EnhancedPayment): void {
    // فهرسة بالمريض
    if (!this.customIndex.byPatient.has(payment.patientId)) {
      this.customIndex.byPatient.set(payment.patientId, []);
    }
    this.customIndex.byPatient.get(payment.patientId)!.push(payment);

    // فهرسة مريض + شهر
    const monthKey = format(parseISO(payment.paymentDate), 'yyyy-MM');
    if (!this.customIndex.byPatientAndMonth.has(monthKey)) {
      this.customIndex.byPatientAndMonth.set(monthKey, new Map());
    }
    const monthMap = this.customIndex.byPatientAndMonth.get(monthKey)!;
    if (!monthMap.has(payment.patientId)) {
      monthMap.set(payment.patientId, []);
    }
    monthMap.get(payment.patientId)!.push(payment);
  }

  // فهرسة العلاجات
  private indexByTreatment(payment: EnhancedPayment): void {
    if (!payment.treatmentType) return;

    // فهرسة بنوع العلاج
    if (!this.customIndex.byTreatmentType.has(payment.treatmentType)) {
      this.customIndex.byTreatmentType.set(payment.treatmentType, []);
    }
    this.customIndex.byTreatmentType.get(payment.treatmentType)!.push(payment);

    // فهرسة علاج + تاريخ
    const dateKey = format(parseISO(payment.paymentDate), 'yyyy-MM-dd');
    if (!this.customIndex.byTreatmentAndDate.has(payment.treatmentType)) {
      this.customIndex.byTreatmentAndDate.set(payment.treatmentType, new Map());
    }
    const treatmentMap = this.customIndex.byTreatmentAndDate.get(payment.treatmentType)!;
    if (!treatmentMap.has(dateKey)) {
      treatmentMap.set(dateKey, []);
    }
    treatmentMap.get(dateKey)!.push(payment);
  }

  // فهرسة الإحصائيات
  private indexStatistics(payment: EnhancedPayment): void {
    const dateKey = format(parseISO(payment.paymentDate), 'yyyy-MM-dd');
    const monthKey = format(parseISO(payment.paymentDate), 'yyyy-MM');

    // إجماليات يومية
    const currentDaily = this.customIndex.dailyTotals.get(dateKey) || 0;
    this.customIndex.dailyTotals.set(dateKey, currentDaily + payment.amount);

    // إجماليات شهرية
    const currentMonthly = this.customIndex.monthlyTotals.get(monthKey) || 0;
    this.customIndex.monthlyTotals.set(monthKey, currentMonthly + payment.amount);

    // إجماليات المرضى
    const currentPatient = this.customIndex.patientTotals.get(payment.patientId) || 0;
    this.customIndex.patientTotals.set(payment.patientId, currentPatient + payment.amount);

    // إجماليات العلاجات
    if (payment.treatmentType) {
      const currentTreatment = this.customIndex.treatmentTotals.get(payment.treatmentType) || 0;
      this.customIndex.treatmentTotals.set(payment.treatmentType, currentTreatment + payment.amount);
    }
  }

  // البحث المتقدم في الإيرادات
  public searchRevenue(
    query: string,
    options: {
      patientId?: number;
      treatmentType?: string;
      dateRange?: { start: string; end: string };
      amountRange?: { min: number; max: number };
      fuzzy?: boolean;
    } = {}
  ): EnhancedPayment[] {
    return this.advancedIndex.search(query, {
      ...options,
      category: options.treatmentType
    });
  }

  // الحصول على دفعات المريض
  public getPatientPayments(patientId: number, monthKey?: string): EnhancedPayment[] {
    if (monthKey) {
      const monthMap = this.customIndex.byPatientAndMonth.get(monthKey);
      return monthMap?.get(patientId) || [];
    }
    return this.customIndex.byPatient.get(patientId) || [];
  }

  // الحصول على دفعات العلاج
  public getTreatmentPayments(treatmentType: string, dateKey?: string): EnhancedPayment[] {
    if (dateKey) {
      const treatmentMap = this.customIndex.byTreatmentAndDate.get(treatmentType);
      return treatmentMap?.get(dateKey) || [];
    }
    return this.customIndex.byTreatmentType.get(treatmentType) || [];
  }

  // الحصول على الإيرادات بالربع
  public getQuarterlyRevenue(year: number, quarter: number): EnhancedPayment[] {
    const quarterKey = `${year}-Q${quarter}`;
    return this.customIndex.byQuarter.get(quarterKey) || [];
  }

  // الحصول على الإيرادات بالنصف سنوي
  public getSemesterRevenue(year: number, semester: number): EnhancedPayment[] {
    const semesterKey = `${year}-S${semester}`;
    return this.customIndex.bySemester.get(semesterKey) || [];
  }

  // الحصول على الإيرادات بيوم الأسبوع
  public getRevenueByDayOfWeek(dayOfWeek: number): EnhancedPayment[] {
    return this.customIndex.byDayOfWeek.get(dayOfWeek.toString()) || [];
  }

  // الحصول على الإيرادات بوقت اليوم
  public getRevenueByTimeOfDay(timeOfDay: 'morning' | 'afternoon' | 'evening'): EnhancedPayment[] {
    return this.customIndex.byTimeOfDay.get(timeOfDay) || [];
  }

  // الحصول على الإحصائيات السريعة
  public getQuickStats() {
    return {
      totalRevenue: Array.from(this.customIndex.dailyTotals.values()).reduce((sum, amount) => sum + amount, 0),
      totalDays: this.customIndex.dailyTotals.size,
      totalMonths: this.customIndex.monthlyTotals.size,
      totalPatients: this.customIndex.patientTotals.size,
      totalTreatmentTypes: this.customIndex.treatmentTotals.size,
      averageDailyRevenue: Array.from(this.customIndex.dailyTotals.values()).reduce((sum, amount) => sum + amount, 0) / this.customIndex.dailyTotals.size,
      topPatientRevenue: Math.max(...Array.from(this.customIndex.patientTotals.values())),
      topTreatmentRevenue: Math.max(...Array.from(this.customIndex.treatmentTotals.values()))
    };
  }

  // الحصول على أفضل المرضى
  public getTopPatients(limit: number = 10): Array<{ patientId: number; total: number }> {
    return Array.from(this.customIndex.patientTotals.entries())
      .map(([patientId, total]) => ({ patientId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  // الحصول على أفضل العلاجات
  public getTopTreatments(limit: number = 10): Array<{ treatmentType: string; total: number }> {
    return Array.from(this.customIndex.treatmentTotals.entries())
      .map(([treatmentType, total]) => ({ treatmentType, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  // تحديث البيانات
  public updateData(newPayments: EnhancedPayment[]): void {
    this.payments = newPayments;

    // تحويل البيانات لتتوافق مع AdvancedIndexingEngine
    const adaptedPayments = newPayments.map(payment => ({
      ...payment,
      date: payment.paymentDate // تحويل paymentDate إلى date
    }));

    this.advancedIndex.updateData(adaptedPayments);
    this.buildCustomIndex();
  }

  // الحصول على إحصائيات الفهرس
  public getIndexStats() {
    const advancedStats = this.advancedIndex.getIndexStats();
    return {
      ...advancedStats,
      customIndexes: {
        quarters: this.customIndex.byQuarter.size,
        semesters: this.customIndex.bySemester.size,
        patients: this.customIndex.byPatient.size,
        treatments: this.customIndex.byTreatmentType.size,
        dailyTotals: this.customIndex.dailyTotals.size,
        monthlyTotals: this.customIndex.monthlyTotals.size
      }
    };
  }
}
