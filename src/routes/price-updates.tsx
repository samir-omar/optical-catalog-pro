import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  Search,
  Check,
  X,
  FileCheck2,
  Trash2,
  Layers,
  ChevronRight,
  Download,
  Info,
  CheckCheck,
  Zap,
  FolderTree,
  Table as TableIcon,
  ChevronDown,
  Edit2,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { formatPrice } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  parseOpticalPriceFile,
  matchExtractedWithDatabase,
  autoImportPdfIntoDatabase,
  type AutoImportSummary,
} from "@/lib/pdf-parser";
import { buildHierarchicalStructure, getOmab2025ExtractedItems } from "@/lib/price-tariff-2025";
import type { ExtractedPriceItem, HierarchicalMainItem, PriceUpdateStatus } from "@/lib/types";

export const Route = createFileRoute("/price-updates")({
  head: () => ({
    meta: [
      { title: "استيراد وتحديث الأسعار — كتالوج البصريات الذكي" },
      {
        name: "description",
        content:
          "محرك استيراد وتحديث أسعار العدسات وقوائم الأسعار الهرمية مع ميزة المعاينة قبل التطبيق والتراجع الفوري.",
      },
      { property: "og:title", content: "تحديث الأسعار الهرمي — Optical Store Pro" },
      {
        property: "og:description",
        content:
          "محرك استيراد وتحديث أسعار العدسات وقوائم الأسعار الهرمية مع ميزة المعاينة قبل التطبيق والتراجع الفوري.",
      },
    ],
  }),
  component: PriceUpdatesPage,
});

type TabFilter = "all" | "will_update" | "no_match" | "unchanged" | "needs_review";
type ViewMode = "hierarchy" | "table";

function PriceUpdatesPage() {
  const { db, language, applyPriceUpdate, rollbackPriceUpdate, deletePriceUpdateLog } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilename, setCurrentFilename] = useState("");
  const [extractedList, setExtractedList] = useState<ExtractedPriceItem[]>([]);
  const [createNewItems, setCreateNewItems] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedMainItems, setExpandedMainItems] = useState<Record<string, boolean>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");

  const isAr = language === "ar";

  // File Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setProgressText(
      isAr ? "بدء قراءة الملف محلياً وتفكيك الهيكل الهرمي..." : "Reading file locally...",
    );
    setCurrentFilename(file.name);

    try {
      const parseResult = await parseOpticalPriceFile(file, db, (prog, text) => {
        setProgress(prog);
        setProgressText(text);
      });

      setExtractedList(parseResult.extractedItems);

      // Auto expand top 3 main items
      const initialExpanded: Record<string, boolean> = {};
      parseResult.hierarchy.slice(0, 5).forEach((h) => {
        initialExpanded[h.id] = true;
      });
      setExpandedMainItems(initialExpanded);

      toast.success(
        isAr
          ? `تم استخراج ${parseResult.extractedItems.length} تسعيرة عبر ${parseResult.parsedMainItemsCount} تصنيف رئيسي بنجاح! راجع الجدول أدناه قبل الاعتماد.`
          : `Extracted ${parseResult.extractedItems.length} prices across ${parseResult.parsedMainItemsCount} main items.`,
      );
    } catch (err) {
      console.error(err);
      toast.error(isAr ? "حدث خطأ أثناء قراءة ملف الأسعار" : "Failed to parse price list file");
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressText("");
    }
  };

  // Load Preset Egyptian Tariff (OMAB 2025)
  const handleLoadPresetTariff = () => {
    setIsProcessing(true);
    setProgress(30);
    setProgressText(
      isAr
        ? "تحميل تسعيرة اتحاد بصريين مصر الرسمية 2025..."
        : "Loading official OMAB 2025 Tariff...",
    );
    setCurrentFilename("تسعيرة_اتحاد_بصريين_مصر_2025_الرسمية.pdf");

    setTimeout(() => {
      const omabItems = getOmab2025ExtractedItems();
      const matched = matchExtractedWithDatabase(omabItems, db);
      setExtractedList(matched);

      const hierarchy = buildHierarchicalStructure(matched);
      const initialExpanded: Record<string, boolean> = {};
      hierarchy.slice(0, 6).forEach((h) => {
        initialExpanded[h.id] = true;
      });
      setExpandedMainItems(initialExpanded);

      setProgress(100);
      setIsProcessing(false);
      toast.success(
        isAr
          ? `تم تجهيز التسعيرة الرسمية الشاملة (${matched.length} مقاس وسعر موزعة على الأقسام الرئيسية).`
          : `Loaded ${matched.length} tariff entries.`,
      );
    }, 400);
  };

  // Toggle selection for single item
  const toggleItemSelection = (id: string) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  // Select all or deselect all
  const setAllSelection = (select: boolean) => {
    setExtractedList((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Select only items that have changes
  const selectOnlyChanges = () => {
    setExtractedList((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.status === "will_update" || item.status === "no_match",
      })),
    );
  };

  // Save manual in-place price edit
  const handleSavePriceEdit = (id: string) => {
    const num = parseFloat(editPriceValue);
    if (!isNaN(num) && num > 0) {
      setExtractedList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const priceDiff = item.current_price !== null ? Math.abs(item.current_price - num) : 0;
            const newStatus: PriceUpdateStatus =
              item.current_price === null
                ? "no_match"
                : priceDiff === 0
                  ? "unchanged"
                  : priceDiff > 3500
                    ? "needs_review"
                    : "will_update";
            return {
              ...item,
              new_price: num,
              status: newStatus,
              selected: newStatus !== "unchanged",
            };
          }
          return item;
        }),
      );
      toast.success(isAr ? "تم تحديث السعر يدوياً" : "Price updated manually");
    }
    setEditingPriceId(null);
    setEditPriceValue("");
  };

  // Apply Changes to Database
  const handleApplyUpdates = () => {
    const selectedItems = extractedList.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      toast.error(
        isAr ? "يرجى تحديد عنصر واحد على الأقل للتحديث" : "Please select at least one item",
      );
      return;
    }

    const result = applyPriceUpdate({
      filename: currentFilename || "تحديث_أسعار_يدوي.pdf",
      itemsToUpdate: selectedItems,
      createNewItems,
      notes: `تحديث أسعار هرمي عبر لوحة استيراد الأسعار (${selectedItems.length} عنصر)`,
    });

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });

    toast.success(
      isAr
        ? `🎉 تم تطبيق تحديث الأسعار بنجاح! تم تعديل ${result.updatedCount} تسعيرة وإنشاء ${result.createdCount} صنف جديد. الأسعار مفعلة فوراً في المبيعات والبحث.`
        : `Applied updates! Modified ${result.updatedCount} and created ${result.createdCount}.`,
    );

    // Refresh matched states
    setExtractedList((prev) => matchExtractedWithDatabase(prev, db));
  };

  // Filter extracted list
  const filteredList = useMemo(() => {
    return extractedList.filter((item) => {
      // Tab filter
      if (activeTab !== "all" && item.status !== activeTab) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMain = item.main_item_name?.toLowerCase().includes(q);
        const matchVariant = item.variant_type?.toLowerCase().includes(q);
        const matchName = item.lens_name?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        const matchNote = item.note?.toLowerCase().includes(q);
        const matchPrice = item.new_price.toString().includes(q);
        return matchMain || matchVariant || matchName || matchBrand || matchNote || matchPrice;
      }

      return true;
    });
  }, [extractedList, activeTab, searchQuery]);

  // Build hierarchical structure for preview
  const hierarchyData = useMemo(() => {
    return buildHierarchicalStructure(filteredList);
  }, [filteredList]);

  // Summary counts
  const stats = useMemo(() => {
    const total = extractedList.length;
    const willUpdate = extractedList.filter((i) => i.status === "will_update").length;
    const noMatch = extractedList.filter((i) => i.status === "no_match").length;
    const unchanged = extractedList.filter((i) => i.status === "unchanged").length;
    const needsReview = extractedList.filter((i) => i.status === "needs_review").length;
    const selectedCount = extractedList.filter((i) => i.selected).length;
    return { total, willUpdate, noMatch, unchanged, needsReview, selectedCount };
  }, [extractedList]);

  const toggleMainItemExpanded = (id: string) => {
    setExpandedMainItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-16 animate-in fade-in duration-500">
        {/* Header section with Optical Identity */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 border border-sky-500/20">
                  <Zap className="h-3.5 w-3.5" />
                  {isAr ? "محرك استيراد الأسعار الذكي 2025" : "Smart Optical Tariff Engine"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isAr ? "100% بدون إنترنت (Offline Safe)" : "100% Offline"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100">
                {isAr
                  ? "استيراد وتحديث قوائم أسعار البصريات"
                  : "Optical Price List Import & Tariff"}
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                {isAr
                  ? "ارفع ملف PDF الخاص بقائمة الأسعار، وسيقوم النظام بتفكيكه تلقائياً وفق الهيكل الهرمي الصارم (الصنف الرئيسي ◄ النوع/الضغط ◄ المقاس والقوة ◄ السعر) مع معاينة فورية وحفظ آمن للتراجع."
                  : "Upload optical price PDF lists with strict hierarchical parsing: Main Item -> Type -> Size -> Price."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleLoadPresetTariff}
                disabled={isProcessing}
                className="border-sky-500/30 bg-sky-950/40 text-sky-300 hover:bg-sky-900/60 hover:text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isAr ? "تسعيرة اتحاد البصريين 2025" : "Load OMAB 2025 Tariff"}
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold hover:opacity-90 shadow-lg shadow-sky-500/20"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                {isAr ? "رفع ملف PDF جديد" : "Upload Price PDF"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </div>

          {/* Progress bar during PDF processing */}
          {isProcessing && (
            <div className="mt-6 space-y-2 rounded-xl bg-slate-900/80 p-4 border border-sky-500/30 animate-pulse">
              <div className="flex justify-between text-xs font-semibold text-sky-300">
                <span>{progressText}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-800" />
            </div>
          )}
        </div>

        {/* Dropzone & Quick Presets */}
        {extractedList.length === 0 && !isProcessing && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-sky-400 bg-sky-500/10 scale-[1.01]"
                : "border-slate-800 bg-slate-900/40 hover:border-sky-500/50 hover:bg-slate-900/70"
            }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-inner mb-4">
              <UploadCloud className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">
              {isAr
                ? "اسحب وأفلت ملف الـ PDF هنا أو انقر للتصفح"
                : "Drag and drop your Price PDF here"}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-4">
              {isAr
                ? "يدعم جميع قوائم أسعار الشركات والموزعين ومصانع العدسات (بالستين أبيض، بلوكت، فوتوجراي، قيادة ليلية، مقاوم للكسر، 1.74، تصنيعات سكوب والنور...)"
                : "Supports all Egyptian and International optical price list formats."}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileCheck2 className="h-4 w-4 text-emerald-400" />
              {isAr ? "استخراج فوري للجداول والأسعار بدون إنترنت" : "Instant Offline Parsing"}
            </div>
          </div>
        )}

        {/* Extracted Data Management Workspace */}
        {extractedList.length > 0 && (
          <div className="space-y-6">
            {/* Top Stat Ribbon & Filter Controls */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div
                onClick={() => setActiveTab("all")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  activeTab === "all"
                    ? "border-sky-500 bg-sky-500/10 shadow-md"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {isAr ? "إجمالي المستخرج" : "Total Extracted"}
                </div>
                <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
                <div className="text-[11px] text-sky-400 mt-1 font-mono">
                  {hierarchyData.length} {isAr ? "صنف رئيسي" : "categories"}
                </div>
              </div>

              <div
                onClick={() => setActiveTab("will_update")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  activeTab === "will_update"
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {isAr ? "تحديث أسعار سابقة" : "Will Update"}
                </div>
                <div className="text-2xl font-bold text-emerald-400">{stats.willUpdate}</div>
                <div className="text-[11px] text-emerald-500 mt-1">
                  {isAr ? "مطابق لصنف حالي" : "Matched"}
                </div>
              </div>

              <div
                onClick={() => setActiveTab("no_match")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  activeTab === "no_match"
                    ? "border-amber-500 bg-amber-500/10 shadow-md"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {isAr ? "أصناف جديدة بالكتالوج" : "New Items"}
                </div>
                <div className="text-2xl font-bold text-amber-400">{stats.noMatch}</div>
                <div className="text-[11px] text-amber-500 mt-1">
                  {isAr ? "سيتم إنشاؤها" : "To Create"}
                </div>
              </div>

              <div
                onClick={() => setActiveTab("needs_review")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  activeTab === "needs_review"
                    ? "border-rose-500 bg-rose-500/10 shadow-md"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {isAr ? "بحاجة لمراجعة" : "Needs Review"}
                </div>
                <div className="text-2xl font-bold text-rose-400">{stats.needsReview}</div>
                <div className="text-[11px] text-rose-500 mt-1">
                  {isAr ? "تغير كبير أو غير مؤكد" : "High diff"}
                </div>
              </div>

              <div
                onClick={() => setActiveTab("unchanged")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  activeTab === "unchanged"
                    ? "border-slate-500 bg-slate-500/10 shadow-md"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {isAr ? "مطابق وبدون تغيير" : "Unchanged"}
                </div>
                <div className="text-2xl font-bold text-slate-400">{stats.unchanged}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {isAr ? "نفس السعر الحالي" : "Same price"}
                </div>
              </div>
            </div>

            {/* Action Bar & Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              {/* Search & View Switcher */}
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={
                      isAr
                        ? "بحث في الأصناف الرئيسية، الأنواع، المقاسات، الأسعار..."
                        : "Search items..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 bg-slate-950 border-slate-700 text-sm"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950 p-1">
                  <button
                    onClick={() => setViewMode("hierarchy")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      viewMode === "hierarchy"
                        ? "bg-sky-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    {isAr ? "الهيكل الهرمي" : "Hierarchy Tree"}
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      viewMode === "table"
                        ? "bg-sky-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    {isAr ? "جدول مفصل" : "Detailed Matrix"}
                  </button>
                </div>
              </div>

              {/* Selection & Apply Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectOnlyChanges}
                  className="border-slate-700 text-xs"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1 text-sky-400" />
                  {isAr ? "تحديد التغييرات فقط" : "Select Changes"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllSelection(true)}
                  className="border-slate-700 text-xs"
                >
                  {isAr ? "تحديد الكل" : "Select All"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllSelection(false)}
                  className="border-slate-700 text-xs"
                >
                  {isAr ? "إلغاء التحديد" : "Deselect"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={stats.selectedCount === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      {isAr
                        ? `اعتماد وتطبيق ${stats.selectedCount} تسعيرة بالكتالوج`
                        : `Apply ${stats.selectedCount} Updates`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {isAr ? "تأكيد اعتماد تحديث الأسعار" : "Confirm Price List Update"}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        {isAr
                          ? `أنت على وشك تحديث ${stats.selectedCount} تسعيرة في قاعدة بيانات المحل. سيتم أخذ نسخة احتياطية فورية تلقائياً قبل التعديل، ويمكنك التراجع في أي وقت بنقرة واحدة من سجل التحديثات.`
                          : `You are about to update ${stats.selectedCount} prices. A snapshot will be saved for instant rollback.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-800 text-slate-300">
                        {isAr ? "إلغاء" : "Cancel"}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleApplyUpdates}
                        className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600"
                      >
                        {isAr ? "نعم، اعتمد التحديث الآن" : "Confirm & Apply"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* VIEW MODE 1: HIERARCHY TREE VIEW */}
            {viewMode === "hierarchy" && (
              <div className="space-y-4">
                {hierarchyData.map((mainItem) => {
                  const isExpanded = expandedMainItems[mainItem.id] ?? false;
                  return (
                    <div
                      key={mainItem.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm transition-all"
                    >
                      {/* Main Item Bar */}
                      <div
                        onClick={() => toggleMainItemExpanded(mainItem.id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-base">
                                {mainItem.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs bg-slate-950 border-slate-700 text-slate-300"
                              >
                                {mainItem.brand}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {mainItem.variants.length} {isAr ? "نوع ومستوى ضغط" : "variants"} ·{" "}
                              {mainItem.totalSizesCount} {isAr ? "مقاس وسعر" : "sizes"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-sky-400" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Types / Variants & Sizes */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 bg-slate-950/70 p-4 space-y-4">
                          {mainItem.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-3"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-sky-300 border-b border-slate-800 pb-2">
                                <span className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                                  {isAr ? "النوع / الضغط:" : "Type / Index:"} {variant.name} (
                                  {variant.index_material})
                                </span>
                                <span className="text-slate-400">
                                  {variant.sizes.length} {isAr ? "مقاسات قوة" : "powers"}
                                </span>
                              </div>

                              {/* Size & Price Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {variant.sizes.map((size) => {
                                  const priceDiff =
                                    size.old_price !== null
                                      ? size.new_price - size.old_price
                                      : null;
                                  return (
                                    <div
                                      key={size.id}
                                      className={`flex items-center justify-between rounded-md border p-3 text-xs transition-all ${
                                        size.selected
                                          ? "border-sky-500/40 bg-sky-950/20"
                                          : "border-slate-800/80 bg-slate-950/40 opacity-70"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={size.selected}
                                          onChange={() => toggleItemSelection(size.id)}
                                          className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer h-4 w-4"
                                        />
                                        <div>
                                          <div className="font-mono font-medium text-slate-200">
                                            SPH {size.sph_min.toFixed(2)} →{" "}
                                            {size.sph_max.toFixed(2)}
                                          </div>
                                          <div className="text-[11px] text-slate-400">
                                            CYL {size.cyl_min.toFixed(2)} →{" "}
                                            {size.cyl_max.toFixed(2)}
                                          </div>
                                          {size.note && (
                                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                              {size.note}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        {editingPriceId === size.id ? (
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              value={editPriceValue}
                                              onChange={(e) => setEditPriceValue(e.target.value)}
                                              className="h-7 w-20 text-xs bg-slate-900 border-sky-500 font-mono"
                                              autoFocus
                                            />
                                            <Button
                                              size="icon"
                                              className="h-7 w-7 bg-emerald-500 text-slate-950"
                                              onClick={() => handleSavePriceEdit(size.id)}
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div
                                            className="group cursor-pointer flex items-center justify-end gap-1"
                                            onClick={() => {
                                              setEditingPriceId(size.id);
                                              setEditPriceValue(size.new_price.toString());
                                            }}
                                          >
                                            <div className="font-bold text-sm text-emerald-400 font-mono">
                                              {formatPrice(size.new_price)}
                                            </div>
                                            <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                                          </div>
                                        )}

                                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                                          {size.old_price !== null ? (
                                            <>
                                              <span className="line-through text-slate-500">
                                                {formatPrice(size.old_price)}
                                              </span>
                                              {priceDiff !== null && priceDiff !== 0 && (
                                                <span
                                                  className={
                                                    priceDiff > 0
                                                      ? "text-emerald-400 font-semibold"
                                                      : "text-amber-400 font-semibold"
                                                  }
                                                >
                                                  {priceDiff > 0 ? `+${priceDiff}` : priceDiff}
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-amber-400 font-semibold">
                                              {isAr ? "صنف جديد" : "New"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: DETAILED MATRIX / TABLE VIEW */}
            {viewMode === "table" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-950/80">
                    <TableRow className="border-slate-800">
                      <TableHead className="w-12 text-center">
                        <input
                          type="checkbox"
                          checked={stats.selectedCount === stats.total && stats.total > 0}
                          onChange={(e) => setAllSelection(e.target.checked)}
                          className="rounded border-slate-700 text-sky-500 cursor-pointer h-4 w-4"
                        />
                      </TableHead>
                      <TableHead>{isAr ? "الصنف الرئيسي" : "Main Item"}</TableHead>
                      <TableHead>{isAr ? "النوع / الضغط" : "Type / Index"}</TableHead>
                      <TableHead>{isAr ? "المقاس (SPH / CYL)" : "Power Range"}</TableHead>
                      <TableHead>{isAr ? "السعر السابق" : "Old Price"}</TableHead>
                      <TableHead>{isAr ? "السعر الجديد" : "New Price"}</TableHead>
                      <TableHead>{isAr ? "فرق السعر" : "Diff"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.map((item) => {
                      const priceDiff =
                        item.current_price !== null ? item.new_price - item.current_price : null;
                      return (
                        <TableRow
                          key={item.id}
                          className="border-slate-800/60 hover:bg-slate-800/40"
                        >
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleItemSelection(item.id)}
                              className="rounded border-slate-700 text-sky-500 cursor-pointer h-4 w-4"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-slate-200">
                            <div>{item.main_item_name}</div>
                            <div className="text-[11px] text-slate-400">{item.brand}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-slate-950 text-sky-300 border-sky-500/30 text-xs"
                            >
                              {item.variant_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-300">
                            <div>
                              SPH: {item.sph_min.toFixed(2)} → {item.sph_max.toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              CYL: {item.cyl_min.toFixed(2)} → {item.cyl_max.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-400">
                            {item.current_price !== null ? formatPrice(item.current_price) : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-emerald-400">
                            {editingPriceId === item.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={editPriceValue}
                                  onChange={(e) => setEditPriceValue(e.target.value)}
                                  className="h-7 w-20 text-xs bg-slate-900 border-sky-500 font-mono"
                                  autoFocus
                                />
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-emerald-500 text-slate-950"
                                  onClick={() => handleSavePriceEdit(item.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="group cursor-pointer flex items-center gap-1"
                                onClick={() => {
                                  setEditingPriceId(item.id);
                                  setEditPriceValue(item.new_price.toString());
                                }}
                              >
                                <span>{formatPrice(item.new_price)}</span>
                                <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {priceDiff !== null && priceDiff !== 0 ? (
                              <span
                                className={
                                  priceDiff > 0
                                    ? "text-emerald-400 font-bold"
                                    : "text-amber-400 font-bold"
                                }
                              >
                                {priceDiff > 0 ? `+${priceDiff}` : priceDiff} ج.م
                              </span>
                            ) : priceDiff === 0 ? (
                              <span className="text-slate-500">{isAr ? "بدون تغيير" : "0"}</span>
                            ) : (
                              <span className="text-amber-400">{isAr ? "جديد" : "New"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.status === "will_update" && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                {isAr ? "تحديث سعر" : "Will Update"}
                              </Badge>
                            )}
                            {item.status === "no_match" && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                {isAr ? "صنف جديد" : "New Item"}
                              </Badge>
                            )}
                            {item.status === "needs_review" && (
                              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs">
                                {isAr ? "مراجعة" : "Review"}
                              </Badge>
                            )}
                            {item.status === "unchanged" && (
                              <Badge className="bg-slate-500/20 text-slate-400 border-slate-600/30 text-xs">
                                {isAr ? "مطابق" : "Unchanged"}
                              </Badge>
                            )}
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

        {/* Section 2: Price Update History & 1-Click Rollback Audit */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                {isAr
                  ? "سجل تحديثات الأسعار وإمكانية التراجع (Rollback History)"
                  : "Price Update History & Rollback"}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "جميع عمليات التحديث يتم توثيقها مع لقطة Snapshot كاملة لقاعدة البيانات، مما يسمح بالتراجع بنقرة واحدة."
                  : "All price updates are snapshot-backed for instant rollback."}
              </p>
            </div>
          </div>

          {(db.price_updates || []).length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-400 text-sm">
              <Info className="h-6 w-6 mx-auto mb-2 text-slate-500" />
              {isAr
                ? "لا توجد تحديثات أسعار سابقة مسجلة حتى الآن."
                : "No past price update logs recorded yet."}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-slate-800">
                    <TableHead>{isAr ? "التاريخ والوقت" : "Date & Time"}</TableHead>
                    <TableHead>{isAr ? "اسم الملف / المصدر" : "Filename / Source"}</TableHead>
                    <TableHead>{isAr ? "المنفذ" : "User"}</TableHead>
                    <TableHead>{isAr ? "المستخرج" : "Total"}</TableHead>
                    <TableHead>{isAr ? "تم تعديلها" : "Updated"}</TableHead>
                    <TableHead>{isAr ? "أصناف جديدة" : "Created"}</TableHead>
                    <TableHead className="text-left">
                      {isAr ? "إجراء التراجع" : "Rollback Action"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(db.price_updates || []).map((log) => (
                    <TableRow key={log.id} className="border-slate-800/60 hover:bg-slate-800/40">
                      <TableCell className="font-mono text-xs text-slate-300">
                        {new Date(log.timestamp).toLocaleString(isAr ? "ar-EG" : "en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-sky-400" />
                          <span>{log.filename}</span>
                        </div>
                        {log.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {log.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">{log.user}</TableCell>
                      <TableCell className="font-mono text-xs">{log.total_extracted}</TableCell>
                      <TableCell className="font-mono text-xs text-emerald-400 font-semibold">
                        {log.updated_count}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-amber-400 font-semibold">
                        {log.unmatched_count}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs"
                              >
                                <Undo2 className="h-3.5 w-3.5 mr-1" />
                                {isAr ? "تراجع عن التحديث" : "Rollback"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-950 border-slate-800 text-slate-100">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isAr
                                    ? "هل أنت متأكد من التراجع عن هذا التحديث؟"
                                    : "Confirm Rollback?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  {isAr
                                    ? `سيتم استرجاع جميع الأسعار وحالة الكتالوج تماماً كما كانت قبل استيراد ملف (${log.filename}).`
                                    : `All prices will be restored to the state before importing ${log.filename}.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-slate-800 text-slate-300">
                                  {isAr ? "إلغاء" : "Cancel"}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const success = rollbackPriceUpdate(log.id);
                                    if (success) {
                                      toast.success(
                                        isAr
                                          ? "تم التراجع عن تحديث الأسعار بنجاح واستعادة الحالة السابقة."
                                          : "Rollback successful.",
                                      );
                                    } else {
                                      toast.error(
                                        isAr ? "تعذر التراجع عن التحديث" : "Rollback failed",
                                      );
                                    }
                                  }}
                                  className="bg-rose-600 text-white font-bold hover:bg-rose-700"
                                >
                                  {isAr ? "تأكيد التراجع" : "Confirm Rollback"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              deletePriceUpdateLog(log.id);
                              toast.info(isAr ? "تم حذف السجل" : "Log deleted");
                            }}
                            className="h-8 w-8 text-slate-500 hover:text-slate-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
