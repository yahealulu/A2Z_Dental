# توثيق مشروع عيادة الأسنان - Dental Clinic System

## نظرة عامة على المشروع

هذا مشروع نظام إدارة عيادة أسنان شامل مبني بتقنيات حديثة لإدارة المرضى والمواعيد والعلاجات والمدفوعات. النظام مصمم ليكون سريع وموثوق مع واجهة مستخدم عربية احترافية.

---

## القسم الأول: هيكل المشروع وملفات التكوين

### 🏗️ التقنيات والأدوات المستخدمة

#### **Frontend Framework**

- **React 19.1.0** - مكتبة واجهة المستخدم الرئيسية
- **TypeScript 5.8.3** - للكتابة الآمنة والتطوير المحسن
- **Vite 6.3.5** - أداة البناء والتطوير السريعة

#### **UI & Styling**

- **Tailwind CSS 3.3.3** - إطار عمل CSS للتصميم السريع
- **Headless UI 2.2.2** - مكونات UI قابلة للوصول
- **Heroicons 2.2.0** - مجموعة أيقونات احترافية
- **PostCSS & Autoprefixer** - معالجة CSS المتقدمة

#### **State Management & Routing**

- **Zustand 5.0.4** - إدارة الحالة البسيطة والفعالة
- **React Router DOM 7.6.0** - التنقل بين الصفحات

#### **Utilities & Performance**

- **date-fns 4.1.0** - معالجة التواريخ
- **Dexie 4.0.11** - قاعدة بيانات IndexedDB محسنة

### 📁 هيكل المجلدات الرئيسية

```
dentist-main/
├── src/                    # الكود المصدري الرئيسي
│   ├── components/         # المكونات القابلة لإعادة الاستخدام
│   ├── pages/             # صفحات التطبيق الرئيسية
│   ├── store/             # إدارة الحالة (Zustand stores)
│   ├── utils/             # الدوال المساعدة والأدوات
│   ├── hooks/             # React Hooks مخصصة
│   ├── data/              # نماذج البيانات والأنواع
│   ├── styles/            # ملفات التصميم
│   └── workers/           # Web Workers للأداء
├── public/                # الملفات العامة
├── docs/                  # التوثيق
└── electron/              # إعدادات Electron (للتطبيق المكتبي)
```

### ⚙️ ملفات التكوين الرئيسية

#### **package.json**

- **اسم المشروع**: "dentist"
- **النوع**: "module" (ES Modules)
- **الأوامر المتاحة**:
  - `npm run dev` - تشغيل خادم التطوير
  - `npm run build` - بناء للإنتاج
  - `npm run lint` - فحص جودة الكود
  - `npm run preview` - معاينة بناء الإنتاج

#### **vite.config.ts - تحسينات الإنتاج**

```typescript
// تحسينات البناء المتقدمة
build: {
  minify: 'terser',           // ضغط الكود
  terserOptions: {
    compress: {
      drop_console: true,     // إزالة console statements
      drop_debugger: true,    // إزالة debugger statements
      dead_code: true,        // إزالة الكود غير المستخدم
    }
  },
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],    // فصل مكتبات React
        utils: ['date-fns', 'zustand'],    // فصل الأدوات
        ui: ['@heroicons/react']           // فصل مكونات UI
      }
    }
  }
}
```

#### **tailwind.config.js - نظام التصميم**

```javascript
// ألوان مخصصة للعيادة
colors: {
  primary: {
    500: '#2C6694',  // اللون الأساسي المطلوب
    600: '#2C6694',  // نفس اللون لتجنب التدرجات الداكنة
  }
}

// خطوط عربية
fontFamily: {
  sans: ['Tajawal', 'sans-serif'],
}

// انيميشن مخصصة
animation: {
  'fade-in': 'fadeIn 0.5s ease-in-out',
  'slide-in': 'slideIn 0.3s ease-out',
  'scale-in': 'scaleIn 0.3s ease-out',
}
```

#### **TypeScript Configuration**

- **tsconfig.app.json**: إعدادات التطبيق الرئيسي
- **tsconfig.node.json**: إعدادات Node.js tools
- **Target**: ES2020 للتوافق الحديث
- **JSX**: react-jsx للدعم المحسن
- **Strict Mode**: مفعل لضمان جودة الكود

### 🎨 نظام التصميم والألوان

#### **الألوان الأساسية**

```css
:root {
  --primary-500: #2c6694; /* اللون الأساسي */
  --primary-800: #265280; /* تدرج أغمق */
  --gray-50: #f9fafb; /* خلفية فاتحة */
  --gray-900: #111827; /* نص داكن */
}
```

#### **الخطوط والاتجاه**

- **الخط الأساسي**: Tajawal (خط عربي احترافي)
- **الاتجاه**: RTL (من اليمين لليسار)
- **Font Smoothing**: مفعل للوضوح الأمثل

### 🚀 تحسينات الأداء

#### **Production Optimizations**

- **Code Splitting**: فصل الكود لتحميل أسرع
- **Tree Shaking**: إزالة الكود غير المستخدم
- **Minification**: ضغط الكود والـ CSS
- **Source Maps**: معطلة في الإنتاج لتقليل الحجم

#### **Development Optimizations**

- **Hot Module Replacement**: تحديث سريع أثناء التطوير
- **Dependency Pre-bundling**: تحسين سرعة التطوير
- **Error Overlay**: معطل لتجربة أفضل

### 📦 إدارة التبعيات

#### **Dependencies الرئيسية**

- React ecosystem (React, React-DOM, React-Router)
- UI libraries (Headless UI, Heroicons)
- State management (Zustand)
- Date utilities (date-fns)
- Database (Dexie for IndexedDB)

#### **DevDependencies**

- Build tools (Vite, TypeScript)
- Linting (ESLint, TypeScript-ESLint)
- Styling (Tailwind CSS, PostCSS)

---

## القسم الثاني: إعداد التطبيق الرئيسي والتوجيه

### 🚀 تهيئة التطبيق الرئيسي (main.tsx)

#### **معالجة الأخطاء العامة**

```typescript
// معالج أخطاء شامل للتطبيق
const globalErrorHandler = (event: ErrorEvent) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Global error caught:", event.error);
  }
};

// معالج للوعود غير المعالجة
window.addEventListener("unhandledrejection", (event) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Unhandled promise rejection:", event.reason);
  }
});
```

#### **تهيئة النظام**

- **تحسينات الإنتاج**: تفعيل تلقائي عند البدء
- **قوالب العلاجات**: تهيئة القوالب الافتراضية
- **تنظيف الذاكرة**: تنظيف المتاجر عند إغلاق التطبيق
- **React Strict Mode**: مفعل للتطوير الآمن

### 🗺️ نظام التوجيه والتنقل (App.tsx)

#### **هيكل التطبيق الرئيسي**

```typescript
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}
```

#### **تخطيط التطبيق الرئيسي (MainLayout)**

```typescript
const MainLayout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("لوحة التحكم");

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitle} />
        <main className="flex-1 overflow-auto bg-gray-100 p-6">
          <Routes>{/* الصفحات والمسارات */}</Routes>
        </main>
      </div>
      <NotificationContainer />
      <ErrorList />
    </div>
  );
};
```

### 📱 التصميم المتجاوب والجوال

#### **إدارة حالة الجوال**

- **نقطة التحول**: 768px (md breakpoint)
- **الشريط الجانبي**: قابل للطي في الجوال
- **التنقل**: زر همبرغر للجوال
- **الخلفية الضبابية**: عند فتح القائمة في الجوال

#### **تأثيرات الانتقال**

- **مدة الانتقال**: 300-400ms
- **نوع الانتقال**: ease-in-out
- **التأثيرات**: slide, fade, scale

### 🧭 نظام التوجيه المتقدم

#### **تصنيف الصفحات**

**الصفحات الخفيفة (تحميل مباشر):**

- `/` - لوحة التحكم (Dashboard)
- `/patients/:id` - تفاصيل المريض
- `/appointments` - المواعيد
- `/patient-payments` - دفعات المرضى
- `/doctors` - الأطباء
- `/settings` - الإعدادات

**الصفحات الثقيلة (Lazy Loading):**

- `/patients` - قائمة المرضى
- `/treatments` - قوالب العلاجات
- `/expenses` - مصاريف العيادة
- `/revenue` - الإيرادات
- `/lab-requests` - طلبات المخبر

#### **عناوين الصفحات**

```typescript
const pageTitles: Record<string, string> = {
  "/": "لوحة التحكم",
  "/patients": "المرضى",
  "/appointments": "المواعيد",
  "/treatments": "قوالب العلاجات",
  "/patient-payments": "دفعات المرضى",
  "/revenue": "الإيرادات",
  "/expenses": "مصاريف العيادة",
  "/doctors": "الأطباء",
  "/lab-requests": "طلبات المخبر",
  "/settings": "الإعدادات",
};
```

### ⚡ تحسين الأداء - Lazy Loading

#### **استراتيجية التحميل**

```typescript
// تحميل مؤجل للصفحات الثقيلة
export const LazyPatients = lazy(() =>
  import("../pages/Patients").then((module) => {
    // تأخير اصطناعي للتطوير
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => setTimeout(() => resolve(module), 100));
    }
    return module;
  })
);
```

#### **مكونات Suspense**

```typescript
export const PatientsWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="المرضى" />}>
    <LazyPatients />
  </Suspense>
);
```

#### **شاشات التحميل**

- **تصميم موحد**: spinner + نص + رسالة انتظار
- **متعدد اللغات**: نصوص عربية
- **انيميشن**: دوران سلس للمؤشر

### 🛡️ معالجة الأخطاء

#### **Error Boundaries**

```typescript
<Route
  path="/patients"
  element={
    <ErrorBoundary componentName="Patients" showDetails={true}>
      <PatientsWithSuspense />
    </ErrorBoundary>
  }
/>
```

#### **عرض الأخطاء للمستخدم**

- **الموقع**: أعلى يمين الشاشة
- **العدد الأقصى**: خطأين فقط
- **النوع**: الأخطاء الحديثة فقط
- **التصميم**: بطاقات منبثقة مع إمكانية الإغلاق

### 🧩 مكونات التخطيط الأساسية

#### **الشريط الجانبي (Sidebar)**

**الوظائف الرئيسية:**

- **التنقل الرئيسي**: 10 عناصر قائمة أساسية
- **التصميم المتجاوب**: قابل للطي في الجوال
- **المؤشر النشط**: خط أزرق على اليمين للصفحة الحالية
- **الأيقونات**: Heroicons لكل عنصر قائمة

**عناصر القائمة:**

```typescript
const menuItems = [
  { path: "/", name: "الرئيسية", icon: HomeIcon },
  { path: "/patients", name: "المرضى", icon: UserGroupIcon },
  { path: "/appointments", name: "المواعيد", icon: CalendarIcon },
  {
    path: "/treatments",
    name: "قوالب العلاجات",
    icon: ClipboardDocumentListIcon,
  },
  { path: "/patient-payments", name: "دفعات المرضى", icon: BanknotesIcon },
  { path: "/revenue", name: "الإيرادات", icon: ArrowTrendingUpIcon },
  { path: "/expenses", name: "مصاريف العيادة", icon: BanknotesIcon },
  { path: "/doctors", name: "الأطباء", icon: UserIcon },
  { path: "/lab-requests", name: "طلبات المخبر", icon: BeakerIcon },
  { path: "/settings", name: "الإعدادات", icon: Cog6ToothIcon },
];
```

**تأثيرات التفاعل:**

- **Hover**: تغيير لون الخلفية والنص
- **Active**: تدرج لوني من primary-100 إلى primary-50
- **انتقال**: 300ms ease-in-out
- **مؤشر نشط**: خط عمودي بلون primary-500

#### **الرأس (Header)**

**التصميم:**

- **الارتفاع**: 24 (6rem)
- **الخلفية**: أبيض مع ظل خفيف
- **المحاذاة**: وسط الشاشة
- **الخط**: 3xl font-bold

**عرض العنوان:**

```typescript
const displayTitle = title === "لوحة التحكم" ? "الصفحة الرئيسية" : title;
```

**التأثيرات:**

- **انيميشن**: fade-in عند التحميل
- **الحدود**: border-b مع gray-100
- **الظل**: shadow-card للعمق

#### **حاوي الإشعارات (NotificationContainer)**

**الموقع والتصميم:**

- **الموقع**: ثابت في أعلى الشاشة
- **النوع**: إشعارات منبثقة
- **الألوان**: أخضر للنجاح، أحمر للحذف
- **المدة**: 2 ثانية مع انيميشن

#### **نظام الجداول (Table Component)**

**المميزات:**

- **تصميم موحد**: shadow-card مع hover effects
- **الرأس**: تدرج لوني من primary-600 إلى primary-500
- **التخطيط**: table-fixed مع عرض متساوي للأعمدة
- **الاتجاه**: RTL مع text-center
- **التفاعل**: hover:shadow-card-hover

**الهيكل:**

```typescript
interface TableProps<T> {
  columns: Column[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}
```

### 🎨 نظام التصميم المتقدم

#### **الألوان المخصصة**

- **Primary**: #2C6694 (اللون الأساسي للعيادة)
- **تدرجات**: من primary-50 (فاتح) إلى primary-900 (داكن)
- **الخلفيات**: gray-50 للخلفية العامة، white للبطاقات

#### **الانيميشن والتأثيرات**

- **fade-in**: 0.5s ease-in-out
- **slide-in**: 0.3s ease-out
- **scale-in**: 0.3s ease-out
- **hover transitions**: 300ms للتفاعل السلس

#### **الظلال والعمق**

- **card**: ظل خفيف للبطاقات
- **card-hover**: ظل أقوى عند التمرير
- **button**: ظل للأزرار
- **glow**: تأثير إضاءة للعناصر المهمة

---

## القسم الثالث: نظام إدارة المرضى

### 👥 نموذج بيانات المريض (Patient Model)

#### **واجهة المريض الأساسية**

```typescript
export interface Patient {
  id: number; // معرف فريد
  name: string; // الاسم (مطلوب)
  phone: string; // رقم الهاتف
  email?: string; // البريد الإلكتروني (اختياري)
  birthDate?: string; // تاريخ الميلاد
  gender?: "male" | "female"; // الجنس
  address?: string; // العنوان
  notes?: string; // ملاحظات
  medicalHistory?: string; // التاريخ المرضي
  lastVisit?: string; // آخر زيارة
  createdAt?: string; // تاريخ الإنشاء
  updatedAt?: string; // تاريخ التحديث
  isActive?: boolean; // حالة النشاط
  accountClosures?: AccountClosure[]; // تسكير الحساب
}
```

#### **نظام تسكير الحساب**

```typescript
interface AccountClosure {
  id: number;
  patientId: number;
  closureDate: string;
  reason: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  createdBy: string;
}
```

### 🔍 نظام البحث المتقدم

#### **فهرسة البحث الذكية**

```typescript
interface SearchIndex {
  patientId: number;
  name: string;
  nameNormalized: string; // اسم منسق للبحث
  phone: string;
  address?: string;
  searchableText: string; // نص قابل للبحث شامل
}
```

#### **خوارزمية البحث بالنقاط**

- **تطابق كامل في الاسم**: 100 نقطة
- **بداية الاسم**: 80 نقطة
- **تطابق في رقم الهاتف**: 90 نقطة
- **تطابق في العنوان**: 20 نقطة
- **بحث عام**: 10 نقاط

#### **خيارات البحث**

```typescript
interface SearchOptions {
  maxResults?: number; // الحد الأقصى للنتائج (افتراضي: 50)
  minScore?: number; // أقل نقاط مقبولة (افتراضي: 5)
  sortBy?: "relevance" | "name" | "recent"; // ترتيب النتائج
}
```

### 📱 صفحة قائمة المرضى (Patients.tsx)

#### **المميزات الرئيسية**

- **البحث الفوري**: مع debouncing لتحسين الأداء
- **التصفح بالصفحات**: 6 مرضى لكل صفحة
- **إضافة مريض جديد**: نافذة منبثقة مع تحقق من البيانات
- **تعديل المرضى**: تحديث البيانات مع التحقق
- **حذف المرضى**: حذف آمن مع تأكيد

#### **حالة الصفحة**

```typescript
const [searchQuery, setSearchQuery] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
```

#### **إضافة مريض جديد**

```typescript
const handleAddPatient = async () => {
  try {
    const savedPatientId = await addPatient({
      name: newPatient.name,
      phone: newPatient.phone,
      birthDate: newPatient.birthdate,
      gender: newPatient.gender as "male" | "female",
      address: newPatient.address,
      medicalHistory: newPatient.medicalHistory,
    });

    // ربط المواعيد الموجودة بالمريض الجديد
    const appointmentsToUpdate = appointments.filter(
      (apt) => apt.isNewPatient && apt.patientName === newPatient.name.trim()
    );

    // تحديث المواعيد
    for (const appointment of appointmentsToUpdate) {
      await updateAppointment(appointment.id, {
        patientId: savedPatientId,
        isNewPatient: false,
      });
    }

    notify.success(`تم إضافة المريض "${newPatient.name}" بنجاح`);
  } catch (error) {
    notify.error(`حدث خطأ أثناء إضافة المريض: ${error.message}`);
  }
};
```

### 🏥 صفحة تفاصيل المريض (PatientDetails.tsx)

#### **التبويبات الرئيسية**

- **المعلومات الأساسية** (`info`): بيانات المريض الشخصية
- **السجل السني** (`dental`): تاريخ العلاجات والأسنان
- **الأشعة** (`xray`): معرض الأشعة والصور
- **المواعيد** (`appointments`): مواعيد المريض
- **المدفوعات** (`payment`): تفاصيل الدفعات والعلاجات

#### **إدارة حالة التفاصيل**

```typescript
const [activeTab, setActiveTab] = useState<
  "info" | "dental" | "xray" | "appointments" | "payment"
>("info");
const [patientState, setPatientState] = useState<Patient | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
```

### 🃏 مكون بطاقة المريض (PatientCard)

#### **التصميم والمميزات**

- **شريط علوي ملون**: بلون #37839F (اللون المخصص للعيادة)
- **أيقونة المستخدم**: مع خلفية شفافة ملونة
- **اسم المريض**: رابط قابل للنقر لصفحة التفاصيل
- **حساب العمر**: تلقائي من سنة الميلاد
- **معلومات الاتصال**: رقم الهاتف مع أيقونة
- **أزرار الإجراءات**: تعديل وحذف مع تأثيرات hover

#### **حساب العمر**

```typescript
const calculateAge = (birthdate?: string): string => {
  if (!birthdate) return "";

  const birthYear = parseInt(birthdate.substring(0, 4));
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  return age.toString();
};
```

#### **تصميم البطاقة**

```typescript
<div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden border border-gray-100 group">
  {/* شريط علوي مع اللون الجديد */}
  <div className="w-full h-2" style={{ backgroundColor: "#37839F" }}></div>

  <div className="p-6">{/* محتوى البطاقة */}</div>
</div>
```

### 🔐 نظام التحقق من البيانات

#### **قواعد التحقق للمرضى**

```typescript
const validatePatientData = (
  patient: Partial<Patient>,
  existingPatients: Patient[] = [],
  excludeId?: number
) => {
  const errors: string[] = [];

  // التحقق من الاسم
  if (!patient.name || patient.name.trim().length < 2) {
    errors.push("اسم المريض يجب أن يكون على الأقل حرفين");
  }

  // التحقق من عدم تكرار الاسم
  if (patient.name && patient.name.trim()) {
    const duplicateName = existingPatients.find(
      (p) =>
        p.name.trim().toLowerCase() === patient.name!.trim().toLowerCase() &&
        p.id !== excludeId
    );
    if (duplicateName) {
      errors.push("اسم المريض موجود مسبقاً، يرجى اختيار اسم آخر");
    }
  }

  // التحقق من رقم الهاتف (7 خانات على الأقل)
  if (
    patient.phone &&
    patient.phone.trim() !== "" &&
    !/^\d{7,}$/.test(patient.phone)
  ) {
    errors.push(
      "رقم الهاتف يجب أن يتكون من 7 خانات على الأقل (أو اتركه فارغاً)"
    );
  }

  // التحقق من البريد الإلكتروني
  if (
    patient.email &&
    patient.email.trim() !== "" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)
  ) {
    errors.push("البريد الإلكتروني غير صحيح (أو اتركه فارغاً)");
  }

  // التحقق من تاريخ الميلاد
  if (patient.birthDate && new Date(patient.birthDate) > new Date()) {
    errors.push("تاريخ الميلاد لا يمكن أن يكون في المستقبل");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

### 💾 متجر بيانات المرضى (PatientStore)

#### **الوظائف الأساسية**

- **addPatient**: إضافة مريض جديد مع التحقق
- **updatePatient**: تحديث بيانات المريض
- **deletePatient**: حذف المريض
- **softDeletePatient**: حذف ناعم (تعطيل)
- **restorePatient**: استعادة المريض المحذوف
- **getPatientById**: البحث بالمعرف
- **searchPatients**: البحث النصي
- **filterPatients**: التصفية المتقدمة

#### **إضافة مريض جديد**

```typescript
addPatient: async (patientData) => {
  try {
    const validation = validatePatientData(patientData, get().patients);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const newId = get().lastId + 1;
    const now = new Date().toISOString();

    const newPatient: Patient = {
      ...patientData,
      id: newId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    set((state) => ({
      patients: [...state.patients, newPatient],
      lastId: newId,
    }));

    return newId;
  } catch (error) {
    throw error;
  }
};
```

### 🚀 تحسينات الأداء

#### **Web Workers للبحث**

- **usePatientWorker**: معالجة البحث في خيط منفصل
- **فهرسة متقدمة**: بناء فهرس البحث في الخلفية
- **نتائج مخزنة مؤقتاً**: تحسين سرعة البحث المتكرر

#### **Lazy Loading للمكونات**

- **VirtualizedPatientList**: قائمة افتراضية للمرضى الكثيرين
- **تحميل تدريجي**: تحميل البيانات حسب الحاجة
- **ذاكرة محسنة**: تنظيف البيانات غير المستخدمة

---

## القسم الرابع: نظام المواعيد والتقويم

### 📅 نموذج بيانات الموعد (Appointment Model)

#### **واجهة الموعد الأساسية**

```typescript
export interface Appointment {
  id: number; // معرف فريد
  patientId: number; // معرف المريض
  patientName: string; // اسم المريض
  doctorId?: number; // معرف الطبيب (اختياري)
  doctorName: string; // اسم الطبيب
  time: string; // الوقت (HH:mm صباحاً/مساءً)
  date: string; // التاريخ (yyyy-MM-dd)
  treatment: string; // نوع العلاج
  status: "scheduled" | "completed" | "cancelled"; // حالة الموعد
  isNewPatient?: boolean; // مريض جديد؟
  phone?: string; // رقم الهاتف
  notes?: string; // ملاحظات

  // خصائص إضافية للتعديل
  day?: string; // اليوم
  month?: string; // الشهر
  year?: string; // السنة
  hour?: string; // الساعة
  minute?: string; // الدقيقة
  period?: string; // الفترة (صباحاً/مساءً)
}
```

### 🗓️ صفحة المواعيد (Appointments.tsx)

#### **المميزات الرئيسية**

- **تقويم شهري محسن**: عرض المواعيد بصريًا
- **قائمة المواعيد اليومية**: تفاصيل مواعيد اليوم المحدد
- **إضافة موعد جديد**: للمرضى الموجودين
- **إضافة مريض جديد**: مع موعد مباشر
- **تعديل وحذف المواعيد**: إدارة كاملة

#### **حالة الصفحة**

```typescript
// حالة الموعد الجديد
const [newAppointment, setNewAppointment] = useState({
  patientId: "",
  doctorId: "",
  day: new Date().getDate().toString(),
  month: (new Date().getMonth() + 1).toString(),
  year: new Date().getFullYear().toString(),
  hour: "9",
  minute: "00",
  period: "صباحاً",
  treatment: "فحص",
  notes: "",
  status: "scheduled" as const,
});

// حالة المريض الجديد
const [newPatient, setNewPatient] = useState({
  name: "",
  phone: "",
  day: new Date().getDate().toString(),
  month: (new Date().getMonth() + 1).toString(),
  year: new Date().getFullYear().toString(),
  gender: "male" as "male" | "female",
  address: "",
  medicalHistory: "",
});
```

#### **إضافة موعد جديد**

```typescript
const handleSaveAppointment = async () => {
  const patientNameToUse = isNewPatientAppointment
    ? newPatientName.trim()
    : patientSearchTerm.trim();
  const patientIdToUse = isNewPatientAppointment
    ? 0
    : parseInt(newAppointment.patientId);

  // التحقق من الحقول المطلوبة
  if (!patientNameToUse || !newAppointment.day || !newAppointment.hour) {
    notify.error("يرجى ملء جميع الحقول المطلوبة");
    return;
  }

  // التحقق من أن الاسم عربي فقط
  if (!isArabicOnly(patientNameToUse)) {
    notify.error("يرجى كتابة اسم المريض باللغة العربية فقط");
    return;
  }

  // التحقق من تحديد طبيب للمريض الجديد
  if (isNewPatientAppointment && !newAppointment.doctorId) {
    notify.error("يرجى تحديد طبيب للمريض الجديد");
    return;
  }

  try {
    await addAppointment({
      patientId: patientIdToUse,
      patientName: patientNameToUse,
      doctorId: newAppointment.doctorId
        ? parseInt(newAppointment.doctorId)
        : undefined,
      doctorName: doctor?.name || "",
      date: formattedDate,
      time: formattedTime,
      treatment: newAppointment.treatment,
      notes: newAppointment.notes,
      status: newAppointment.status,
      isNewPatient: isNewPatientAppointment,
    });

    notify.success("تم إضافة الموعد بنجاح");
  } catch (error) {
    notify.error("حدث خطأ أثناء إضافة الموعد");
  }
};
```

### 📊 التقويم المحسن (OptimizedCalendar)

#### **مميزات التقويم**

- **عرض شهري**: تقويم كامل للشهر الحالي
- **مؤشرات المواعيد**: عدد المواعيد لكل يوم
- **التنقل السلس**: بين الشهور مع انيميشن
- **اليوم الحالي**: تمييز بصري لليوم الحالي
- **اليوم المحدد**: تمييز اليوم المختار

#### **هيكل بيانات اليوم**

```typescript
interface CalendarDay {
  date: string; // التاريخ (yyyy-MM-dd)
  day: number; // رقم اليوم
  isToday: boolean; // هل هو اليوم الحالي؟
  appointmentCount: number; // عدد المواعيد
  appointments: any[]; // قائمة المواعيد
}
```

#### **التنقل في التقويم**

```typescript
const handlePrevMonth = useCallback(() => {
  onNavigate("prev");
}, [onNavigate]);

const handleNextMonth = useCallback(() => {
  onNavigate("next");
}, [onNavigate]);

const handleDayClick = useCallback(
  (date: string) => {
    onDateSelect(date);
  },
  [onDateSelect]
);
```

### 📋 قائمة المواعيد المحسنة (OptimizedAppointmentList)

#### **مميزات القائمة**

- **عرض مواعيد اليوم**: تصفية تلقائية للتاريخ المحدد
- **ترتيب زمني**: ترتيب المواعيد حسب الوقت
- **تغيير الحالة**: تحديث حالة الموعد مباشرة
- **بحث سريع**: البحث في المواعيد (اختياري)
- **تحميل تدريجي**: مع شاشات تحميل

#### **مكون بطاقة الموعد**

```typescript
const AppointmentCard: React.FC<{
  appointment: OptimizedAppointment;
  onStatusChange: (id: number, status: string) => void;
}> = ({ appointment, onStatusChange }) => {
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      onStatusChange(appointment.id, newStatus);
    },
    [appointment.id, onStatusChange]
  );

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      case "scheduled":
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };
};
```

#### **تصفية وترتيب المواعيد**

```typescript
const filteredAppointments = useMemo(() => {
  return appointments
    .filter((apt) => apt.date === selectedDate)
    .sort((a, b) => a.timeSlot - b.timeSlot);
}, [appointments, selectedDate]);
```

### 🃏 بطاقة الموعد (AppointmentCard)

#### **تصميم البطاقة**

- **شريط علوي ملون**: حسب حالة الموعد
- **معلومات المريض**: اسم ورابط لصفحة التفاصيل
- **تفاصيل الموعد**: الوقت والعلاج والمدة
- **حالة الموعد**: مع أيقونة ولون مميز
- **تأثيرات hover**: رفع البطاقة عند التمرير

#### **ألوان الحالات**

```typescript
const statusConfig = {
  scheduled: {
    color: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-200",
    gradientFrom: "from-blue-600",
    gradientTo: "to-blue-400",
    label: "مجدول",
    icon: CalendarIcon,
  },
  completed: {
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-200",
    gradientFrom: "from-green-600",
    gradientTo: "to-green-400",
    label: "مكتمل",
    icon: CheckCircleIcon,
  },
  cancelled: {
    color: "bg-red-100 text-red-800",
    borderColor: "border-red-200",
    gradientFrom: "from-red-600",
    gradientTo: "to-red-400",
    label: "ملغي",
    icon: ClockIcon,
  },
};
```

### 💾 متجر بيانات المواعيد (AppointmentStore)

#### **الوظائف الأساسية**

- **addAppointment**: إضافة موعد جديد
- **updateAppointment**: تحديث بيانات الموعد
- **deleteAppointment**: حذف الموعد
- **getAppointmentsByDate**: البحث بالتاريخ
- **getAppointmentsByPatientId**: البحث بمعرف المريض
- **getTodayAppointments**: مواعيد اليوم

#### **إضافة موعد جديد**

```typescript
addAppointment: (appointment) =>
  set((state) => {
    const newId = state.lastId + 1;
    const newAppointment = {
      ...appointment,
      id: newId,
      date: appointment.date || format(new Date(), "yyyy-MM-dd"),
    };

    // تنظيف cache Dashboard عند إضافة موعد جديد
    setTimeout(() => {
      try {
        import("../utils/dashboardOptimization").then(
          ({ dashboardOptimizer }) => {
            dashboardOptimizer.invalidateCache("appointments");
          }
        );
      } catch (error) {
        console.warn("Could not invalidate dashboard cache:", error);
      }
    }, 0);

    return {
      appointments: [...state.appointments, newAppointment],
      lastId: newId,
    };
  });
```

### ⏰ إدارة الوقت والتوقيتات

#### **تحويل الوقت إلى دقائق**

```typescript
const timeToMinutes = useCallback((timeString: string): number => {
  try {
    const [time, period] = timeString.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    // تحويل إلى نظام 24 ساعة
    if (period === "مساءً" && hour !== 12) {
      hour += 12;
    } else if (period === "صباحاً" && hour === 12) {
      hour = 0;
    }

    return hour * 60 + minute;
  } catch (error) {
    console.warn("Error parsing time:", timeString, error);
    return 0;
  }
}, []);
```

#### **ترتيب المواعيد حسب الوقت**

```typescript
const selectedDayAppointments = useMemo(() => {
  return appointments
    .filter((appointment) => appointment.date === calendarState.selectedDate)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}, [appointments, calendarState.selectedDate, timeToMinutes]);
```

### 🔍 البحث والتصفية

#### **البحث في المرضى**

- **بحث فوري**: أثناء الكتابة
- **تصفية ذكية**: بالاسم والهاتف
- **اقتراحات**: قائمة منسدلة للمرضى

#### **التحقق من البيانات**

- **الاسم عربي فقط**: التحقق من اللغة
- **تحديد الطبيب**: مطلوب للمرضى الجدد
- **الحقول المطلوبة**: اسم المريض، التاريخ، الوقت

---

## القسم السادس: نظام المدفوعات والإيرادات

### 💰 نموذج بيانات الدفعة (Payment Model)

#### **واجهة الدفعة الأساسية**

```typescript
export interface Payment {
  id: number; // معرف فريد
  patientId: number; // معرف المريض
  patientName: string; // اسم المريض
  amount: number; // مبلغ الدفعة
  paymentDate: string; // تاريخ الدفعة (yyyy-MM-dd)
  notes?: string; // ملاحظات الدفعة (اختياري)
}
```

#### **نموذج إحصائيات المدفوعات**

```typescript
export interface PaymentStats {
  totalAmount: number; // إجمالي المبلغ
  totalPayments: number; // عدد الدفعات
  averagePayment: number; // متوسط الدفعة
  todayAmount: number; // مبلغ اليوم
  monthlyAmount: number; // مبلغ الشهر
}
```

### 📊 صفحة دفعات المرضى (PatientPayments.tsx)

#### **المميزات الرئيسية**

- **عرض حالة الدفع**: لجميع المرضى مع حساب المتبقي
- **البحث السريع**: بأسماء المرضى
- **إضافة دفعة جديدة**: مع ربطها بالمريض
- **حساب التكاليف**: التكلفة الإجمالية والمدفوع والمتبقي
- **حالة الدفع**: مدفوع، جزئي، غير مدفوع

#### **نموذج المريض مع بيانات الدفع**

```typescript
interface PatientWithPayment extends Patient {
  totalCost: number; // إجمالي التكلفة
  totalPaid: number; // إجمالي المدفوع
  remainingAmount: number; // المبلغ المتبقي
  paymentStatus: "paid" | "partial" | "unpaid"; // حالة الدفع
}
```

#### **حساب حالة الدفع**

```typescript
const getPaymentStatus = (
  totalCost: number,
  totalPaid: number
): "paid" | "partial" | "unpaid" => {
  if (totalCost === 0) return "paid";
  if (totalPaid === 0) return "unpaid";
  if (totalPaid >= totalCost) return "paid";
  return "partial";
};
```

### 📈 صفحة الإيرادات (Revenue.tsx)

#### **المميزات الرئيسية**

- **إيرادات يومية**: عرض تفصيلي لإيرادات يوم محدد
- **إحصائيات شهرية**: ملخص الإيرادات الشهرية
- **تقويم الإيرادات**: عرض بصري للإيرادات على التقويم
- **تحليل الاتجاهات**: مقارنة الإيرادات بين الفترات
- **تصفية متقدمة**: حسب التاريخ والمريض

#### **مكونات الصفحة**

**1. قسم اختيار التاريخ:**

- تقويم تفاعلي لاختيار اليوم
- مؤشرات بصرية للأيام التي تحتوي على إيرادات
- التنقل السريع بين الشهور

**2. قسم الإيرادات اليومية:**

- جدول تفصيلي بالدفعات
- إجمالي إيرادات اليوم
- تفاصيل كل دفعة (المريض، المبلغ، الملاحظات)

**3. قسم الإحصائيات الشهرية:**

- إجمالي الإيرادات الشهرية
- متوسط الإيرادات اليومية
- مقارنة مع الشهر السابق

### 💾 متجر بيانات المدفوعات (PaymentStore)

#### **الوظائف الأساسية**

```typescript
interface PaymentState {
  payments: Payment[];
  lastId: number;

  // Cache للأداء
  _cache: {
    dailyRevenue: Map<string, number>;
    monthlyRevenue: Map<string, number>;
    dailyPayments: Map<string, Payment[]>;
    monthlyPayments: Map<string, Payment[]>;
    lastCacheUpdate: number;
  };

  // الأفعال الأساسية
  addPayment: (payment: Omit<Payment, "id">) => void;
  updatePayment: (id: number, payment: Partial<Payment>) => void;
  deletePayment: (id: number) => void;
  getPaymentsByPatientId: (patientId: number) => Payment[];
  getTotalPaidByPatientId: (patientId: number) => number;
  getTotalPaid: () => number;

  // الإحصائيات المحسنة
  getPaymentStats: () => PaymentStats;
  getDailyRevenue: (date: string) => number;
  getMonthlyRevenue: (year: number, month: number) => number;
  getDailyPayments: (date: string) => Payment[];
  getMonthlyPayments: (year: number, month: number) => Payment[];
}
```

#### **إضافة دفعة جديدة**

```typescript
addPayment: (payment) => {
  set((state) => {
    const newId = state.lastId + 1;
    const newPayment = {
      ...payment,
      id: newId,
      paymentDate: payment.paymentDate || format(new Date(), "yyyy-MM-dd"),
    };

    return {
      payments: [...state.payments, newPayment],
      lastId: newId,
    };
  });

  // مسح الـ cache بعد إضافة دفعة جديدة
  get()._clearCache();
};
```

#### **نظام Cache للأداء**

```typescript
// تحسين الأداء مع نظام cache ذكي
_isCacheValid: () => {
  const cacheAge = Date.now() - get()._cache.lastCacheUpdate;
  return cacheAge < 30000; // 30 ثانية
},

_clearCache: () => {
  set(state => ({
    _cache: {
      dailyRevenue: new Map(),
      monthlyRevenue: new Map(),
      dailyPayments: new Map(),
      monthlyPayments: new Map(),
      lastCacheUpdate: Date.now()
    }
  }));
}
```

---

## القسم السابع: نظام المصاريف

### 💸 نموذج بيانات المصروف (Expense Model)

#### **واجهة المصروف الأساسية**

```typescript
export interface Expense {
  id: number; // معرف فريد
  category: string; // فئة المصروف (مطلوب)
  amount: number; // مبلغ المصروف
  date: string; // تاريخ المصروف (yyyy-MM-dd)
  description?: string; // وصف المصروف (اختياري)
  isPaid: boolean; // حالة الدفع
  notes?: string; // ملاحظات إضافية
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
}
```

#### **نموذج فئة المصروف**

```typescript
export interface ExpenseCategory {
  id: number; // معرف فريد
  name: string; // اسم الفئة
  description?: string; // وصف الفئة
  isActive: boolean; // حالة النشاط
  createdAt: string; // تاريخ الإنشاء
}
```

### 📋 صفحة المصاريف (Expenses.tsx)

#### **المميزات الرئيسية**

- **إدارة المصاريف**: إضافة وتعديل وحذف المصاريف
- **إدارة الفئات**: إنشاء فئات مخصصة للمصاريف
- **تصفية متقدمة**: حسب التاريخ والفئة وحالة الدفع
- **إحصائيات شاملة**: إجمالي المصاريف والمدفوع والمعلق
- **تقويم المصاريف**: عرض بصري للمصاريف اليومية

#### **الفئات الافتراضية**

```typescript
const defaultCategories = [
  "أدوات طبية",
  "مواد استهلاكية",
  "أجور موظفين",
  "إيجار العيادة",
  "فواتير كهرباء وماء",
  "صيانة وإصلاح",
  "تسويق وإعلان",
  "تأمين طبي",
  "تدريب وتطوير",
  "مصاريف إدارية",
];
```

#### **هيكل الصفحة**

**1. قسم إضافة مصروف جديد:**

- زر إضافة مصروف مع تدرج لوني
- نافذة منبثقة لإدخال بيانات المصروف
- اختيار الفئة من قائمة منسدلة

**2. قسم المصاريف اليومية:**

- تقويم لاختيار التاريخ
- جدول المصاريف لليوم المحدد
- إجمالي مصاريف اليوم

**3. قسم إدارة الفئات:**

- قائمة الفئات النشطة
- إضافة فئة جديدة
- حذف الفئات غير المستخدمة

### 🔧 متجر بيانات المصاريف (ExpenseStore)

#### **الوظائف الأساسية**

```typescript
interface ExpenseState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  lastId: number;
  lastCategoryId: number;

  // الأفعال الأساسية للمصاريف
  addExpense: (
    expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ) => Promise<number>;
  updateExpense: (id: number, expense: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: number) => Promise<boolean>;
  togglePaymentStatus: (id: number) => Promise<boolean>;

  // الأفعال الأساسية للفئات
  addCategory: (
    category: Omit<ExpenseCategory, "id" | "createdAt">
  ) => Promise<ExpenseCategory>;
  updateCategory: (
    id: number,
    category: Partial<ExpenseCategory>
  ) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;
  canDeleteCategory: (categoryName: string) => boolean;

  // الاستعلامات والتصفية
  getExpensesByDate: (date: string) => Expense[];
  getExpensesByCategory: (category: string) => Expense[];
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[];
  getTotalExpensesByCategory: () => Record<string, number>;
  getUnpaidExpenses: () => Expense[];
  getMonthlyExpenses: (year: number, month: number) => Expense[];
}
```

#### **إضافة مصروف جديد**

```typescript
addExpense: async (expenseData) => {
  try {
    const validation = validateExpenseData(expenseData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const newId = get().lastId + 1;
    const now = new Date().toISOString();

    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      expenses: [...state.expenses, newExpense],
      lastId: newId,
    }));

    return newId;
  } catch (error) {
    throw error;
  }
};
```

### 📊 تحسينات الأداء للمصاريف

#### **Hook محسن للمصاريف**

```typescript
export const useExpenseOptimization = () => {
  // Cache للحسابات المعقدة
  const [cache, setCache] = useState(new Map());

  const getOptimizedCategoryAggregation = useCallback(
    (date: string) => {
      const cacheKey = `category-${date}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const expenses = getExpensesByDate(date);
      const aggregation = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      cache.set(cacheKey, aggregation);
      return aggregation;
    },
    [cache]
  );

  const getOptimizedMonthlySummary = useCallback(
    (year: number, month: number) => {
      const cacheKey = `monthly-${year}-${month}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const expenses = getMonthlyExpenses(year, month);
      const summary = {
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        paidAmount: expenses
          .filter((exp) => exp.isPaid)
          .reduce((sum, exp) => sum + exp.amount, 0),
        unpaidAmount: expenses
          .filter((exp) => !exp.isPaid)
          .reduce((sum, exp) => sum + exp.amount, 0),
        expenseCount: expenses.length,
        categoryBreakdown: expenses.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>),
      };

      cache.set(cacheKey, summary);
      return summary;
    },
    [cache]
  );

  return {
    getOptimizedCategoryAggregation,
    getOptimizedMonthlySummary,
    // ... المزيد من الوظائف المحسنة
  };
};
```

---

## القسم الثامن: نظام الأطباء

### 👨‍⚕️ نموذج بيانات الطبيب (Doctor Model)

#### **واجهة الطبيب الأساسية**

```typescript
export interface Doctor {
  id: number; // معرف فريد
  name: string; // اسم الطبيب (مطلوب)
  phone: string; // رقم الهاتف
  email?: string; // البريد الإلكتروني (اختياري)
  specialization: string; // التخصص
  workDays: string[]; // أيام العمل
  workHours: {
    start: string; // وقت بداية العمل
    end: string; // وقت انتهاء العمل
  };
  experience: number; // سنوات الخبرة
  isActive: boolean; // حالة النشاط
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
}
```

### 🏥 صفحة الأطباء (Doctors.tsx)

#### **المميزات الرئيسية**

- **إدارة الأطباء**: إضافة وتعديل وحذف الأطباء
- **معلومات شاملة**: الاسم، التخصص، أيام العمل، ساعات العمل
- **حالة النشاط**: تفعيل وإيقاف الأطباء
- **التحقق من البيانات**: التأكد من صحة المعلومات المدخلة
- **عرض منظم**: جدول مع جميع معلومات الأطباء

#### **نموذج إضافة طبيب**

```typescript
const [formData, setFormData] = useState({
  name: "د. ", // يبدأ بـ "د. " افتراضياً
  phone: "",
  specialization: "",
  email: "",
  workDays: [] as string[],
  workHours: { start: "09:00", end: "17:00" },
  experience: 0,
  isActive: true,
});
```

#### **أيام العمل المتاحة**

```typescript
const workDaysOptions = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];
```

### 💾 متجر بيانات الأطباء (DoctorStore)

#### **الوظائف الأساسية**

```typescript
interface DoctorState {
  doctors: Doctor[];
  lastId: number;

  // الأفعال الأساسية
  addDoctor: (
    doctor: Omit<Doctor, "id" | "createdAt" | "updatedAt">
  ) => Promise<number>;
  updateDoctor: (id: number, doctor: Partial<Doctor>) => Promise<boolean>;
  deleteDoctor: (id: number) => Promise<boolean>;
  toggleDoctorStatus: (id: number) => Promise<boolean>;

  // الاستعلامات
  getDoctorById: (id: number) => Doctor | undefined;
  getActiveDoctors: () => Doctor[];
  getAllDoctors: () => Doctor[];
  getDoctorsBySpecialization: (specialization: string) => Doctor[];
  getAvailableDoctors: (day: string, time: string) => Doctor[];
}
```

#### **إضافة طبيب جديد**

```typescript
addDoctor: async (doctorData) => {
  try {
    const validation = validateDoctorData(doctorData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const newId = get().lastId + 1;
    const now = new Date().toISOString();

    const newDoctor: Doctor = {
      ...doctorData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      doctors: [...state.doctors, newDoctor],
      lastId: newId,
    }));

    return newId;
  } catch (error) {
    throw error;
  }
};
```

#### **التحقق من بيانات الطبيب**

```typescript
const validateDoctorData = (
  doctor: Partial<Doctor>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // التحقق من الاسم
  if (!doctor.name || doctor.name.trim().length < 3) {
    errors.push("اسم الطبيب يجب أن يكون على الأقل 3 أحرف");
  }

  // التحقق من أن الاسم يبدأ بـ "د."
  if (doctor.name && !doctor.name.trim().startsWith("د.")) {
    errors.push('اسم الطبيب يجب أن يبدأ بـ "د."');
  }

  // التحقق من رقم الهاتف
  if (
    doctor.phone &&
    doctor.phone.trim() !== "" &&
    !/^\d{7,}$/.test(doctor.phone)
  ) {
    errors.push("رقم الهاتف يجب أن يتكون من 7 خانات على الأقل");
  }

  // التحقق من البريد الإلكتروني
  if (
    doctor.email &&
    doctor.email.trim() !== "" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email)
  ) {
    errors.push("البريد الإلكتروني غير صحيح");
  }

  // التحقق من التخصص
  if (!doctor.specialization || doctor.specialization.trim().length < 2) {
    errors.push("التخصص مطلوب");
  }

  // التحقق من سنوات الخبرة
  if (
    doctor.experience !== undefined &&
    (doctor.experience < 0 || doctor.experience > 50)
  ) {
    errors.push("سنوات الخبرة يجب أن تكون بين 0 و 50");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

---

## القسم التاسع: نظام طلبات المخبر

### 🧪 نموذج بيانات طلب المخبر (Lab Request Model)

#### **واجهة طلب المخبر الأساسية**

```typescript
export interface LabRequest {
  id: number; // معرف فريد
  patientId: number; // معرف المريض
  patientName: string; // اسم المريض
  labId: number; // معرف المخبر
  labName: string; // اسم المخبر
  workTypeId: number; // معرف نوع العمل
  workTypeName: string; // اسم نوع العمل
  teethNumbers: number[]; // أرقام الأسنان
  color: string; // لون العمل
  notes?: string; // ملاحظات إضافية
  requestDate: string; // تاريخ الطلب
  deliveryDate: string; // تاريخ التسليم المتوقع
  actualDeliveryDate?: string; // تاريخ التسليم الفعلي
  isReceived: boolean; // هل تم الاستلام؟
  cost: number; // تكلفة العمل
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
}
```

#### **نموذج المخبر**

```typescript
export interface Lab {
  id: number; // معرف فريد
  name: string; // اسم المخبر (مطلوب)
  phone: string; // رقم الهاتف
  address?: string; // العنوان (اختياري)
  email?: string; // البريد الإلكتروني (اختياري)
  isActive: boolean; // حالة النشاط
  createdAt: string; // تاريخ الإنشاء
}
```

#### **نموذج نوع العمل**

```typescript
export interface WorkType {
  id: number; // معرف فريد
  name: string; // اسم نوع العمل (مطلوب)
  description?: string; // وصف نوع العمل
  defaultCost: number; // التكلفة الافتراضية
  isActive: boolean; // حالة النشاط
  createdAt: string; // تاريخ الإنشاء
}
```

### 🏭 صفحة طلبات المخبر (LabRequests.tsx)

#### **المميزات الرئيسية**

- **إدارة الطلبات**: إضافة وتعديل وحذف طلبات المخبر
- **متابعة التسليم**: تتبع حالة الطلبات والتواريخ
- **إدارة المخابر**: إضافة وإدارة المخابر المتعاونة
- **أنواع الأعمال**: إدارة أنواع الأعمال المختلفة
- **إشعارات التأخير**: تنبيهات للطلبات المتأخرة
- **البحث والتصفية**: بحث متقدم في الطلبات

#### **حالات الطلبات**

- **معلق**: طلب جديد لم يتم تسليمه بعد
- **مستلم**: طلب تم استلامه من المخبر
- **متأخر**: طلب تجاوز تاريخ التسليم المتوقع

#### **هيكل الصفحة**

**1. قسم الإحصائيات السريعة:**

- عدد الطلبات المعلقة
- عدد الطلبات المتأخرة
- طلبات اليوم للتسليم

**2. قسم الطلبات المعلقة:**

- جدول الطلبات غير المستلمة
- تصفية حسب المخبر ونوع العمل
- أزرار الإجراءات (تعديل، حذف، تسليم)

**3. قسم سجل الطلبات:**

- تاريخ جميع الطلبات المستلمة
- بحث في السجل
- إحصائيات الأداء

**4. قسم إدارة المخابر وأنواع الأعمال:**

- إضافة مخابر جديدة
- إدارة أنواع الأعمال
- تحديث معلومات الاتصال

### 💾 متجر بيانات طلبات المخبر (LabRequestStore)

#### **الوظائف الأساسية**

```typescript
interface LabRequestState {
  labRequests: LabRequest[];
  labs: Lab[];
  workTypes: WorkType[];
  lastId: number;
  lastLabId: number;
  lastWorkTypeId: number;

  // الأفعال الأساسية للطلبات
  addLabRequest: (
    request: Omit<LabRequest, "id" | "createdAt" | "updatedAt">
  ) => Promise<number>;
  updateLabRequest: (
    id: number,
    request: Partial<LabRequest>
  ) => Promise<boolean>;
  deleteLabRequest: (id: number) => Promise<boolean>;
  markAsReceived: (id: number, actualDeliveryDate?: string) => Promise<boolean>;

  // الأفعال الأساسية للمخابر
  addLab: (lab: Omit<Lab, "id" | "createdAt">) => Promise<Lab>;
  updateLab: (id: number, lab: Partial<Lab>) => Promise<boolean>;
  deleteLab: (id: number) => Promise<boolean>;

  // الأفعال الأساسية لأنواع الأعمال
  addWorkType: (
    workType: Omit<WorkType, "id" | "createdAt">
  ) => Promise<WorkType>;
  updateWorkType: (id: number, workType: Partial<WorkType>) => Promise<boolean>;
  deleteWorkType: (id: number) => Promise<boolean>;

  // الاستعلامات والإحصائيات
  getPendingRequests: () => LabRequest[];
  getReceivedRequests: () => LabRequest[];
  getOverdueRequests: () => LabRequest[];
  getTodayDeliveryRequests: () => LabRequest[];
  getActiveLabs: () => Lab[];
  getActiveWorkTypes: () => WorkType[];
}
```

#### **إضافة طلب مخبر جديد**

```typescript
addLabRequest: async (requestData) => {
  try {
    const validation = validateLabRequestData(requestData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const newId = get().lastId + 1;
    const now = new Date().toISOString();

    const newRequest: LabRequest = {
      ...requestData,
      id: newId,
      isReceived: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      labRequests: [...state.labRequests, newRequest],
      lastId: newId,
    }));

    return newId;
  } catch (error) {
    throw error;
  }
};
```

#### **تحديد الطلبات المتأخرة**

```typescript
getOverdueRequests: () => {
  const today = new Date();
  return get().labRequests.filter(
    (request) => !request.isReceived && new Date(request.deliveryDate) < today
  );
};
```

### 🔔 نظام الإشعارات للمخبر

#### **إشعارات التأخير**

```typescript
// فحص الطلبات المتأخرة وإرسال إشعارات
const checkOverdueRequests = () => {
  const overdueRequests = getOverdueRequests();

  overdueRequests.forEach((request) => {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(request.deliveryDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    notify.warning(
      `طلب المخبر للمريض "${request.patientName}" متأخر ${daysOverdue} يوم`,
      { persistent: true }
    );
  });
};
```

#### **إشعارات التسليم اليومية**

```typescript
// إشعار بطلبات اليوم للتسليم
const checkTodayDeliveries = () => {
  const todayRequests = getTodayDeliveryRequests();

  if (todayRequests.length > 0) {
    notify.info(`يوجد ${todayRequests.length} طلب مخبر للتسليم اليوم`, {
      duration: 5000,
    });
  }
};
```

---

## القسم العاشر: نظام الإعدادات

### ⚙️ نموذج بيانات الإعدادات (Settings Model)

#### **واجهة الإعدادات الشاملة**

```typescript
export interface Settings {
  // إعدادات العيادة
  clinicName: string; // اسم العيادة
  clinicAddress: string; // عنوان العيادة
  clinicPhone: string; // هاتف العيادة
  clinicEmail?: string; // بريد العيادة (اختياري)
  clinicLogo?: string; // شعار العيادة (اختياري)

  // إعدادات العمل
  workingHours: {
    start: string; // وقت بداية العمل
    end: string; // وقت انتهاء العمل
  };
  workingDays: string[]; // أيام العمل
  appointmentDuration: number; // مدة الموعد بالدقائق

  // إعدادات المواعيد
  allowOnlineBooking: boolean; // السماح بالحجز الإلكتروني
  requireConfirmation: boolean; // تتطلب تأكيد
  reminderSettings: {
    enabled: boolean; // تفعيل التذكير
    daysBefore: number; // عدد الأيام قبل الموعد
    method: "sms" | "email" | "both"; // طريقة التذكير
  };

  // إعدادات الدفع
  currency: string; // العملة
  taxRate: number; // معدل الضريبة
  paymentMethods: string[]; // طرق الدفع المتاحة

  // إعدادات النظام
  language: "ar" | "en"; // اللغة
  theme: "light" | "dark" | "auto"; // المظهر
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy" | "yyyy-mm-dd"; // تنسيق التاريخ
  timeFormat: "12h" | "24h"; // تنسيق الوقت

  // إعدادات النسخ الاحتياطي
  autoBackup: {
    enabled: boolean; // تفعيل النسخ التلقائي
    frequency: "daily" | "weekly" | "monthly"; // تكرار النسخ
    lastBackup?: string; // تاريخ آخر نسخة
  };

  // إعدادات الأمان
  sessionTimeout: number; // انتهاء الجلسة بالدقائق
  requirePasswordChange: boolean; // تتطلب تغيير كلمة المرور
  passwordChangeInterval: number; // فترة تغيير كلمة المرور بالأيام

  // إعدادات الإشعارات
  notifications: {
    appointments: boolean; // إشعارات المواعيد
    payments: boolean; // إشعارات المدفوعات
    reminders: boolean; // إشعارات التذكير
    system: boolean; // إشعارات النظام
  };

  // إعدادات التقارير
  defaultReportPeriod: "week" | "month" | "quarter" | "year"; // فترة التقرير الافتراضية
  includeInactiveData: boolean; // تضمين البيانات غير النشطة

  // معلومات النظام
  version: string; // إصدار النظام
  lastUpdated?: string; // تاريخ آخر تحديث
  createdAt?: string; // تاريخ الإنشاء
}
```

### 🛠️ صفحة الإعدادات (Settings.tsx)

#### **الحالة الحالية**

حالياً صفحة الإعدادات فارغة وتحتاج إلى تطوير. المخطط لها أن تحتوي على:

**1. إعدادات العيادة:**

- معلومات العيادة الأساسية
- ساعات وأيام العمل
- معلومات الاتصال

**2. إعدادات النظام:**

- اللغة والمظهر
- تنسيق التاريخ والوقت
- إعدادات الأمان

**3. إعدادات المواعيد:**

- مدة الموعد الافتراضية
- إعدادات التذكير
- قواعد الحجز

**4. إعدادات المدفوعات:**

- العملة المستخدمة
- طرق الدفع المتاحة
- إعدادات الضرائب

**5. إعدادات النسخ الاحتياطي:**

- تفعيل النسخ التلقائي
- تكرار النسخ
- إدارة النسخ المحفوظة

### 💾 متجر بيانات الإعدادات (SettingsStore)

#### **الوظائف الأساسية**

```typescript
interface SettingsState {
  settings: Settings;

  // الأفعال الأساسية
  updateSettings: (newSettings: Partial<Settings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;

  // إعدادات العيادة
  updateClinicInfo: (
    info: Partial<
      Pick<
        Settings,
        | "clinicName"
        | "clinicAddress"
        | "clinicPhone"
        | "clinicEmail"
        | "clinicLogo"
      >
    >
  ) => Promise<boolean>;

  // إعدادات العمل
  updateWorkingHours: (hours: Settings["workingHours"]) => Promise<boolean>;
  updateWorkingDays: (days: string[]) => Promise<boolean>;
  updateAppointmentDuration: (duration: number) => Promise<boolean>;

  // إعدادات المواعيد
  updateAppointmentSettings: (
    settings: Partial<
      Pick<
        Settings,
        "allowOnlineBooking" | "requireConfirmation" | "reminderSettings"
      >
    >
  ) => Promise<boolean>;

  // إعدادات الدفع
  updatePaymentSettings: (
    settings: Partial<Pick<Settings, "currency" | "taxRate" | "paymentMethods">>
  ) => Promise<boolean>;

  // إعدادات النظام
  updateSystemSettings: (
    settings: Partial<
      Pick<Settings, "language" | "theme" | "dateFormat" | "timeFormat">
    >
  ) => Promise<boolean>;

  // إعدادات النسخ الاحتياطي
  updateBackupSettings: (settings: Settings["autoBackup"]) => Promise<boolean>;
  updateLastBackupTime: () => Promise<boolean>;

  // إعدادات الأمان
  updateSecuritySettings: (
    settings: Partial<
      Pick<
        Settings,
        "sessionTimeout" | "requirePasswordChange" | "passwordChangeInterval"
      >
    >
  ) => Promise<boolean>;

  // إعدادات الإشعارات
  updateNotificationSettings: (
    settings: Settings["notifications"]
  ) => Promise<boolean>;
}
```

#### **الإعدادات الافتراضية**

```typescript
const DEFAULT_SETTINGS: Settings = {
  // إعدادات العيادة
  clinicName: "عيادة الأسنان",
  clinicAddress: "",
  clinicPhone: "",
  clinicEmail: "",

  // إعدادات العمل
  workingHours: {
    start: "08:00",
    end: "18:00",
  },
  workingDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
  appointmentDuration: 30,

  // إعدادات المواعيد
  allowOnlineBooking: false,
  requireConfirmation: true,
  reminderSettings: {
    enabled: true,
    daysBefore: 1,
    method: "sms",
  },

  // إعدادات الدفع
  currency: "أ.ل.س",
  taxRate: 15,
  paymentMethods: ["نقداً", "بطاقة ائتمان", "تحويل بنكي"],

  // إعدادات النظام
  language: "ar",
  theme: "light",
  dateFormat: "dd/mm/yyyy",
  timeFormat: "24h",

  // إعدادات النسخ الاحتياطي
  autoBackup: {
    enabled: false,
    frequency: "weekly",
  },

  // إعدادات الأمان
  sessionTimeout: 60,
  requirePasswordChange: false,
  passwordChangeInterval: 90,

  // إعدادات الإشعارات
  notifications: {
    appointments: true,
    payments: true,
    reminders: true,
    system: true,
  },

  // إعدادات التقارير
  defaultReportPeriod: "month",
  includeInactiveData: false,

  // معلومات النظام
  version: "1.0.0",
};
```

---

## القسم الحادي عشر: لوحة التحكم والإحصائيات

### 📊 لوحة التحكم الرئيسية (Dashboard.tsx)

#### **المميزات الرئيسية**

- **إحصائيات سريعة**: عرض الأرقام المهمة في بطاقات
- **مواعيد اليوم**: قائمة بمواعيد اليوم الحالي
- **الإيرادات اليومية**: إجمالي إيرادات اليوم
- **المرضى الجدد**: عدد المرضى المضافين حديثاً
- **العلاجات النشطة**: عدد العلاجات الجارية
- **تحديث تلقائي**: تحديث البيانات كل فترة

#### **البطاقات الإحصائية**

**1. بطاقة المرضى:**

- إجمالي عدد المرضى
- المرضى الجدد هذا الشهر
- أيقونة مجموعة المستخدمين

**2. بطاقة المواعيد:**

- مواعيد اليوم
- المواعيد المكتملة
- أيقونة التقويم

**3. بطاقة الإيرادات:**

- إيرادات اليوم
- إيرادات الشهر
- أيقونة الأموال

**4. بطاقة العلاجات:**

- العلاجات النشطة
- العلاجات المكتملة
- أيقونة الطب

#### **تحسينات الأداء**

```typescript
// Hook محسن للوحة التحكم
const useDashboardOptimization = () => {
  const {
    stats,
    isLoading,
    isRefreshing,
    error,
    getTodayRevenue,
    getTodayAppointmentsCount,
    getMonthlyProfit,
    getTodayAppointmentsList,
    getQuickSummary,
    refresh,
    hasData,
  } = useDashboardOptimization();

  // Cache للبيانات المحسوبة
  const [cache, setCache] = useState(new Map());

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    isLoading,
    getTodayRevenue,
    getTodayAppointmentsList,
    // ... المزيد من الوظائف
  };
};
```

### 🔔 نظام الإشعارات (Notification System)

#### **أنواع الإشعارات**

```typescript
export interface Notification {
  id: string; // معرف فريد
  type: "success" | "error" | "warning" | "info"; // نوع الإشعار
  title: string; // عنوان الإشعار
  message: string; // رسالة الإشعار
  duration?: number; // مدة العرض بالميلي ثانية
  persistent?: boolean; // إشعار مستمر؟
  createdAt: number; // وقت الإنشاء
}
```

#### **مكون حاوي الإشعارات**

```typescript
const NotificationContainer: React.FC = () => {
  const {
    notifications,
    persistentNotifications,
    removeNotification,
    removePersistentNotification,
  } = useNotificationStore();

  return (
    <>
      {/* الإشعارات العادية - أعلى يمين */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}

      {/* الإشعارات المستمرة - أعلى وسط */}
      {persistentNotifications.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          {persistentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removePersistentNotification}
            />
          ))}
        </div>
      )}
    </>
  );
};
```

#### **استخدام نظام الإشعارات**

```typescript
// إشعارات النجاح
notify.success("تم حفظ البيانات بنجاح");

// إشعارات الخطأ
notify.error("حدث خطأ أثناء حفظ البيانات");

// إشعارات التحذير
notify.warning("يرجى التحقق من البيانات المدخلة");

// إشعارات المعلومات
notify.info("تم تحديث النظام إلى الإصدار الجديد");

// إشعارات مستمرة
notify.warning("يوجد مواعيد متأخرة", { persistent: true });
```

### 🧩 المكونات المشتركة (Shared Components)

#### **مكون الجدول (Table.tsx)**

**المميزات:**

- تصميم موحد مع تدرج لوني
- دعم الـ RTL
- تأثيرات hover محسنة
- عرض رسالة عند عدم وجود بيانات
- دعم النقر على الصفوف

**الاستخدام:**

```typescript
<Table
  columns={columns}
  data={patients}
  keyExtractor={(item) => item.id}
  onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
  emptyMessage="لا يوجد مرضى"
/>
```

#### **مكون التأكيد (ConfirmationModal.tsx)**

**المميزات:**

- أنواع مختلفة (خطر، تحذير، معلومات)
- انيميشن فتح وإغلاق
- أيقونات مناسبة لكل نوع
- نصوص قابلة للتخصيص
- حالة تحميل

**الاستخدام:**

```typescript
<ConfirmationModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleDeletePatient}
  title="حذف المريض"
  message="هل أنت متأكد من حذف هذا المريض؟"
  type="danger"
  confirmText="حذف"
  cancelText="إلغاء"
/>
```

#### **مكون أزرار الإجراءات (ActionButton.tsx)**

**المميزات:**

- أنواع مختلفة (أساسي، ثانوي، خطر)
- أحجام متعددة
- دعم الأيقونات
- حالة تحميل
- تأثيرات hover

#### **مكون التصفح (Pagination.tsx)**

**المميزات:**

- تنقل بين الصفحات
- عرض معلومات الصفحة الحالية
- أزرار التنقل السريع
- تصميم متجاوب

### 📱 نظام الأشعة (X-Ray System)

#### **نموذج بيانات الأشعة**

```typescript
export interface XRay {
  id: number; // معرف فريد
  patientId: number; // معرف المريض
  type: XRayType; // نوع الأشعة
  imageUrl: string; // رابط الصورة
  thumbnailUrl?: string; // رابط الصورة المصغرة
  description?: string; // وصف الأشعة
  date: string; // تاريخ الأشعة
  fileSize: number; // حجم الملف بالبايت
  originalName: string; // اسم الملف الأصلي
  createdAt: string; // تاريخ الإنشاء
}

export type XRayType =
  | "panoramic" // بانوراما
  | "periapical" // ذروية
  | "bitewing" // عضة
  | "cephalometric" // جانبية
  | "ct" // مقطعية
  | "other"; // أخرى
```

#### **معرض الأشعة المحسن**

```typescript
const ImprovedXRayGallery: React.FC<{
  patientId: number;
  onAddXRay: () => void;
}> = ({ patientId, onAddXRay }) => {
  const { getXRaysByPatientId } = useXRayStore();
  const xrays = getXRaysByPatientId(patientId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {xrays.map((xray) => (
        <XRayCard
          key={xray.id}
          xray={xray}
          onClick={() => openLightbox(xray)}
        />
      ))}

      <AddXRayButton onClick={onAddXRay} />
    </div>
  );
};
```

#### **أنواع الأشعة المدعومة**

```typescript
export const xrayTypeNames: Record<XRayType, string> = {
  panoramic: "أشعة بانوراما",
  periapical: "أشعة ذروية",
  bitewing: "أشعة عضة",
  cephalometric: "أشعة جانبية",
  ct: "أشعة مقطعية",
  other: "أخرى",
};
```

---

## القسم الثاني عشر: تحسينات الأداء والتقنيات المتقدمة

### ⚡ تحسينات الأداء العامة

#### **Lazy Loading للصفحات**

```typescript
// تحميل مؤجل للصفحات الثقيلة
export const LazyPatients = lazy(() =>
  import("../pages/Patients").then((module) => {
    // تأخير اصطناعي للتطوير
    if (process.env.NODE_ENV === "development") {
      return new Promise((resolve) => setTimeout(() => resolve(module), 100));
    }
    return module;
  })
);

// مكون Suspense مع شاشة تحميل
export const PatientsWithSuspense = () => (
  <Suspense fallback={<PageLoadingFallback pageName="المرضى" />}>
    <LazyPatients />
  </Suspense>
);
```

#### **Web Workers للمعالجة الثقيلة**

```typescript
// معالجة البحث في خيط منفصل
export const usePatientWorker = () => {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker("/workers/patientSearch.js");

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const searchPatients = useCallback((query: string, patients: Patient[]) => {
    return new Promise((resolve) => {
      workerRef.current?.postMessage({ query, patients });
      workerRef.current!.onmessage = (e) => {
        resolve(e.data);
      };
    });
  }, []);

  return { searchPatients };
};
```

#### **نظام Cache ذكي**

```typescript
// Cache للبيانات المحسوبة
class SmartCache {
  private cache = new Map<string, any>();
  private timestamps = new Map<string, number>();
  private readonly TTL = 30000; // 30 ثانية

  set(key: string, value: any): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key: string): any | null {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}
```

### 🔍 نظام البحث المتقدم

#### **فهرسة البحث**

```typescript
interface SearchIndex {
  patientId: number;
  name: string;
  nameNormalized: string; // اسم منسق للبحث
  phone: string;
  address?: string;
  searchableText: string; // نص قابل للبحث شامل
}

// بناء فهرس البحث
const buildSearchIndex = (patients: Patient[]): SearchIndex[] => {
  return patients.map((patient) => ({
    patientId: patient.id,
    name: patient.name,
    nameNormalized: normalizeArabicText(patient.name),
    phone: patient.phone || "",
    address: patient.address || "",
    searchableText: [
      patient.name,
      patient.phone,
      patient.address,
      patient.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));
};
```

#### **خوارزمية البحث بالنقاط**

```typescript
const searchWithScoring = (
  query: string,
  searchIndex: SearchIndex[]
): SearchResult[] => {
  const normalizedQuery = normalizeArabicText(query);

  return searchIndex
    .map((item) => {
      let score = 0;

      // تطابق كامل في الاسم
      if (item.nameNormalized === normalizedQuery) score += 100;

      // بداية الاسم
      if (item.nameNormalized.startsWith(normalizedQuery)) score += 80;

      // تطابق في رقم الهاتف
      if (item.phone.includes(query)) score += 90;

      // تطابق في العنوان
      if (item.address?.toLowerCase().includes(query.toLowerCase()))
        score += 20;

      // بحث عام
      if (item.searchableText.includes(query.toLowerCase())) score += 10;

      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
};
```

### 🛡️ معالجة الأخطاء المتقدمة

#### **Error Boundaries**

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string; showDetails: boolean },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo);

    // إرسال الخطأ لنظام التتبع
    if (process.env.NODE_ENV === "production") {
      // trackError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          componentName={this.props.componentName}
          showDetails={this.props.showDetails}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

#### **نظام عرض الأخطاء**

```typescript
const ErrorList: React.FC = () => {
  const { errors, removeError } = useErrorStore();

  // عرض آخر خطأين فقط
  const recentErrors = errors.slice(-2);

  if (recentErrors.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2">
      {recentErrors.map((error) => (
        <ErrorCard
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
        />
      ))}
    </div>
  );
};
```

---

## القسم الخامس: نظام العلاجات والسجل السني

### 🦷 نموذج بيانات العلاج (Treatment Model)

#### **واجهة العلاج الأساسية**

```typescript
export interface Treatment {
  id: number; // معرف فريد
  patientId: number; // معرف المريض
  name: string; // اسم العلاج (مطلوب)
  description?: string; // وصف العلاج (اختياري)
  cost: number; // تكلفة العلاج
  startDate: string; // تاريخ بداية العلاج
  endDate?: string; // تاريخ انتهاء العلاج (عند الإكمال)
  status:
    | "in_progress"
    | "completed"
    | "cancelled_incomplete"
    | "cancelled_no_sessions";
  isStarted?: boolean; // هل تم بدء العلاج (إضافة التكلفة لحساب المريض)
  teethNumbers?: number[]; // أرقام الأسنان المتأثرة
  doctorId?: number; // معرف الطبيب
  doctorName?: string; // اسم الطبيب محفوظ وقت إنشاء العلاج
  sessions: TreatmentSession[]; // قائمة الجلسات
  finalNotes?: string; // ملاحظات نهائية عند الإكمال أو الإلغاء
  cancelReason?: string; // سبب الإلغاء (إن وجد)
  createdAt?: string; // تاريخ الإنشاء
  updatedAt?: string; // تاريخ التحديث
  isActive?: boolean; // حالة النشاط
}
```

---

## القسم الثالث عشر: الخلاصة والتطوير المستقبلي

### 📋 ملخص المشروع

#### **الإنجازات الرئيسية**

**1. نظام شامل لإدارة العيادة:**

- إدارة المرضى مع بحث متقدم
- نظام مواعيد تفاعلي مع تقويم
- إدارة العلاجات والجلسات
- نظام مدفوعات وإيرادات
- إدارة المصاريف والتكاليف
- نظام طلبات المخبر
- إدارة الأطباء والموظفين

**2. تقنيات حديثة ومتقدمة:**

- React 19.1.0 مع TypeScript
- Zustand لإدارة الحالة
- Tailwind CSS للتصميم
- تحسينات الأداء مع Lazy Loading
- Web Workers للمعالجة الثقيلة
- نظام Cache ذكي

**3. واجهة مستخدم احترافية:**

- تصميم عربي RTL
- ألوان موحدة للعيادة
- انيميشن وتأثيرات سلسة
- تصميم متجاوب للجوال
- نظام إشعارات متقدم

**4. أمان وموثوقية:**

- التحقق من البيانات
- معالجة الأخطاء المتقدمة
- نسخ احتياطية للبيانات
- تشفير البيانات الحساسة

### 🚀 خطة التطوير المستقبلية

#### **المرحلة الأولى (الربع الأول 2024)**

**1. تحسينات الأداء:**

- الانتقال إلى Tauri للتطبيق المكتبي
- تطبيق قاعدة بيانات SQLite
- تحسين نظام Cache
- تحسين سرعة البحث

**2. الأمان والنسخ الاحتياطي:**

- نظام النسخ الاحتياطي التلقائي
- تشفير البيانات الحساسة
- نظام استرداد البيانات
- حماية متقدمة من الأخطاء

**3. تطوير صفحة الإعدادات:**

- واجهة شاملة للإعدادات
- إعدادات العيادة والعمل
- إعدادات النظام والأمان
- إعدادات النسخ الاحتياطي

#### **المرحلة الثانية (الربع الثاني 2024)**

**1. التقارير المتقدمة:**

- تقارير مالية شاملة
- تقارير أداء العيادة
- إحصائيات المرضى والعلاجات
- تصدير التقارير بصيغ مختلفة

**2. ميزات إضافية:**

- طباعة الوصفات الطبية
- إشعارات النظام المتقدمة
- تحديثات تلقائية للنظام
- نظام الرسائل النصية

**3. تحسينات واجهة المستخدم:**

- مظهر داكن للنظام
- تخصيص الألوان والخطوط
- لوحة تحكم قابلة للتخصيص
- اختصارات لوحة المفاتيح

#### **المرحلة الثالثة (الربع الثالث 2024)**

**1. التكامل مع الأنظمة الخارجية:**

- تكامل مع أنظمة الدفع الإلكتروني
- تكامل مع أنظمة الرسائل النصية
- تكامل مع أنظمة البريد الإلكتروني
- API للتكامل مع التطبيقات الأخرى

**2. ميزات متقدمة:**

- نظام الحجز الإلكتروني للمرضى
- تطبيق جوال للمرضى
- نظام التذكير التلقائي
- إدارة المخزون والأدوات

**3. الذكاء الاصطناعي:**

- اقتراحات العلاجات الذكية
- تحليل البيانات المتقدم
- التنبؤ بالإيرادات
- تحسين جدولة المواعيد

### 📊 إحصائيات المشروع

#### **حجم الكود**

- **إجمالي الملفات**: 50+ ملف
- **أسطر الكود**: 15,000+ سطر
- **المكونات**: 30+ مكون React
- **الصفحات**: 10 صفحات رئيسية
- **المتاجر**: 8 متاجر Zustand

#### **الميزات المطبقة**

- ✅ إدارة المرضى (100%)
- ✅ نظام المواعيد (100%)
- ✅ إدارة العلاجات (100%)
- ✅ نظام المدفوعات (100%)
- ✅ إدارة المصاريف (100%)
- ✅ نظام الأطباء (100%)
- ✅ طلبات المخبر (100%)
- ✅ نظام الأشعة (100%)
- ⏳ صفحة الإعدادات (20%)
- ⏳ التقارير المتقدمة (30%)

#### **التقنيات المستخدمة**

- **Frontend**: React 19.1.0 + TypeScript
- **Styling**: Tailwind CSS 3.3.3
- **State Management**: Zustand 5.0.4
- **Routing**: React Router DOM 7.6.0
- **Icons**: Heroicons 2.2.0
- **Date Handling**: date-fns 4.1.0
- **Database**: Dexie 4.0.11 (IndexedDB)
- **Build Tool**: Vite 6.3.5

### 🎯 أهداف الجودة

#### **الأداء**

- **سرعة التحميل**: أقل من 3 ثواني
- **استجابة الواجهة**: أقل من 100ms
- **استهلاك الذاكرة**: أقل من 100MB
- **حجم التطبيق**: أقل من 50MB

#### **الموثوقية**

- **معدل الأخطاء**: أقل من 0.1%
- **وقت التشغيل**: 99.9%
- **استرداد البيانات**: 100%
- **أمان البيانات**: تشفير كامل

#### **سهولة الاستخدام**

- **وقت التعلم**: أقل من ساعة
- **رضا المستخدمين**: أكثر من 95%
- **دعم اللغة العربية**: كامل
- **إمكانية الوصول**: WCAG 2.1 AA

### 🔧 دليل الصيانة

#### **النسخ الاحتياطية**

```bash
# نسخ احتياطي يومي
npm run backup:daily

# نسخ احتياطي أسبوعي
npm run backup:weekly

# استرداد من النسخة الاحتياطية
npm run restore:backup
```

#### **تحديث التبعيات**

```bash
# فحص التحديثات المتاحة
npm outdated

# تحديث التبعيات الآمنة
npm update

# تحديث التبعيات الرئيسية
npm install react@latest
```

#### **مراقبة الأداء**

```bash
# تحليل حجم الحزمة
npm run analyze

# فحص الأداء
npm run performance:check

# تحليل الذاكرة
npm run memory:profile
```

### 📞 الدعم والمساعدة

#### **التوثيق**

- **دليل المستخدم**: `/docs/user-guide.md`
- **دليل المطور**: `/docs/developer-guide.md`
- **API Reference**: `/docs/api-reference.md`
- **أسئلة شائعة**: `/docs/faq.md`

#### **المجتمع**

- **GitHub Repository**: [رابط المستودع]
- **منتدى الدعم**: [رابط المنتدى]
- **قناة Telegram**: [رابط القناة]
- **البريد الإلكتروني**: support@dental-clinic.com

#### **التطوير**

- **تقارير الأخطاء**: GitHub Issues
- **طلبات الميزات**: GitHub Discussions
- **المساهمة**: Contributing Guidelines
- **رخصة المشروع**: MIT License

---

## 🏁 الخاتمة

تم تطوير نظام إدارة عيادة الأسنان ليكون حلاً شاملاً ومتكاملاً لإدارة جميع جوانب العيادة الطبية. النظام يجمع بين التقنيات الحديثة والتصميم الاحترافي لتوفير تجربة مستخدم ممتازة.

### 🌟 النقاط المميزة

1. **شمولية النظام**: يغطي جميع احتياجات العيادة من إدارة المرضى إلى التقارير المالية
2. **الأداء المحسن**: استخدام تقنيات متقدمة لضمان سرعة واستجابة عالية
3. **التصميم العربي**: واجهة مستخدم مصممة خصيصاً للمستخدمين العرب
4. **الأمان والموثوقية**: نظام آمن مع حماية البيانات والنسخ الاحتياطية
5. **قابلية التطوير**: بنية مرنة تسمح بإضافة ميزات جديدة بسهولة

### 🚀 المستقبل

النظام في تطوير مستمر مع خطة واضحة للتحسينات والميزات الجديدة. الهدف هو أن يصبح النظام الأول في المنطقة العربية لإدارة العيادات الطبية.

**شكراً لاستخدام نظام إدارة عيادة الأسنان!** 🦷✨
| "completed"
| "cancelled_incomplete"
| "cancelled_no_sessions";
isStarted?: boolean; // هل تم بدء العلاج (إضافة التكلفة لحساب المريض)
teethNumbers?: number[]; // أرقام الأسنان المتأثرة
doctorId?: number; // معرف الطبيب
doctorName?: string; // اسم الطبيب محفوظ وقت إنشاء العلاج
sessions: TreatmentSession[]; // قائمة الجلسات
finalNotes?: string; // ملاحظات نهائية عند الإكمال أو الإلغاء
cancelReason?: string; // سبب الإلغاء (إن وجد)
createdAt?: string; // تاريخ الإنشاء
updatedAt?: string; // تاريخ التحديث
isActive?: boolean; // حالة النشاط
}

````

#### **نموذج جلسة العلاج**

```typescript
export interface TreatmentSession {
  id: number; // معرف فريد للجلسة
  treatmentId: number; // معرف العلاج
  sessionNumber: number; // رقم الجلسة
  date: string; // تاريخ الجلسة
  notes: string; // ملاحظات الجلسة (مطلوبة)
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
}
````

#### **حالات العلاج**

- **`in_progress`**: العلاج جاري التنفيذ
- **`completed`**: العلاج مكتمل بنجاح
- **`cancelled_incomplete`**: العلاج ملغي مع وجود جلسات مكتملة
- **`cancelled_no_sessions`**: العلاج ملغي بدون جلسات

### 🏗️ نموذج قالب العلاج (Treatment Template)

#### **واجهة قالب العلاج**

```typescript
export interface TreatmentTemplate {
  id: number; // معرف فريد
  name: string; // اسم العلاج (مطلوب)
  description: string; // وصف العلاج
  defaultCost: number; // التكلفة الافتراضية
  category: string; // تصنيف العلاج
  isActive: boolean; // حالة النشاط
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
}
```

#### **القوالب الافتراضية**

```typescript
const defaultTemplates = [
  {
    name: "تنظيف الأسنان",
    description: "تنظيف احترافي للأسنان وإزالة الجير",
    defaultCost: 200,
    category: "وقائي",
  },
  {
    name: "حشو ضرس",
    description: "حشو تجويف بمادة مركبة",
    defaultCost: 300,
    category: "علاج تحفظي",
  },
  {
    name: "حشو عصب",
    description: "علاج العصب وإزالة اللب المصاب",
    defaultCost: 800,
    category: "علاج عصب",
  },
  {
    name: "قلع ضرس",
    description: "إزالة السن التالف",
    defaultCost: 250,
    category: "جراحي",
  },
  {
    name: "تركيب تاج",
    description: "تغطية السن بتاج خزفي",
    defaultCost: 1200,
    category: "تركيبات",
  },
  {
    name: "جسر أسنان",
    description: "جسر ثابت لتعويض الأسنان المفقودة",
    defaultCost: 2000,
    category: "تركيبات",
  },
  {
    name: "طقم أسنان جزئي",
    description: "طقم متحرك لتعويض عدة أسنان",
    defaultCost: 1500,
    category: "أطقم",
  },
  {
    name: "طقم أسنان كامل",
    description: "طقم كامل لتعويض جميع الأسنان",
    defaultCost: 3000,
    category: "أطقم",
  },
  {
    name: "تبييض أسنان",
    description: "تبييض الأسنان بالليزر",
    defaultCost: 500,
    category: "تجميلي",
  },
  {
    name: "تقويم أسنان",
    description: "تقويم الأسنان المعدني",
    defaultCost: 5000,
    category: "تقويم",
  },
];
```

### 🦷 نظام ترقيم الأسنان (ISO Teeth System)

#### **بيانات الأسنان**

```typescript
export const ISOTeeth = {
  permanent: [
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18, // الفك العلوي الأيمن
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28, // الفك العلوي الأيسر
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38, // الفك السفلي الأيسر
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48, // الفك السفلي الأيمن
  ],
  deciduous: [
    51,
    52,
    53,
    54,
    55, // الفك العلوي الأيمن (أسنان لبنية)
    61,
    62,
    63,
    64,
    65, // الفك العلوي الأيسر (أسنان لبنية)
    71,
    72,
    73,
    74,
    75, // الفك السفلي الأيسر (أسنان لبنية)
    81,
    82,
    83,
    84,
    85, // الفك السفلي الأيمن (أسنان لبنية)
  ],
};
```

#### **نظام التحقق من أرقام الأسنان**

```typescript
const validateToothNumber = (toothNumber: number): boolean => {
  const validTeethNumbers = [...ISOTeeth.permanent, ...ISOTeeth.deciduous];
  return validTeethNumbers.includes(toothNumber);
};

const validateToothInput = (
  input: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!input.trim()) {
    return { isValid: true, errors: [] }; // رقم السن اختياري
  }

  const num = parseInt(input.trim());

  if (isNaN(num)) {
    errors.push(`رقم السن "${input}" غير صحيح`);
    return { isValid: false, errors };
  }

  if (input.length !== 2) {
    errors.push("رقم السن يجب أن يكون مكون من رقمين");
    return { isValid: false, errors };
  }

  if (!validateToothNumber(num)) {
    errors.push(`رقم السن ${num} غير صحيح. يرجى إدخال رقم سن صحيح`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};
```

### 📄 صفحة قوالب العلاجات (Treatments.tsx)

#### **المميزات الرئيسية**

- **إدارة العلاجات الجارية**: عرض وإدارة العلاجات النشطة
- **قوالب العلاجات**: إنشاء وتعديل قوالب العلاجات المحفوظة
- **البحث والتصفية**: البحث في العلاجات بأسماء المرضى
- **إضافة جلسات**: إضافة جلسات جديدة للعلاجات الجارية
- **إكمال العلاجات**: إنهاء العلاجات مع إمكانية تعديل التكلفة

#### **هيكل الصفحة**

```typescript
const Treatments = () => {
  // حالات المودالات
  const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [isTreatmentDetailsModalOpen, setIsTreatmentDetailsModalOpen] =
    useState(false);
  const [isCompleteTreatmentModalOpen, setIsCompleteTreatmentModalOpen] =
    useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // حالات التحكم
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [currentTemplate, setCurrentTemplate] =
    useState<TreatmentTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // استخدام المخازن
  const {
    treatments,
    treatmentTemplates,
    getInProgressTreatments,
    getActiveTreatmentTemplates,
    addTreatmentTemplate,
    updateTreatmentTemplate,
    deleteTreatmentTemplate,
    completeTreatment,
    initializeDefaultTemplates,
  } = useTreatmentStore();
};
```

#### **الأقسام الثلاثة للصفحة**

**1. قسم إضافة علاج جديد:**

- زر إضافة علاج جديد مع تدرج لوني
- عنوان ووصف القسم
- تأثيرات hover وانيميشن

**2. قسم العلاجات الجارية:**

- جدول العلاجات النشطة
- خانة بحث بأسماء المرضى
- أزرار الإجراءات: عرض التفاصيل، إضافة جلسة، إكمال العلاج
- عداد العلاجات مع التصفية

**3. قسم قوالب العلاجات:**

- جدول قوالب العلاجات القابل للطي
- إضافة وتعديل وحذف القوالب
- عرض التكلفة الافتراضية لكل قالب

#### **إدارة قوالب العلاجات**

```typescript
const handleTemplateSubmit = async () => {
  if (!templateFormData.name.trim() || !templateFormData.defaultCost.trim()) {
    notify.error("يرجى ملء جميع الحقول المطلوبة");
    return;
  }

  const cost = parseFloat(templateFormData.defaultCost);
  if (isNaN(cost) || cost <= 0) {
    notify.error("يرجى إدخال تكلفة صحيحة");
    return;
  }

  try {
    if (currentTemplate) {
      // تحديث القالب
      await updateTreatmentTemplate(currentTemplate.id, {
        name: templateFormData.name.trim(),
        defaultCost: cost,
        description: "",
        category: "عام",
      });
      notify.success("تم تحديث قالب العلاج بنجاح");
    } else {
      // إضافة قالب جديد
      await addTreatmentTemplate({
        name: templateFormData.name.trim(),
        defaultCost: cost,
        description: "",
        category: "عام",
        isActive: true,
      });
      notify.success("تم إضافة قالب العلاج بنجاح");
    }
  } catch (error) {
    notify.error("حدث خطأ في حفظ قالب العلاج");
  }
};
```

### 🏥 السجل السني (Dental History)

#### **مكون DentalHistory**

- **عرض تاريخ العلاجات**: جميع العلاجات المكتملة للمريض
- **تصفية العلاجات المؤرشفة**: العلاجات بتكلفة صفر (أرشيف)
- **عرض تفاصيل الأسنان**: أرقام الأسنان المتأثرة مع أسمائها
- **الملاحظات النهائية**: عرض الملاحظات الختامية لكل علاج
- **التواريخ**: تاريخ البداية والانتهاء لكل علاج

#### **إضافة علاج قديم (أرشيف)**

```typescript
const handleSaveOldTreatment = async () => {
  // التحقق من صحة رقم السن إذا تم إدخاله
  let teethNumbers: number[] = [];
  if (teethInput && teethInput.value.trim()) {
    const numStr = teethInput.value.trim();
    const num = parseInt(numStr);

    if (isNaN(num)) {
      notify.error(`رقم السن "${numStr}" غير صحيح`);
      return;
    }

    if (numStr.length !== 2) {
      notify.error(`رقم السن يجب أن يكون مكون من رقمين`);
      return;
    }

    // التحقق من أن الرقم موجود في قائمة الأسنان المعتمدة
    const validTeethNumbers = [...ISOTeeth.permanent, ...ISOTeeth.deciduous];
    if (!validTeethNumbers.includes(num)) {
      notify.error(`رقم السن ${num} غير صحيح. يرجى إدخال رقم سن صحيح`);
      return;
    }

    teethNumbers.push(num);
  }

  // إضافة العلاج القديم مباشرة للسجل السني فقط
  const oldTreatment = {
    id: newId,
    patientId: treatmentToAdd.patientId,
    name: treatmentToAdd.name,
    description: treatmentToAdd.description || "",
    cost: 0, // تكلفة 0 للعلاجات القديمة
    startDate: treatmentToAdd.startDate,
    endDate: treatmentToAdd.startDate + "T12:00:00.000Z",
    status: "completed" as const,
    teethNumbers: teethNumbers,
    sessions: [],
    finalNotes: notesInput ? notesInput.value : "",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};
```

### 🔧 مكون ToothNumberHelper

#### **الوظائف الأساسية**

- **مساعد اختيار الأسنان**: واجهة بصرية لاختيار أرقام الأسنان
- **التحقق من الصحة**: التأكد من صحة أرقام الأسنان المدخلة
- **عرض أسماء الأسنان**: تحويل الأرقام إلى أسماء مفهومة
- **دعم الأسنان الدائمة واللبنية**: نظام ترقيم شامل

#### **استخدام المكون**

```typescript
<ToothNumberHelper
  onSelectTooth={(toothNumber) => {
    const teethInput = document.getElementById(
      "treatment-teeth"
    ) as HTMLInputElement;
    if (teethInput) {
      teethInput.value = toothNumber.toString();
    }
  }}
/>
```

#### **أمثلة على أرقام الأسنان**

- **الأسنان الدائمة**: 11, 12, 13, 14, 15, 16, 17, 18 (الفك العلوي الأيمن)
- **الأسنان اللبنية**: 51, 52, 53, 54, 55 (الفك العلوي الأيمن)
- **نظام الترقيم**: الرقم الأول = الربع، الرقم الثاني = موقع السن

### 💾 متجر بيانات العلاجات (TreatmentStore)

#### **الوظائف الأساسية للعلاجات**

```typescript
interface TreatmentState {
  treatments: Treatment[];
  treatmentTemplates: TreatmentTemplate[];
  lastId: number;
  lastTemplateId: number;
  lastSessionId: number;
  version: number;

  // الأفعال الأساسية للعلاجات
  addTreatment: (
    treatment: Omit<Treatment, "id" | "sessions" | "createdAt" | "updatedAt">,
    firstSessionNotes?: string
  ) => Promise<number>;
  updateTreatment: (
    id: number,
    treatment: Partial<Treatment>
  ) => Promise<boolean>;
  deleteTreatment: (id: number) => Promise<boolean>;
  completeTreatment: (
    id: number,
    finalNotes?: string,
    newCost?: number
  ) => Promise<boolean>;
  cancelTreatment: (
    id: number,
    saveToRecord: boolean,
    cancelReason?: string
  ) => Promise<boolean>;
  updateTreatmentCost: (id: number, newCost: number) => Promise<boolean>;

  // الأفعال الأساسية للجلسات
  addSession: (
    treatmentId: number,
    notes: string,
    sessionDate?: string
  ) => Promise<TreatmentSession>;
  updateSession: (sessionId: number, notes: string) => Promise<boolean>;
  getSessionsByTreatment: (treatmentId: number) => TreatmentSession[];

  // الأفعال الأساسية لقوالب العلاجات
  addTreatmentTemplate: (
    template: Omit<TreatmentTemplate, "id" | "createdAt" | "updatedAt">
  ) => Promise<TreatmentTemplate>;
  updateTreatmentTemplate: (
    id: number,
    template: Partial<TreatmentTemplate>
  ) => Promise<boolean>;
  deleteTreatmentTemplate: (id: number) => Promise<boolean>;
  initializeDefaultTemplates: () => void;
}
```

#### **إضافة علاج جديد مع الجلسة الأولى**

```typescript
addTreatment: async (treatmentData, firstSessionNotes = "") => {
  try {
    const validation = validateTreatmentData(treatmentData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const newId = get().lastId + 1;
    const sessionId = get().lastSessionId + 1;
    const now = new Date().toISOString();

    // الحصول على اسم الطبيب وحفظه مع العلاج
    let doctorName = undefined;
    if (treatmentData.doctorId) {
      const doctor = useDoctorStore
        .getState()
        .getDoctorById(treatmentData.doctorId);
      doctorName = doctor?.name;
    }

    // إنشاء الجلسة الأولى إذا تم توفير ملاحظات
    const sessions: TreatmentSession[] = [];
    if (firstSessionNotes.trim()) {
      sessions.push({
        id: sessionId,
        treatmentId: newId,
        sessionNumber: 1,
        date: treatmentData.startDate,
        notes: firstSessionNotes.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }

    const newTreatment: Treatment = {
      ...treatmentData,
      id: newId,
      doctorName, // حفظ اسم الطبيب وقت إنشاء العلاج
      status: "in_progress", // العلاج يبدأ فوراً
      isStarted: true, // العلاج بدأ فوراً (التكلفة مضافة لحساب المريض)
      sessions,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    set((state) => ({
      treatments: [...state.treatments, newTreatment],
      lastId: newId,
      lastSessionId: firstSessionNotes.trim() ? sessionId : state.lastSessionId,
    }));

    return newId;
  } catch (error) {
    throw error;
  }
};
```

#### **إكمال العلاج مع تعديل التكلفة**

```typescript
completeTreatment: async (id, finalNotes = "", newCost) => {
  try {
    const treatment = get().treatments.find((t) => t.id === id);
    if (!treatment) {
      throw new Error("العلاج غير موجود");
    }

    if (treatment.status !== "in_progress") {
      throw new Error("لا يمكن إكمال علاج غير جاري");
    }

    const now = new Date().toISOString();
    const updatedTreatment: Treatment = {
      ...treatment,
      status: "completed",
      endDate: now,
      finalNotes: finalNotes.trim(),
      cost: newCost !== undefined ? newCost : treatment.cost,
      updatedAt: now,
    };

    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.id === id ? updatedTreatment : t
      ),
    }));

    return true;
  } catch (error) {
    throw error;
  }
};
```

#### **إضافة جلسة جديدة**

```typescript
addSession: async (treatmentId, notes, sessionDate) => {
  try {
    const treatment = get().treatments.find((t) => t.id === treatmentId);
    if (!treatment) {
      throw new Error("العلاج غير موجود");
    }

    if (treatment.status !== "in_progress") {
      throw new Error("لا يمكن إضافة جلسة لعلاج غير جاري");
    }

    const sessionId = get().lastSessionId + 1;
    const now = new Date().toISOString();
    const sessionNumber = treatment.sessions.length + 1;

    const newSession: TreatmentSession = {
      id: sessionId,
      treatmentId,
      sessionNumber,
      date: sessionDate || now,
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      treatments: state.treatments.map((t) =>
        t.id === treatmentId
          ? { ...t, sessions: [...t.sessions, newSession], updatedAt: now }
          : t
      ),
      lastSessionId: sessionId,
    }));

    return newSession;
  } catch (error) {
    throw error;
  }
};
```

### 🧩 مكونات العلاجات الرئيسية

#### **مكون AddTreatmentModal**

**الوظائف:**

- إضافة علاج جديد للمريض
- اختيار المريض من قائمة منسدلة
- اختيار الطبيب المعالج
- تحديد تكلفة العلاج
- إدخال ملاحظات الجلسة الأولى
- تحديد أرقام الأسنان المتأثرة
- استخدام قوالب العلاجات المحفوظة

**المميزات:**

- تحقق من البيانات المدخلة
- بحث سريع في المرضى
- تكامل مع نظام القوالب
- واجهة مستخدم سهلة الاستخدام
- انيميشن فتح وإغلاق

#### **مكون OptimizedTreatmentsList**

**الوظائف:**

- عرض قائمة العلاجات للمريض
- تصفية العلاجات حسب الحالة
- عرض تفاصيل كل علاج
- إدارة الجلسات
- حساب التكاليف والمدفوعات

**المميزات:**

- أداء محسن للقوائم الطويلة
- تحميل تدريجي للبيانات
- تصفية وترتيب متقدم
- عرض حالة الدفع لكل علاج
- أزرار إجراءات سريعة

#### **مكون CompleteTreatmentModal**

**الوظائف:**

- إكمال العلاج الجاري
- إضافة ملاحظات نهائية
- تعديل التكلفة النهائية
- تأكيد إكمال العلاج

**المميزات:**

- عرض ملخص العلاج
- تحقق من البيانات
- إمكانية تعديل التكلفة
- حفظ الملاحظات النهائية

#### **مكون TreatmentDetailsModal**

**الوظائف:**

- عرض تفاصيل العلاج الكاملة
- قائمة جلسات العلاج
- معلومات المريض والطبيب
- تاريخ العلاج والحالة

**المميزات:**

- عرض شامل للمعلومات
- تنسيق جميل للبيانات
- إمكانية الطباعة
- روابط سريعة للإجراءات

### 🔐 نظام التحقق من البيانات

#### **التحقق من بيانات العلاج**

```typescript
const validateTreatmentData = (
  treatment: Partial<Treatment>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // التحقق من اسم العلاج
  if (!treatment.name || treatment.name.trim().length < 2) {
    errors.push("اسم العلاج يجب أن يكون على الأقل حرفين");
  }

  // التحقق من معرف المريض
  if (!treatment.patientId || treatment.patientId <= 0) {
    errors.push("معرف المريض مطلوب");
  }

  // التحقق من التكلفة
  if (
    treatment.cost !== undefined &&
    (isNaN(treatment.cost) || treatment.cost < 0)
  ) {
    errors.push("تكلفة العلاج يجب أن تكون رقماً صحيحاً");
  }

  // التحقق من تاريخ البداية
  if (!treatment.startDate) {
    errors.push("تاريخ بداية العلاج مطلوب");
  } else if (new Date(treatment.startDate) > new Date()) {
    errors.push("تاريخ بداية العلاج لا يمكن أن يكون في المستقبل");
  }

  // التحقق من أرقام الأسنان
  if (treatment.teethNumbers && treatment.teethNumbers.length > 0) {
    const validTeethNumbers = [...ISOTeeth.permanent, ...ISOTeeth.deciduous];
    const invalidTeeth = treatment.teethNumbers.filter(
      (tooth) => !validTeethNumbers.includes(tooth)
    );
    if (invalidTeeth.length > 0) {
      errors.push(
        `أرقام الأسنان التالية غير صحيحة: ${invalidTeeth.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

#### **التحقق من بيانات الجلسة**

```typescript
const validateSessionData = (
  session: Partial<TreatmentSession>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!session.treatmentId || session.treatmentId <= 0) {
    errors.push("معرف العلاج مطلوب");
  }

  if (!session.notes || session.notes.trim().length < 2) {
    errors.push("ملاحظات الجلسة مطلوبة");
  }

  if (!session.date) {
    errors.push("تاريخ الجلسة مطلوب");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

#### **التحقق من بيانات قالب العلاج**

```typescript
const validateTemplateData = (
  template: Partial<TreatmentTemplate>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length < 2) {
    errors.push("اسم قالب العلاج يجب أن يكون على الأقل حرفين");
  }

  if (
    template.defaultCost === undefined ||
    isNaN(template.defaultCost) ||
    template.defaultCost <= 0
  ) {
    errors.push("التكلفة الافتراضية يجب أن تكون رقماً موجباً");
  }

  if (!template.category || template.category.trim().length === 0) {
    errors.push("تصنيف العلاج مطلوب");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

### 🚀 تحسينات الأداء

#### **تحسين البحث والتصفية**

```typescript
// استخدام useMemo لتحسين البحث
const filteredTreatments = useMemo(() => {
  if (!searchQuery.trim()) {
    return allTreatments;
  }

  const query = searchQuery.toLowerCase().trim();
  return allTreatments.filter((treatment) => {
    const patient = getPatientById(treatment.patientId);
    return (
      patient?.name.toLowerCase().includes(query) ||
      treatment.name.toLowerCase().includes(query)
    );
  });
}, [allTreatments, searchQuery, getPatientById]);
```

#### **تحسين عرض القوائم**

```typescript
// استخدام React.memo لتحسين الأداء
const TreatmentCard = React.memo(({ treatment, onAction }) => {
  return <div className="treatment-card">{/* محتوى البطاقة */}</div>;
});

// استخدام useCallback لتحسين الأداء
const handleTreatmentAction = useCallback(
  (treatmentId: number, action: string) => {
    switch (action) {
      case "view":
        setSelectedTreatment(treatments.find((t) => t.id === treatmentId));
        setIsTreatmentDetailsModalOpen(true);
        break;
      case "addSession":
        setSelectedTreatment(treatments.find((t) => t.id === treatmentId));
        setIsAddSessionModalOpen(true);
        break;
      case "complete":
        setSelectedTreatment(treatments.find((t) => t.id === treatmentId));
        setIsCompleteTreatmentModalOpen(true);
        break;
    }
  },
  [treatments]
);
```

#### **تحسين تحميل البيانات**

```typescript
// تحميل البيانات بشكل تدريجي
const useInfiniteScroll = (
  treatments: Treatment[],
  itemsPerPage: number = 10
) => {
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);

  const loadMore = useCallback(() => {
    setDisplayedItems((prev) =>
      Math.min(prev + itemsPerPage, treatments.length)
    );
  }, [treatments.length, itemsPerPage]);

  const visibleTreatments = useMemo(() => {
    return treatments.slice(0, displayedItems);
  }, [treatments, displayedItems]);

  return {
    visibleTreatments,
    loadMore,
    hasMore: displayedItems < treatments.length,
  };
};
```

### 📊 إحصائيات العلاجات

#### **حساب الإحصائيات**

```typescript
const getTreatmentStats = (treatments: Treatment[]): TreatmentStats => {
  const stats = treatments.reduce(
    (acc, treatment) => {
      acc.total++;

      switch (treatment.status) {
        case "completed":
          acc.completed++;
          acc.totalRevenue += treatment.cost;
          break;
        case "in_progress":
          acc.inProgress++;
          break;
        case "cancelled_incomplete":
        case "cancelled_no_sessions":
          acc.cancelled++;
          break;
      }

      return acc;
    },
    {
      total: 0,
      completed: 0,
      inProgress: 0,
      planned: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageCost: 0,
    }
  );

  stats.averageCost =
    stats.completed > 0 ? stats.totalRevenue / stats.completed : 0;

  return stats;
};
```

#### **تصفية العلاجات المتقدمة**

```typescript
const filterTreatments = (
  treatments: Treatment[],
  filters: TreatmentFilters
): Treatment[] => {
  return treatments.filter((treatment) => {
    // تصفية حسب المريض
    if (filters.patientId && treatment.patientId !== filters.patientId) {
      return false;
    }

    // تصفية حسب الحالة
    if (filters.status && treatment.status !== filters.status) {
      return false;
    }

    // تصفية حسب النطاق الزمني
    if (filters.dateRange) {
      const treatmentDate = new Date(treatment.startDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);

      if (treatmentDate < startDate || treatmentDate > endDate) {
        return false;
      }
    }

    // تصفية حسب الطبيب
    if (filters.doctorId && treatment.doctorId !== filters.doctorId) {
      return false;
    }

    // تصفية حسب التكلفة
    if (filters.minCost && treatment.cost < filters.minCost) {
      return false;
    }

    if (filters.maxCost && treatment.cost > filters.maxCost) {
      return false;
    }

    return true;
  });
};
```

---
