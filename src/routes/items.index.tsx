import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutGrid,
  Rows3,
  Search,
  X,
  Sparkles,
  Filter,
  Eye as EyeIcon,
  Layers,
  Tag,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Table as TableIcon,
  CheckCircle2,
} from "lucide-react";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import {
  KINDS,
  formatDiopter,
  formatPrice,
  getAllMainTypes,
  getSecondTypesForMainType,
  hasLensPowers,
  kindShort,
  lensLabel,
  parseDiopter,
  rangeLabel,
  rowMatches,
} from "@/lib/db";
import { normalizeOpticalTerm } from "@/lib/pdf-parser";
import type { Eye, EyeScope, Item, ItemSize, ProductKind } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/items/")({
  head: () => ({
    meta: [
      { title: "البحث والكتالوج — درجات السفير والسلندر والأسعار" },
      {
        name: "description",
        content:
          "البحث في كتالوج النظارات والعدسات بالنوع الرئيسي والفرعي ودرجات السفير والسلندر وعرض المقاسات والأسعار فوراً.",
      },
      { property: "og:title", content: "البحث والكتالوج — Optical Store Pro" },
      {
        property: "og:description",
        content:
          "البحث في كتالوج النظارات والعدسات بالنوع الرئيسي والفرعي ودرجات السفير والسلندر وعرض المقاسات والأسعار فوراً.",
      },
    ],
  }),
  component: ItemsSearch,
});

interface GroupedProduct {
  item: Item;
  supplierName: string;
  categoryName: string;
  lensTypeName: string;
  mainType: string;
  secondType: string;
  minPrice: number;
  maxPrice: number;
  matchingSizes: ItemSize[];
  allItemSizes: ItemSize[];
}

function ItemsSearch() {
  const { db, language } = useApp();
  const [sphQuery, setSphQuery] = useState("");
  const [cylQuery, setCylQuery] = useState("");
  const [eyeFilter, setEyeFilter] = useState<"all" | Eye>("all");
  const [exact, setExact] = useState(true);
  const [text, setText] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [category, setCategory] = useState("all");
  const [kindFilter, setKindFilter] = useState<"all" | ProductKind>("all");
  const [lensTypeFilter, setLensTypeFilter] = useState("all");
  const [frameTypeFilter, setFrameTypeFilter] = useState("all");
  const [mainTypeFilter, setMainTypeFilter] = useState<string>("all");
  const [secondTypeFilter, setSecondTypeFilter] = useState<string>("all");
  const [view, setView] = useState<"matrix" | "cards" | "table">("matrix");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const isAr = language === "ar";

  // Dynamic Main Types list from Database
  const allMainTypes = useMemo(() => getAllMainTypes(db), [db]);

  // Available Second Types for the currently selected Main Type
  const availableSecondTypes = useMemo(
    () => getSecondTypesForMainType(db, mainTypeFilter),
    [db, mainTypeFilter],
  );

  const handleMainTypeChange = (val: string) => {
    setMainTypeFilter(val);
    setSecondTypeFilter("all");
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Helper matching function for main types
  const isMainTypeMatch = (targetMain: string | undefined, filter: string) => {
    if (filter === "all") return true;
    if (!targetMain) return false;
    const normTarget = normalizeOpticalTerm(targetMain);
    const normFilter = normalizeOpticalTerm(filter);
    return (
      normTarget === normFilter ||
      normTarget.includes(normFilter) ||
      normFilter.includes(normTarget)
    );
  };

  // Helper matching function for second types
  const isSecondTypeMatch = (
    targetSecond: string | undefined,
    sizeNote: string | undefined,
    filter: string,
  ) => {
    if (filter === "all") return true;
    const normFilter = normalizeOpticalTerm(filter);
    if (targetSecond) {
      const normSecond = normalizeOpticalTerm(targetSecond);
      if (
        normSecond === normFilter ||
        normSecond.includes(normFilter) ||
        normFilter.includes(normSecond)
      ) {
        return true;
      }
    }
    if (sizeNote) {
      const normNote = normalizeOpticalTerm(sizeNote);
      if (normNote.includes(normFilter) || normFilter.includes(normNote)) {
        return true;
      }
    }
    return false;
  };

  // Count items and sizes per Main Type for informative chips
  const mainTypeCounts = useMemo(() => {
    const counts: Record<string, { items: number; sizes: number }> = {};
    for (const mt of allMainTypes) {
      counts[mt] = { items: 0, sizes: 0 };
    }
    for (const item of db.items) {
      const itemMain = item.main_type || "أخرى";
      for (const mt of allMainTypes) {
        if (
          isMainTypeMatch(itemMain, mt) ||
          normalizeOpticalTerm(item.name).includes(normalizeOpticalTerm(mt))
        ) {
          if (!counts[mt]) counts[mt] = { items: 0, sizes: 0 };
          counts[mt].items += 1;
        }
      }
    }
    for (const size of db.sizes) {
      const sizeMain = size.main_type;
      if (sizeMain) {
        for (const mt of allMainTypes) {
          if (isMainTypeMatch(sizeMain, mt)) {
            if (!counts[mt]) counts[mt] = { items: 0, sizes: 0 };
            counts[mt].sizes += 1;
          }
        }
      }
    }
    return counts;
  }, [allMainTypes, db.items, db.sizes]);

  // Main Grouped Products Calculation
  const groupedProducts: GroupedProduct[] = useMemo(() => {
    const sphQ = parseDiopter(sphQuery);
    const cylQ = parseDiopter(cylQuery);
    const tol = exact ? 0 : 0.5;
    const t = text.trim().toLowerCase();

    const groups: GroupedProduct[] = [];

    for (const item of db.items) {
      // Basic Filters
      if (kindFilter !== "all" && item.kind !== kindFilter) continue;
      if (frameTypeFilter !== "all" && item.frame_type_id !== frameTypeFilter) continue;
      if (supplier !== "all" && item.supplier_id !== supplier) continue;
      if (category !== "all" && item.customer_category_id !== category) continue;
      if (t && !(item.name.toLowerCase().includes(t) || item.sku.toLowerCase().includes(t))) {
        continue;
      }

      // Check Main Type Match
      const itemMain = item.main_type || "";
      const itemName = item.name || "";
      const itemNotes = item.notes || "";
      const itemMatchesMain =
        mainTypeFilter === "all" ||
        isMainTypeMatch(itemMain, mainTypeFilter) ||
        normalizeOpticalTerm(itemName).includes(normalizeOpticalTerm(mainTypeFilter)) ||
        normalizeOpticalTerm(itemNotes).includes(normalizeOpticalTerm(mainTypeFilter));

      // Get all sizes for this item
      const itemSizes = db.sizes
        .filter((s) => s.item_id === item.id)
        .sort((a, b) => (a.eye === b.eye ? a.sph_min - b.sph_min : a.eye < b.eye ? -1 : 1));

      // Check if sizes match Main Type
      const sizesMatchingMain = itemSizes.filter((s) => {
        if (mainTypeFilter === "all") return true;
        const resolvedSizeMain = s.main_type || itemMain;
        return isMainTypeMatch(resolvedSizeMain, mainTypeFilter) || itemMatchesMain;
      });

      if (mainTypeFilter !== "all" && !itemMatchesMain && sizesMatchingMain.length === 0) {
        continue;
      }

      const supplierName = db.suppliers.find((s) => s.id === item.supplier_id)?.name ?? "—";
      const categoryName =
        db.categories.find((c) => c.id === item.customer_category_id)?.name ?? "—";
      const lensTypeName = db.lens_types.find((l) => l.id === item.lens_type_id)?.name ?? "—";

      // If Frame Only
      if (!hasLensPowers(item.kind)) {
        if (
          lensTypeFilter !== "all" ||
          (mainTypeFilter !== "all" && !itemMatchesMain) ||
          secondTypeFilter !== "all"
        ) {
          continue;
        }
        groups.push({
          item,
          supplierName,
          categoryName,
          lensTypeName: "—",
          mainType: item.main_type || "شنبر",
          secondType: item.second_type || "—",
          minPrice: item.price ?? 0,
          maxPrice: item.price ?? 0,
          matchingSizes: [],
          allItemSizes: [],
        });
        continue;
      }

      // Filter sizes by Second Type & SPH/CYL & Eye
      const matchingSizes = sizesMatchingMain.filter((s) => {
        if (lensTypeFilter !== "all" && (s.lens_type_id ?? item.lens_type_id) !== lensTypeFilter) {
          return false;
        }

        if (secondTypeFilter !== "all") {
          const resolvedSecond = s.second_type || item.second_type;
          if (!isSecondTypeMatch(resolvedSecond, s.note, secondTypeFilter)) {
            return false;
          }
        }

        return rowMatches(s, { sph: sphQ, cyl: cylQ, eye: eyeFilter }, tol);
      });

      // If SPH/CYL or Second Type filter is applied and no sizes match, skip
      if (matchingSizes.length === 0 && (sphQuery || cylQuery || secondTypeFilter !== "all")) {
        continue;
      }

      const activeSizes = matchingSizes.length > 0 ? matchingSizes : sizesMatchingMain;
      const prices = (activeSizes.length > 0 ? activeSizes : itemSizes).map((s) => s.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : (item.price ?? 0);
      const maxPrice = prices.length > 0 ? Math.max(...prices) : (item.price ?? 0);

      const resolvedMain = item.main_type || activeSizes[0]?.main_type || "بلاستيك أبيض 65M";
      const resolvedSecond =
        item.second_type || activeSizes[0]?.second_type || activeSizes[0]?.note || "1.56 ستوك";

      groups.push({
        item,
        supplierName,
        categoryName,
        lensTypeName,
        mainType: resolvedMain,
        secondType: resolvedSecond,
        minPrice,
        maxPrice,
        matchingSizes: activeSizes,
        allItemSizes: itemSizes,
      });
    }

    // Sort by minimum price
    groups.sort((a, b) => a.minPrice - b.minPrice);
    return groups;
  }, [
    db,
    sphQuery,
    cylQuery,
    eyeFilter,
    exact,
    text,
    supplier,
    category,
    kindFilter,
    lensTypeFilter,
    frameTypeFilter,
    mainTypeFilter,
    secondTypeFilter,
  ]);

  // Flat rows list for table view & counter
  const totalSizesCount = useMemo(() => {
    return groupedProducts.reduce((acc, g) => acc + (g.matchingSizes.length || 1), 0);
  }, [groupedProducts]);

  return (
    <AppShell
      title={isAr ? "البحث والكتالوج" : "Search & Catalog"}
      description={
        isAr
          ? "البحث الذكي بدرجات السفير (SPH) والسلندر (CYL) والنوع الرئيسي (MAIN TYPE) والفرعي (SECOND TYPE)."
          : "Smart optical search by SPH/CYL powers, MAIN TYPE, and SECOND TYPE hierarchy."
      }
    >
      <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* MAIN TYPE & SECOND TYPE HIERARCHICAL FILTER BAR */}
        <div className="rounded-2xl border-2 border-sky-600/40 bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 p-5 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Layers className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  فلترة النوع الرئيسي (MAIN TYPE) والنوع الفرعي (SECOND TYPE)
                </h2>
                <p className="text-xs text-slate-400">
                  حدد النوع الرئيسي لرؤية كافة أصنافه ومقاساته، ثم حدد النوع الفرعي لعرض المقاسات
                  والأسعار بدقة.
                </p>
              </div>
            </div>

            {(mainTypeFilter !== "all" || secondTypeFilter !== "all") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMainTypeFilter("all");
                  setSecondTypeFilter("all");
                }}
                className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-8"
              >
                <X className="h-3.5 w-3.5 ml-1" /> إعادة ضبط الأنواع
              </Button>
            )}
          </div>

          {/* Quick Click Chips for ALL Main Types */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-sky-400" />
                1. اختر النوع الرئيسي (MAIN TYPE):
              </Label>
              <span className="text-[11px] text-slate-400">
                متاح {allMainTypes.length} نوع رئيسي
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleMainTypeChange("all")}
                className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  mainTypeFilter === "all"
                    ? "border-sky-500 bg-sky-600 text-white shadow-sky-600/30"
                    : "border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                }`}
              >
                (All) كل الأنواع الرئيسية
              </button>
              {allMainTypes.map((mt) => {
                const count = mainTypeCounts[mt]?.items || 0;
                const isSelected = mainTypeFilter === mt;
                return (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => handleMainTypeChange(mt)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "border-sky-400 bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]"
                        : "border-slate-800 bg-slate-950/80 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{mt}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white font-mono"
                            : "bg-slate-800 text-slate-400 font-mono"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECOND TYPE SELECTION (Appears when Main Type is selected or always available) */}
          <div className="rounded-xl border border-sky-900/40 bg-slate-950/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-emerald-400" />
                2. اختر النوع الفرعي (SECOND TYPE) التابع
                {mainTypeFilter !== "all" ? ` لـ "${mainTypeFilter}":` : ":"}
              </Label>
              {secondTypeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setSecondTypeFilter("all")}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  إلغاء تحديد الفرعي (عرض الكل)
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSecondTypeFilter("all")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  secondTypeFilter === "all"
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-emerald-500/20"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                }`}
              >
                (All) كل الأنواع الفرعية
              </button>
              {availableSecondTypes.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSecondTypeFilter(st)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                    secondTypeFilter === st
                      ? "border-emerald-400 bg-emerald-500/25 text-emerald-300 shadow-md shadow-emerald-500/20 scale-[1.02]"
                      : "border-slate-800 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prescription Search Inputs & Quick Filters */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl space-y-4">
          <div className={kindFilter === "frame" ? "hidden" : "space-y-3"}>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="sph"
                className="text-xs font-bold text-sky-300 flex items-center gap-1.5"
              >
                <EyeIcon className="h-4 w-4" /> البحث الدقيق بمقاسات الباور (SPH / CYL)
              </Label>
              <span className="text-[11px] text-slate-400">
                مثال: اكتب <code className="text-sky-400 font-bold font-mono">-2.00</code> في SPH
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_140px_140px]">
              <div className="relative">
                <Input
                  id="sph"
                  inputMode="decimal"
                  value={sphQuery}
                  onChange={(e) => setSphQuery(e.target.value)}
                  placeholder="SPH سفير (مثلاً: -2.00 أو +4.50)"
                  className="h-12 bg-slate-950 border-slate-800 text-base font-bold font-mono text-center text-white"
                />
                {sphQuery ? (
                  <button
                    type="button"
                    onClick={() => setSphQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="relative">
                <Input
                  id="cyl"
                  inputMode="decimal"
                  value={cylQuery}
                  onChange={(e) => setCylQuery(e.target.value)}
                  placeholder="CYL سلندر (مثلاً: -1.00)"
                  className="h-12 bg-slate-950 border-slate-800 text-base font-bold font-mono text-center text-white"
                />
                {cylQuery ? (
                  <button
                    type="button"
                    onClick={() => setCylQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <Select value={eyeFilter} onValueChange={(v) => setEyeFilter(v as "all" | Eye)}>
                <SelectTrigger className="h-12 bg-slate-950 border-slate-800 text-xs">
                  <SelectValue placeholder="العين" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كلتا العينين (R+L)</SelectItem>
                  <SelectItem value="R">العين اليمنى (R)</SelectItem>
                  <SelectItem value="L">العين اليسرى (L)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant={exact ? "default" : "outline"}
                className={`h-12 text-xs font-bold ${
                  exact ? "bg-sky-600 hover:bg-sky-500 text-white" : "border-slate-700"
                }`}
                onClick={() => setExact((v) => !v)}
              >
                {exact ? "تطابق دقيق (Exact)" : "تقارب ±0.50"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4 pt-3 border-t border-slate-800/80">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="بحث باسم الصنف أو كود SKU..."
                className="pr-9 bg-slate-950 border-slate-800 text-xs text-white"
              />
            </div>

            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                <SelectValue placeholder="كل الموردين والشركات" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">كل الموردين والشركات</SelectItem>
                {db.suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                <SelectValue placeholder="فئة العملاء" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">كل فئات العملاء</SelectItem>
                {db.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Header & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                تم العثور على{" "}
                <span className="text-sky-400 font-mono text-base font-extrabold">
                  {groupedProducts.length}
                </span>{" "}
                صنف / منتج (بإجمالي{" "}
                <span className="text-emerald-400 font-mono text-base font-extrabold">
                  {totalSizesCount}
                </span>{" "}
                مقاس وسعر)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {mainTypeFilter !== "all" && (
                <Badge className="bg-sky-950 border-sky-800 text-sky-300">
                  النوع الرئيسي: {mainTypeFilter}
                </Badge>
              )}
              {secondTypeFilter !== "all" && (
                <Badge className="bg-emerald-950 border-emerald-800 text-emerald-300">
                  النوع الفرعي: {secondTypeFilter}
                </Badge>
              )}
              {sphQuery && (
                <Badge className="bg-blue-950 border-blue-800 text-blue-300 font-mono">
                  SPH: {sphQuery}
                </Badge>
              )}
              {cylQuery && (
                <Badge className="bg-blue-950 border-blue-800 text-blue-300 font-mono">
                  CYL: {cylQuery}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Button
              size="sm"
              variant={view === "matrix" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-bold gap-1.5 ${
                view === "matrix" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setView("matrix")}
            >
              <TableIcon className="h-3.5 w-3.5" /> مصفوفة المقاسات والأسعار
            </Button>
            <Button
              size="sm"
              variant={view === "cards" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-bold gap-1.5 ${
                view === "cards" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setView("cards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> كروت المنتجات
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "default" : "ghost"}
              className={`h-8 px-3 text-xs font-bold gap-1.5 ${
                view === "table" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              onClick={() => setView("table")}
            >
              <Rows3 className="h-3.5 w-3.5" /> جدول شامل
            </Button>
          </div>
        </div>

        {/* Results Render */}
        {groupedProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400 space-y-3">
            <Search className="mx-auto h-10 w-10 text-slate-500" />
            <p className="text-base font-bold text-slate-200">
              لم يتم العثور على أصناف تطابق هذا التحديد.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              جرب الضغط على زر &quot;إعادة ضبط الأنواع&quot; أو اختيار نوع رئيسي مختلف مثل
              &quot;بلاستيك أبيض 65M&quot; أو &quot;بلوكت&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMainTypeFilter("all");
                setSecondTypeFilter("all");
                setSphQuery("");
                setCylQuery("");
                setText("");
              }}
              className="border-slate-700 text-sky-400 hover:bg-slate-800"
            >
              إعادة تعيين كافة الفلاتر
            </Button>
          </div>
        ) : view === "matrix" ? (
          /* MATRIX VIEW: FULL BREAKDOWN OF MAIN TYPE -> SECOND TYPES -> SIZES & PRICES */
          <div className="space-y-6">
            {groupedProducts.map((g) => {
              const isExpanded = expandedItems[g.item.id] !== false; // Default expanded
              return (
                <div
                  key={g.item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden transition-all hover:border-slate-700"
                >
                  {/* Master Card Header */}
                  <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/items/$id"
                          params={{ id: g.item.id }}
                          className="text-base font-bold text-white hover:text-sky-400 transition-colors"
                        >
                          {g.item.name}
                        </Link>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 font-mono">
                          {g.item.sku}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-lg bg-sky-950/90 text-sky-300 border border-sky-800/80 px-2.5 py-0.5 font-bold">
                          النوع الرئيسي: {g.mainType}
                        </span>
                        {g.secondType && g.secondType !== "—" && (
                          <span className="rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 px-2.5 py-0.5 font-bold">
                            النوع الفرعي: {g.secondType}
                          </span>
                        )}
                        <span className="text-slate-400">المورد: {g.supplierName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">الفئة: {g.categoryName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="text-[11px] text-slate-400 block">نطاق الأسعار</span>
                        <span className="text-lg font-extrabold text-emerald-400 font-mono">
                          {g.minPrice === g.maxPrice
                            ? formatPrice(g.minPrice)
                            : `${formatPrice(g.minPrice)} ~ ${formatPrice(g.maxPrice)}`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(g.item.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Matrix Table: All Sizes and Prices for this Item */}
                  {isExpanded && (
                    <div className="p-0">
                      {g.matchingSizes.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          لا توجد مقاسات محددة مسجلة لهذا الصنف، السعر الثابت:{" "}
                          <strong className="text-emerald-400 font-mono">
                            {formatPrice(g.item.price)}
                          </strong>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-950/90">
                              <TableRow className="border-slate-800 text-xs">
                                <TableHead className="text-right text-slate-300">
                                  العين (Eye)
                                </TableHead>
                                <TableHead className="text-right text-slate-300">
                                  نطاق السفير (SPH Power)
                                </TableHead>
                                <TableHead className="text-right text-slate-300">
                                  نطاق السلندر (CYL Power)
                                </TableHead>
                                <TableHead className="text-right text-slate-300">
                                  النوع الفرعي (Second Type)
                                </TableHead>
                                <TableHead className="text-right text-slate-300">
                                  ملاحظات / المواصفات
                                </TableHead>
                                <TableHead className="text-left text-slate-300 font-bold">
                                  السعر النهائي (Price)
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {g.matchingSizes.map((s) => {
                                const resolvedSizeSecond = s.second_type || g.secondType;
                                const isCurrentPowerMatch =
                                  sphQuery || cylQuery
                                    ? rowMatches(
                                        s,
                                        {
                                          sph: parseDiopter(sphQuery),
                                          cyl: parseDiopter(cylQuery),
                                          eye: eyeFilter,
                                        },
                                        exact ? 0 : 0.5,
                                      )
                                    : false;

                                return (
                                  <TableRow
                                    key={s.id}
                                    className={`border-slate-800/80 transition-colors ${
                                      isCurrentPowerMatch
                                        ? "bg-sky-500/10 border-sky-500/40"
                                        : "hover:bg-slate-800/40"
                                    }`}
                                  >
                                    <TableCell className="font-mono text-xs">
                                      <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                                        {s.eye === "B"
                                          ? "R+L (كلتا العينين)"
                                          : s.eye === "R"
                                            ? "R (يمنى)"
                                            : "L (يسرى)"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm font-bold text-sky-300">
                                      {formatDiopter(s.sph_min)} → {formatDiopter(s.sph_max)}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm font-bold text-slate-200">
                                      {formatDiopter(s.cyl_min)} → {formatDiopter(s.cyl_max)}
                                    </TableCell>
                                    <TableCell>
                                      <span className="rounded-md bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 text-xs text-emerald-300 font-semibold">
                                        {resolvedSizeSecond}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                      {s.note || "—"}
                                    </TableCell>
                                    <TableCell className="text-left font-mono font-extrabold text-base text-emerald-400">
                                      {formatPrice(s.price)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : view === "cards" ? (
          /* CARDS VIEW */
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groupedProducts.map((g) => (
              <Link
                key={g.item.id}
                to="/items/$id"
                params={{ id: g.item.id }}
                className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg transition-all hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  {g.item.image ? (
                    <img
                      src={g.item.image}
                      alt={g.item.name}
                      className="h-40 w-full bg-slate-950 object-cover"
                    />
                  ) : (
                    <ImagePlaceholder className="h-40 w-full bg-slate-950" />
                  )}
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 text-right">
                        <h3 className="truncate font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                          {g.item.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">{g.item.sku}</p>
                      </div>
                      <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs shrink-0 font-mono">
                        {g.matchingSizes.length} مقاسات
                      </Badge>
                    </div>

                    {/* MAIN TYPE & SECOND TYPE BADGES */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-lg bg-sky-950/80 text-sky-300 border border-sky-800/60 px-2 py-0.5 text-xs font-bold">
                        {g.mainType}
                      </span>
                      {g.secondType && g.secondType !== "—" && (
                        <span className="rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 text-xs font-bold">
                          {g.secondType}
                        </span>
                      )}
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-400 block">السعر:</span>
                      <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                        {g.minPrice === g.maxPrice
                          ? formatPrice(g.minPrice)
                          : `${formatPrice(g.minPrice)} ~ ${formatPrice(g.maxPrice)}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300 pt-1">
                      <span className="rounded-md bg-slate-800 px-2 py-0.5">{g.supplierName}</span>
                      <span className="rounded-md bg-slate-800 px-2 py-0.5">{g.categoryName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>المقاسات: {g.matchingSizes.length} نطاق</span>
                  <span className="text-sky-400 group-hover:underline">عرض التفاصيل ←</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800">
                  <TableHead className="text-right">الصنف</TableHead>
                  <TableHead className="text-right">النوع الرئيسي (MAIN)</TableHead>
                  <TableHead className="text-right">النوع الفرعي (SECOND)</TableHead>
                  <TableHead className="text-right">نطاق المقاسات (SPH / CYL)</TableHead>
                  <TableHead className="text-right">المورد</TableHead>
                  <TableHead className="text-left font-bold">السعر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedProducts.map((g) => (
                  <TableRow key={g.item.id} className="border-slate-800">
                    <TableCell>
                      <Link
                        to="/items/$id"
                        params={{ id: g.item.id }}
                        className="font-bold text-slate-200 hover:text-sky-400"
                      >
                        {g.item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-sky-950/80 text-sky-300 border border-sky-800/50 px-2 py-0.5 text-xs font-semibold">
                        {g.mainType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 text-xs font-semibold">
                        {g.secondType}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-sky-300">
                      {g.matchingSizes.length > 0
                        ? `${g.matchingSizes.length} نطاق مقاسات`
                        : "سعر ثابت"}
                    </TableCell>
                    <TableCell className="text-slate-300 text-xs">{g.supplierName}</TableCell>
                    <TableCell className="text-left font-mono font-bold text-emerald-400 text-base">
                      {g.minPrice === g.maxPrice
                        ? formatPrice(g.minPrice)
                        : `${formatPrice(g.minPrice)} ~ ${formatPrice(g.maxPrice)}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
