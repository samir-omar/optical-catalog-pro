import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Layers,
  PlusSquare,
  Search,
  Settings,
  Tags,
  Users,
  UploadCloud,
  Receipt,
  Sparkles,
  TrendingUp,
  Glasses,
  Eye,
  ArrowRight,
  Clock,
  CircleCheck,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { formatPrice } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — كتالوج البصريات والأسعار" },
      {
        name: "description",
        content:
          "نظرة عامة على أصناف الكتالوج، المبيعات، سجلات تحديث الأسعار، وحاسبة أسعار الوصفات الفورية.",
      },
      { property: "og:title", content: "لوحة التحكم — Optical Store Pro" },
      {
        property: "og:description",
        content:
          "نظرة عامة على أصناف الكتالوج، المبيعات، سجلات تحديث الأسعار، وحاسبة أسعار الوصفات الفورية.",
      },
    ],
  }),
  component: Dashboard,
});

const QUICK_ACTIONS = [
  {
    to: "/items",
    titleAr: "بحث وفحص أسعار المقاسات والأنواع",
    titleEn: "Search & Check Prices by Type",
    text: "البحث الفوري بالنوع الرئيسي (MAIN TYPE) والفرعي (SECOND TYPE) ومقاسات السفير والسلندر.",
    icon: Search,
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    to: "/lens-types",
    titleAr: "أنواع العدسات (MAIN & SECOND)",
    titleEn: "Lens Types Management",
    text: "إدارة الأنواع الرئيسية والأنواع الفرعية وإضافة وتعديل أي نوع جديد بسهولة.",
    icon: Layers,
    badge: "MAIN / SECOND",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    to: "/price-updates",
    titleAr: "تحديث الأسعار (PDF)",
    titleEn: "Price Updates",
    text: "رفع وتحديث أسعار العدسات من ملفات PDF الموردين واتحاد بصريين مصر.",
    icon: UploadCloud,
    badge: "PDF فوري",
    gradient: "from-sky-600 to-indigo-600",
  },
  {
    to: "/add-item",
    titleAr: "إضافة أصناف وشنابر",
    titleEn: "Add New Products",
    text: "تسجيل موديلات جديدة أو نطاقات أسعار خاصة بالمحل.",
    icon: PlusSquare,
    gradient: "from-amber-600 to-orange-600",
  },
] as const;

const CHART_COLORS = ["#38bdf8", "#34d399", "#a855f7", "#fbbf24", "#f43f5e", "#818cf8"];

function Dashboard() {
  const { db, language } = useApp();
  const navigate = useNavigate();

  const isAr = language === "ar";

  // Quick Prescription Estimator
  const [calcSph, setCalcSph] = useState<number>(-2.0);
  const [calcCyl, setCalcCyl] = useState<number>(-0.5);

  const matchedSizes = db.sizes.filter(
    (s) =>
      s.sph_min <= calcSph && s.sph_max >= calcSph && s.cyl_min <= calcCyl && s.cyl_max >= calcCyl,
  );

  // Group items by kind for chart
  const lensCount = db.items.filter((i) => i.kind === "lens").length;
  const frameCount = db.items.filter((i) => i.kind === "frame").length;
  const comboCount = db.items.filter((i) => i.kind === "frame_lens").length;

  const distributionData = [
    { name: isAr ? "عدسات فقط (Lenses)" : "Lenses only", value: lensCount || 1 },
    { name: isAr ? "شنابر فقط (Frames)" : "Frames only", value: frameCount || 1 },
    { name: isAr ? "شنبر مع عدسات" : "Frame + Lens", value: comboCount || 1 },
  ];

  // Group by lens type for bar chart
  const lensTypeBreakdown = db.lens_types.map((lt) => ({
    name: lt.name.slice(0, 15),
    count: db.items.filter((i) => i.lens_type_id === lt.id).length,
  }));

  const stats = [
    {
      label: isAr ? "إجمالي المنتجات المسجلة" : "Total Products",
      value: db.items.length,
      icon: Layers,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      label: isAr ? "نطاقات وقوائم الأسعار" : "Price Ranges & Sizes",
      value: db.sizes.length,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: isAr ? "الموردين والشركات" : "Suppliers & Brands",
      value: db.suppliers.length,
      icon: Building2,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: isAr ? "الأنواع الرئيسية للعدسات" : "Main Lens Types",
      value: (db.main_types || []).length,
      icon: Tags,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <AppShell
      title={isAr ? "لوحة التحكم الرئيسية" : "Main Dashboard"}
      description={
        isAr
          ? "نظام إدارة كتالوج البصريات، تسعير العدسات بالأنواع والمقاسات، وإدارة الموردين."
          : "Optical catalog management, live lens pricing by types & powers, and supplier management."
      }
    >
      <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={`rounded-2xl border p-4 sm:p-5 shadow-lg shadow-black/20 ${bg} flex items-center justify-between transition-all hover:scale-[1.02]`}
            >
              <div className="space-y-1 text-right">
                <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {value}
                </p>
                <p className="text-xs text-slate-300 font-medium">{label}</p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950/60 ${color} border border-white/5`}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Prescription Price Estimator & Recent Updates */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Quick Prescription Estimator */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-sky-400" />
                  حاسبة أسعار الوصفات الطبية الفورية
                </h3>
                <p className="text-xs text-slate-400">
                  أدخل درجات السفير والسلندر لمعاينة أسعار جميع الموردين المتطابقين فوراً
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-sky-500/30 text-sky-300 text-xs hover:bg-sky-500/10"
                onClick={() => navigate({ to: "/items" })}
              >
                بحث مفصل بالكتالوج <ArrowRight className="mr-1 h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300">درجة السفير (SPH)</label>
                <Input
                  type="number"
                  step="0.25"
                  className="font-mono text-base font-bold bg-slate-900 text-slate-100 text-center"
                  value={calcSph}
                  onChange={(e) => setCalcSph(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-300">درجة السلندر (CYL)</label>
                <Input
                  type="number"
                  step="0.25"
                  className="font-mono text-base font-bold bg-slate-900 text-slate-100 text-center"
                  value={calcCyl}
                  onChange={(e) => setCalcCyl(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  العدسات المتطابقة مع المقاس: ({calcSph} / {calcCyl})
                </span>
                <span className="font-semibold text-sky-400">{matchedSizes.length} نتيجة</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {matchedSizes.slice(0, 5).map((size) => {
                  const item = db.items.find((i) => i.id === size.item_id);
                  const supplier = db.suppliers.find((s) => s.id === item?.supplier_id);
                  const lensType = db.lens_types.find(
                    (lt) => lt.id === size.lens_type_id || lt.id === item?.lens_type_id,
                  );

                  return (
                    <div
                      key={size.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-0.5 text-right">
                        <p className="font-bold text-sm text-slate-200">{item?.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span>{supplier?.name}</span>
                          <span>•</span>
                          <span className="text-sky-400">{lensType?.name || "عدسات طبية"}</span>
                          {size.note && <span>• {size.note}</span>}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-base font-extrabold text-emerald-400 font-mono">
                          {formatPrice(size.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {matchedSizes.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    لا توجد عدسات مسجلة لهذا المقاس حالياً. يمكنك تحديث الأسعار من ملف PDF.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Updates & Status Log */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  آخر تحديثات الأسعار (PDF)
                </h3>
                <Link
                  to="/price-updates"
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                >
                  فتح السجل <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3 mt-4">
                {(db.price_updates || []).slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs font-semibold text-sky-300 font-mono truncate max-w-[180px]">
                        {log.filename}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString("ar-EG", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                      {log.updated_count} صنف محدث
                    </Badge>
                  </div>
                ))}

                {(!db.price_updates || db.price_updates.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center space-y-2">
                    <UploadCloud className="mx-auto h-8 w-8 text-slate-500" />
                    <p className="text-xs text-slate-400">
                      لم يتم تنفيذ تحديث أسعار من ملف PDF حتى الآن.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate({ to: "/price-updates" })}
                      className="bg-sky-600 hover:bg-sky-500 text-white text-xs mt-2"
                    >
                      تحديث الأسعار الآن
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Banner */}
            <div className="rounded-xl bg-gradient-to-tr from-sky-950/60 via-slate-900 to-indigo-950/60 p-4 border border-sky-500/20 flex items-center justify-between">
              <div className="text-right">
                <span className="text-xs font-bold text-sky-300 block">
                  تسعيرة اتحاد بصريين مصر 2025
                </span>
                <span className="text-[10px] text-slate-300">
                  مدمجة وجاهزة للتطبيق الفوري بنقرة واحدة
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate({ to: "/price-updates" })}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0"
              >
                معاينة
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ to, titleAr, titleEn, text, icon: Icon, badge, gradient }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${gradient} text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                {badge && (
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px]">
                    {badge}
                  </Badge>
                )}
              </div>
              <h4 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                {titleAr}
              </h4>
              <p className="text-[11px] text-sky-400/80 font-mono mb-2">{titleEn}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
