import { Tooth } from './model.tooth';
import { ISOTeeth } from './types';

// تعريف واجهة المريض
interface PatientSchema {
  id: number;
  name: string;
  phone: string;
  email: string;
  birthdate: string;
  gender: 'male' | 'female';
  address: string;
  notes: string;
  lastVisit?: string;
  medicalHistory: string[];
  teeth: Record<number, Tooth>;
}

// تصدير الواجهة
export type { PatientSchema };

// متغير عام لتتبع آخر معرف مستخدم
let lastPatientId = 0;

// دالة للحصول على معرف جديد للمريض
export function getNextPatientId(): number {
  return ++lastPatientId;
}

// دالة لتعيين آخر معرف مستخدم (تستخدم عند تحميل البيانات من قاعدة البيانات)
export function setLastPatientId(id: number): void {
  if (id > lastPatientId) {
    lastPatientId = id;
  }
}

// دالة للحصول على آخر زيارة للمريض من المواعيد
export function getLastVisitDate(patientId: number, appointments: any[]): string | undefined {
  // ترتيب المواعيد المكتملة للمريض حسب التاريخ (الأحدث أولاً)
  const completedAppointments = appointments
    .filter(app => app.patientId === patientId && app.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // إذا كان هناك مواعيد مكتملة، أعد تاريخ آخر موعد
  if (completedAppointments.length > 0) {
    const lastAppointment = completedAppointments[0];
    return `${lastAppointment.date} - ${lastAppointment.time}`;
  }

  return undefined;
}

export class Patient implements PatientSchema {
  id: number;
  name: string = '';
  phone: string = '';
  email: string = '';
  birthdate: string = '';
  gender: 'male' | 'female' = 'male';
  address: string = '';
  notes: string = '';
  lastVisit?: string;
  medicalHistory: string[] = [];
  teeth: Record<number, Tooth> = {};

  constructor() {
    // تعيين معرف فريد تلقائيًا
    this.id = getNextPatientId();

    // تهيئة الأسنان
    this.initializeTeeth();
  }

  // تهيئة الأسنان
  initializeTeeth() {
    // تهيئة الأسنان الدائمة
    for (const ISO of ISOTeeth.permanent) {
      this.teeth[ISO] = new Tooth(this).fromISO(ISO);
    }

    // تهيئة الأسنان اللبنية
    for (const ISO of ISOTeeth.deciduous) {
      this.teeth[ISO] = new Tooth(this).fromISO(ISO);
    }
  }

  // تحويل إلى JSON للحفظ
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      birthdate: this.birthdate,
      gender: this.gender,
      address: this.address,
      notes: this.notes,
      lastVisit: this.lastVisit,
      medicalHistory: [...this.medicalHistory],
      teeth: Object.values(this.teeth)
        .filter(tooth => tooth.notes.length > 0)
        .map(tooth => tooth.toJSON())
    };
  }

  // تحميل من JSON
  fromJSON(json: any): Patient {
    this.id = json.id;
    this.name = json.name;
    this.phone = json.phone;
    this.email = json.email;
    this.birthdate = json.birthdate;
    this.gender = json.gender;
    this.address = json.address;
    this.notes = json.notes;
    this.lastVisit = json.lastVisit;
    this.medicalHistory = Array.isArray(json.medicalHistory) ? json.medicalHistory : [];

    // تهيئة الأسنان أولاً
    this.initializeTeeth();

    // ثم تحميل بيانات الأسنان من JSON
    if (json.teeth && Array.isArray(json.teeth)) {
      json.teeth.forEach((toothData: any) => {
        if (toothData && toothData.ISO) {
          const tooth = new Tooth(this).fromJSON(toothData);
          this.teeth[tooth.ISO] = tooth;
        }
      });
    }

    return this;
  }
}
