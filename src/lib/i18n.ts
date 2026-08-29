export type Language = "ar" | "en";

export interface Translations {
  appName: string;
  appSubtitle: string;
  dashboard: string;
  priceUpdates: string;
  salesInvoices: string;
  searchCatalog: string;
  addProduct: string;
  lensTypes: string;
  frameTypes: string;
  suppliers: string;
  customerGroups: string;
  settings: string;
  login: string;
  logout: string;
  offlineReady: string;
  connected: string;
  quickPriceUpdate: string;
  toggleTheme: string;
  switchLanguage: string;
  searchPlaceholder: string;
  sph: string;
  cyl: string;
  axis: string;
  pd: string;
  price: string;
  quantity: string;
  total: string;
  discount: string;
  paid: string;
  remaining: string;
  customerName: string;
  customerPhone: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  confirm: string;
  autoImportSuccess: string;
  goToCatalog: string;
  viewItems: string;
}

export const DICTIONARY: Record<Language, Record<string, string>> = {
  ar: {
    appName: "Optical Store Pro",
    appSubtitle: "نظام إدارة البصريات وتحديث الأسعار",
    dashboard: "لوحة التحكم",
    priceUpdates: "تحديث الأسعار",
    salesInvoices: "المبيعات والفواتير",
    searchCatalog: "البحث والكتالوج",
    addProduct: "إضافة صنف",
    lensTypes: "أنواع العدسات",
    frameTypes: "أنواع الشنابر",
    suppliers: "الموردين والشركات",
    customerGroups: "فئات العملاء",
    settings: "الإعدادات",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    offlineReady: "يعمل محلياً (آمن 100%)",
    connected: "متصل",
    quickPriceUpdate: "تحديث الأسعار (PDF)",
    toggleTheme: "تبديل المظهر",
    switchLanguage: "English",
    searchPlaceholder: "ابحث باسم الصنف أو كود SKU أو المورد...",
    sph: "السفير (SPH)",
    cyl: "السلندر (CYL)",
    axis: "المحور (AXIS)",
    pd: "مسافة الحدقتين (PD)",
    price: "السعر",
    quantity: "الكمية",
    total: "الإجمالي",
    discount: "الخصم",
    paid: "المدفوع / العربون",
    remaining: "المتبقي",
    customerName: "اسم العميل",
    customerPhone: "رقم هاتف العميل",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    confirm: "تأكيد",
    autoImportSuccess: "تم استخراج وإضافة الأصناف إلى الكتالوج تلقائياً بنجاح!",
    goToCatalog: "الانتقال إلى الكتالوج والبحث",
    viewItems: "عرض الأصناف",
    exactMatch: "تطابق دقيق (Exact)",
    approxMatch: "تقارب ±0.50",
    allEyes: "كلتا العينين (R+L)",
    rightEye: "العين اليمنى (OD)",
    leftEye: "العين اليسرى (OS)",
    allKinds: "كل الأصناف",
    lensesOnly: "عدسات فقط",
    framesOnly: "شنابر فقط",
    frameAndLens: "شنبر + عدسات",
    newPdfBadge: "جديد PDF",
    uploadPdfTitle: "رفع ملف PDF / قوائم أسعار",
    omabTariff: "تسعيرة اتحاد بصريين مصر 2025",
    loginSubtitle: "أدخل بيانات حسابك للوصول إلى كتالوج الأسعار والمبيعات",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    loginButton: "دخول النظام",
    demoCredentials: "الحساب الافتراضي للتجربة: admin / admin123",
    tagline: "كل عدسة. كل مقاس. السعر الدقيق فوراً.",
    taglineDesc:
      "ابحث عن أي مقاس سفير وسلندر، وحدّث قوائم الأسعار من ملفات PDF الموردين بنقرة واحدة.",
  },
  en: {
    appName: "Optical Store Pro",
    appSubtitle: "Optical Management & Price Catalog",
    dashboard: "Dashboard",
    priceUpdates: "Price Updates",
    salesInvoices: "Sales & Invoices",
    searchCatalog: "Search & Catalog",
    addProduct: "Add Product",
    lensTypes: "Lens Types",
    frameTypes: "Frame Types",
    suppliers: "Suppliers & Brands",
    customerGroups: "Customer Groups",
    settings: "Settings",
    login: "Sign In",
    logout: "Sign Out",
    offlineReady: "Local Offline (100% Secure)",
    connected: "Online",
    quickPriceUpdate: "Update Prices (PDF)",
    toggleTheme: "Toggle Theme",
    switchLanguage: "العربية",
    searchPlaceholder: "Search by item name, SKU, or supplier...",
    sph: "Sphere (SPH)",
    cyl: "Cylinder (CYL)",
    axis: "Axis",
    pd: "Pupillary Distance (PD)",
    price: "Price",
    quantity: "Qty",
    total: "Total",
    discount: "Discount",
    paid: "Paid / Deposit",
    remaining: "Remaining",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    confirm: "Confirm",
    autoImportSuccess: "Extracted and automatically added to catalog successfully!",
    goToCatalog: "Go to Search & Catalog",
    viewItems: "View Items",
    exactMatch: "Exact Match",
    approxMatch: "Tolerance ±0.50",
    allEyes: "Both Eyes (R+L)",
    rightEye: "Right Eye (OD)",
    leftEye: "Left Eye (OS)",
    allKinds: "All Products",
    lensesOnly: "Lenses Only",
    framesOnly: "Frames Only",
    frameAndLens: "Frame + Lenses",
    newPdfBadge: "New PDF",
    uploadPdfTitle: "Upload PDF / Price Lists",
    omabTariff: "Egypt Optical Union Tariff 2025",
    loginSubtitle: "Sign in to access price catalog and optical invoicing",
    username: "Username",
    password: "Password",
    loginButton: "Sign In",
    demoCredentials: "Demo Login: admin / admin123",
    tagline: "Every Lens. Every Power. Exact Price Instantly.",
    taglineDesc:
      "Search any SPH and CYL power, update optical price lists from supplier PDFs in one click.",
  },
};

export function getTranslation(lang: Language, key: string): string {
  return DICTIONARY[lang]?.[key] || DICTIONARY.ar[key] || key;
}
