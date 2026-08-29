import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Circle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Layers,
  Sparkles,
  Tag,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  PlusCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { MainTypeDefinition } from "@/lib/types";

export const Route = createFileRoute("/lens-types")({
  head: () => ({
    meta: [
      { title: "إدارة أنواع العدسات (MAIN & SECOND TYPES) — كتالوج البصريات" },
      {
        name: "description",
        content:
          "إدارة الأنواع الرئيسية والفرعية للعدسات وإمكانية إضافة وتعديل أي Main Type أو Second Type مع التحديث التلقائي للكتالوج.",
      },
      {
        property: "og:title",
        content: "إدارة أنواع العدسات (MAIN & SECOND TYPES) — Optical Store Pro",
      },
    ],
  }),
  component: LensTypesManagementPage,
});

function LensTypesManagementPage() {
  const {
    db,
    language,
    saveMainType,
    deleteMainType,
    addSecondType,
    updateSecondType,
    deleteSecondType,
    saveLensType,
    deleteLensType,
  } = useApp();

  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"main-second" | "coatings">("main-second");
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Main Type Modal State
  const [isMainTypeModalOpen, setIsMainTypeModalOpen] = useState(false);
  const [editingMainType, setEditingMainType] = useState<MainTypeDefinition | null>(null);
  const [mainTypeName, setMainTypeName] = useState("");
  const [mainTypeDesc, setMainTypeDesc] = useState("");
  const [newSecondTypeTag, setNewSecondTypeTag] = useState("");
  const [modalSecondTypes, setModalSecondTypes] = useState<string[]>([]);
  const [mainTypeError, setMainTypeError] = useState<string | null>(null);

  // Edit Second Type Modal State
  const [isSecondTypeModalOpen, setIsSecondTypeModalOpen] = useState(false);
  const [activeParentMainType, setActiveParentMainType] = useState<MainTypeDefinition | null>(null);
  const [editingSecondOldName, setEditingSecondOldName] = useState("");
  const [editingSecondNewName, setEditingSecondNewName] = useState("");
  const [secondTypeError, setSecondTypeError] = useState<string | null>(null);

  // Inline Quick Add Second Type State per Main Type (id -> string)
  const [inlineSecondInputs, setInlineSecondInputs] = useState<Record<string, string>>({});

  // Coating / Basic Lens Type Form State
  const [coatingEditId, setCoatingEditId] = useState("");
  const [coatingName, setCoatingName] = useState("");
  const [coatingDesc, setCoatingDesc] = useState("");
  const [coatingError, setCoatingError] = useState<string | null>(null);

  // Main Types List
  const mainTypesList = db.main_types ?? [];
  const filteredMainTypes = mainTypesList.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      m.second_types.some((s) => s.toLowerCase().includes(q))
    );
  });

  // Open Main Type Modal for Create
  const handleOpenAddMainType = () => {
    setEditingMainType(null);
    setMainTypeName("");
    setMainTypeDesc("");
    setNewSecondTypeTag("");
    setModalSecondTypes([]);
    setMainTypeError(null);
    setIsMainTypeModalOpen(true);
  };

  // Open Main Type Modal for Edit
  const handleOpenEditMainType = (m: MainTypeDefinition) => {
    setEditingMainType(m);
    setMainTypeName(m.name);
    setMainTypeDesc(m.description || "");
    setNewSecondTypeTag("");
    setModalSecondTypes([...m.second_types]);
    setMainTypeError(null);
    setIsMainTypeModalOpen(true);
  };

  // Add tag in Main Type modal
  const handleAddTagInModal = () => {
    const trimmed = newSecondTypeTag.trim();
    if (!trimmed) return;
    if (modalSecondTypes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(isAr ? "النوع الفرعي موجود بالفعل في القائمة" : "Second type already exists");
      return;
    }
    setModalSecondTypes([...modalSecondTypes, trimmed]);
    setNewSecondTypeTag("");
  };

  const handleRemoveTagInModal = (indexToRemove: number) => {
    setModalSecondTypes(modalSecondTypes.filter((_, i) => i !== indexToRemove));
  };

  // Save Main Type (Create or Edit)
  const handleSaveMainTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMainTypeError(null);

    const oldName = editingMainType ? editingMainType.name : undefined;
    const err = saveMainType(
      {
        id: editingMainType?.id,
        name: mainTypeName,
        description: mainTypeDesc,
        second_types: modalSecondTypes,
      },
      oldName,
    );

    if (err) {
      setMainTypeError(err);
      return;
    }

    toast.success(
      editingMainType
        ? isAr
          ? "تم تحديث النوع الرئيسي وتحديث الأصناف المرتبطة بنجاح"
          : "Main lens type and linked items updated successfully"
        : isAr
          ? "تمت إضافة النوع الرئيسي بنجاح"
          : "Main lens type added successfully",
    );

    setIsMainTypeModalOpen(false);
  };

  // Delete Main Type
  const handleDeleteMainType = (id: string) => {
    const err = deleteMainType(id);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(isAr ? "تم حذف النوع الرئيسي بنجاح" : "Main lens type deleted");
  };

  // Inline Quick Add Second Type
  const handleInlineAddSecond = (mainTypeId: string) => {
    const text = (inlineSecondInputs[mainTypeId] || "").trim();
    if (!text) return;
    const err = addSecondType(mainTypeId, text);
    if (err) {
      toast.error(err);
      return;
    }
    setInlineSecondInputs((prev) => ({ ...prev, [mainTypeId]: "" }));
    toast.success(
      isAr ? `تمت إضافة النوع الفرعي "${text}" بنجاح` : `Second type "${text}" added successfully`,
    );
  };

  // Open Edit Second Type Modal
  const handleOpenEditSecondType = (mainType: MainTypeDefinition, secondName: string) => {
    setActiveParentMainType(mainType);
    setEditingSecondOldName(secondName);
    setEditingSecondNewName(secondName);
    setSecondTypeError(null);
    setIsSecondTypeModalOpen(true);
  };

  // Save Edit Second Type
  const handleSaveSecondTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParentMainType) return;
    setSecondTypeError(null);

    const err = updateSecondType(
      activeParentMainType.id,
      editingSecondOldName,
      editingSecondNewName,
    );
    if (err) {
      setSecondTypeError(err);
      return;
    }

    toast.success(
      isAr
        ? `تم تحديث النوع الفرعي إلى "${editingSecondNewName}" وتحديث الأصناف والأسعار بالكتالوج بنجاح`
        : `Second type updated to "${editingSecondNewName}" and catalog synchronized`,
    );
    setIsSecondTypeModalOpen(false);
  };

  // Delete Second Type
  const handleDeleteSecondType = (mainTypeId: string, secondName: string) => {
    const err = deleteSecondType(mainTypeId, secondName);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(
      isAr ? `تم حذف النوع الفرعي "${secondName}"` : `Second type "${secondName}" deleted`,
    );
  };

  // Basic Coating Lens Type Save
  const handleSaveCoating = (e: React.FormEvent) => {
    e.preventDefault();
    setCoatingError(null);
    const existing = db.lens_types.find((l) => l.id === coatingEditId);
    const err = saveLensType({
      id: coatingEditId,
      name: coatingName,
      description: coatingDesc,
      created_at: existing?.created_at,
    });
    if (err) {
      setCoatingError(err);
      return;
    }
    toast.success(
      coatingEditId
        ? isAr
          ? "تم تحديث نوع الطلاء/المعالجة"
          : "Lens coating updated"
        : isAr
          ? "تمت إضافة نوع الطلاء/المعالجة"
          : "Lens coating added",
    );
    setCoatingEditId("");
    setCoatingName("");
    setCoatingDesc("");
  };

  return (
    <AppShell
      title={isAr ? "إدارة أنواع العدسات (MAIN & SECOND TYPES)" : "Lens Types Management"}
      description={
        isAr
          ? "التحكم الكامل بالأنواع الرئيسية (MAIN TYPE) والأنواع الفرعية (SECOND TYPE) وإضافة وتعديل أي نوع فوري."
          : "Full control over hierarchical MAIN and SECOND lens types with instant catalog synchronization."
      }
    >
      <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Top Feature Banner */}
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  <FolderTree className="h-4 w-4" />
                </span>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {isAr
                    ? "شجرة أنواع العدسات (MAIN TYPE & SECOND TYPE)"
                    : "Lens Types Hierarchy (MAIN & SECOND)"}
                </h1>
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs">
                  {mainTypesList.length} {isAr ? "أنواع رئيسية" : "Main Types"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {isAr
                  ? "تتيح لك هذه الصفحة إضافة أي نوع رئيسي جديد (مثل بلاستيك أبيض 65M، بلوكت، فوتوجراي) أو تعديل اسمه، مع إدارة كافة الأنواع الفرعية (1.56 ستوك، 1.60 داجاس كوري، إلخ) مع التحديث الفوري للأسعار والكتالوج."
                  : "Create and rename Main Types and Second Types. Changes automatically update all matching products and power sizes across the entire catalog."}
              </p>
            </div>

            <Button
              onClick={handleOpenAddMainType}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{isAr ? "إضافة نوع رئيسي جديد (MAIN TYPE)" : "Add Main Lens Type"}</span>
            </Button>
          </div>
        </div>

        {/* Tabs for Main & Second vs Coatings */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "main-second" | "coatings")}
          className="space-y-6"
        >
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger
              value="main-second"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 rounded-lg flex items-center gap-2 justify-center"
            >
              <Layers className="h-4 w-4" />
              <span>
                {isAr ? "الأنواع الرئيسية والفرعية (MAIN & SECOND)" : "MAIN & SECOND Types"}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="coatings"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white font-bold text-xs sm:text-sm py-2.5 rounded-lg flex items-center gap-2 justify-center"
            >
              <Circle className="h-4 w-4" />
              <span>{isAr ? "تصنيفات الطلاء والمعالجة (Coatings)" : "Lens Coating Types"}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MAIN & SECOND TYPES */}
          <TabsContent value="main-second" className="space-y-6 m-0">
            {/* Search Bar & Quick Stats */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? "بحث بالنوع الرئيسي أو النوع الفرعي (مثال: 65M, بلوكت, 1.56, كوداك)..."
                      : "Search by main or second type..."
                  }
                  className="bg-slate-900/90 border-slate-800 pr-10 h-11 text-sm rounded-xl text-white placeholder:text-slate-500 focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 font-medium">
                {isAr
                  ? `عرض ${filteredMainTypes.length} من أصل ${mainTypesList.length} نوع رئيسي`
                  : `Showing ${filteredMainTypes.length} of ${mainTypesList.length} main types`}
              </div>
            </div>

            {/* Cards Grid of Main Types */}
            {filteredMainTypes.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                  <Layers className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {searchQuery
                      ? isAr
                        ? "لم يتم العثور على نتائج بحث مطابقة"
                        : "No matching types found"
                      : isAr
                        ? "لا توجد أنواع رئيسية مسجلة"
                        : "No main lens types registered"}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery
                      ? isAr
                        ? "جرب البحث بكلمات أخرى أو أضف نوعاً جديداً."
                        : "Try a different search term or add a new type."
                      : isAr
                        ? "انقر على زر إضافة نوع رئيسي جديد لإدخال أول نوع."
                        : "Click the button above to add your first main type."}
                  </p>
                </div>
                <Button
                  onClick={handleOpenAddMainType}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold h-9 text-xs rounded-xl"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  {isAr ? "إضافة نوع رئيسي الآن" : "Add Main Type Now"}
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredMainTypes.map((mainType) => {
                  const itemsCount = db.items.filter((it) => it.main_type === mainType.name).length;
                  const sizesCount = db.sizes.filter((sz) => sz.main_type === mainType.name).length;
                  const inlineValue = inlineSecondInputs[mainType.id] || "";

                  return (
                    <div
                      key={mainType.id}
                      className="rounded-2xl border-2 border-slate-800 hover:border-sky-500/50 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Card Header: Main Type Title + Action buttons */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                <Tag className="h-3.5 w-3.5" />
                              </span>
                              <h2 className="text-base font-extrabold text-white tracking-tight">
                                {mainType.name}
                              </h2>
                            </div>
                            {mainType.description && (
                              <p className="text-xs text-slate-400 leading-relaxed pr-9">
                                {mainType.description}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditMainType(mainType)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg"
                              title={isAr ? "تعديل النوع الرئيسي" : "Edit Main Type"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                  title={isAr ? "حذف النوع الرئيسي" : "Delete Main Type"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                dir={isAr ? "rtl" : "ltr"}
                                className="bg-slate-900 border-slate-800 text-white"
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {isAr
                                      ? `تأكيد حذف "${mainType.name}"؟`
                                      : `Delete "${mainType.name}"?`}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400 text-xs">
                                    {isAr
                                      ? "سيتم حذف هذا النوع الرئيسي وقائمته الفرعية من النظام. يرجى التأكد من عدم استخدامه في أصناف مسجلة بالكتالوج."
                                      : "This will remove this main lens type and its second types. Make sure it is not in use by catalog items."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                    {isAr ? "إلغاء" : "Cancel"}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMainType(mainType.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white"
                                  >
                                    {isAr ? "حذف نهائي" : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {/* Usage Counts Badges */}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/25 text-[11px] font-semibold">
                            {mainType.second_types.length}{" "}
                            {isAr ? "أنواع فرعية (SECOND)" : "Sub-types"}
                          </Badge>
                          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/25 text-[11px] font-semibold">
                            {itemsCount} {isAr ? "صنف بالكتالوج" : "Items"}
                          </Badge>
                          {sizesCount > 0 && (
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/25 text-[11px] font-semibold">
                              {sizesCount} {isAr ? "نطاق مقاسات" : "Price Sizes"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Second Types Section */}
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <FolderTree className="h-3.5 w-3.5 text-emerald-400" />
                            <span>
                              {isAr ? "الأنواع الفرعية التابعة (SECOND TYPES):" : "Second Types:"}
                            </span>
                          </span>
                        </div>

                        {/* Sub-types list */}
                        {mainType.second_types.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">
                            {isAr
                              ? "لا توجد أنواع فرعية مضافة بعد. أضف النوع الأول بالأسفل:"
                              : "No second types yet. Add one below:"}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {mainType.second_types.map((st) => {
                              const subItemCount = db.items.filter(
                                (it) => it.main_type === mainType.name && it.second_type === st,
                              ).length;

                              return (
                                <div
                                  key={st}
                                  className="group flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs text-white transition-all hover:border-emerald-500/50"
                                >
                                  <span className="font-semibold">{st}</span>
                                  {subItemCount > 0 && (
                                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-bold">
                                      {subItemCount}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSecondType(mainType, st)}
                                    className="text-slate-400 hover:text-sky-400 ml-1 p-0.5"
                                    title={isAr ? "تعديل اسم النوع الفرعي" : "Edit second type"}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSecondType(mainType.id, st)}
                                    className="text-slate-400 hover:text-rose-400 p-0.5"
                                    title={isAr ? "حذف النوع الفرعي" : "Delete second type"}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Quick Inline Adder for Second Type */}
                        <div className="flex gap-2 pt-2 border-t border-slate-800/60">
                          <Input
                            value={inlineValue}
                            onChange={(e) =>
                              setInlineSecondInputs((prev) => ({
                                ...prev,
                                [mainType.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleInlineAddSecond(mainType.id);
                              }
                            }}
                            placeholder={
                              isAr
                                ? "إضافة نوع فرعي جديد (مثل: 1.56 بلس، 1.60 داجاس)..."
                                : "Add new second type (e.g. 1.56 stock)..."
                            }
                            className="bg-slate-900 border-slate-800 h-9 text-xs text-white placeholder:text-slate-500 rounded-lg focus:border-emerald-500"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleInlineAddSecond(mainType.id)}
                            disabled={!inlineValue.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-3 text-xs rounded-lg shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5 ml-1" />
                            {isAr ? "إضافة" : "Add"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: LENS COATINGS & FINISH TYPES */}
          <TabsContent value="coatings" className="space-y-6 m-0">
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              {/* Form Card */}
              <form
                onSubmit={handleSaveCoating}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl h-fit"
              >
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                    <Circle className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-bold text-white">
                    {coatingEditId
                      ? isAr
                        ? "تعديل نوع الطلاء"
                        : "Edit Coating Type"
                      : isAr
                        ? "إضافة نوع طلاء / معالجة جديد"
                        : "Add Coating Type"}
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cname" className="text-xs font-semibold text-slate-300">
                    {isAr ? "اسم نوع الطلاء *" : "Coating Name *"}
                  </Label>
                  <Input
                    id="cname"
                    value={coatingName}
                    onChange={(e) => setCoatingName(e.target.value)}
                    placeholder={
                      isAr
                        ? "أبيض (White), بلوكت (Blue Cut), فوتوجراي..."
                        : "White, Blue Cut, Photochromic…"
                    }
                    className="bg-slate-950 border-slate-800 h-10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cdesc" className="text-xs font-semibold text-slate-300">
                    {isAr ? "الوصف والملاحظات" : "Description"}
                  </Label>
                  <Textarea
                    id="cdesc"
                    rows={3}
                    value={coatingDesc}
                    onChange={(e) => setCoatingDesc(e.target.value)}
                    placeholder={
                      isAr
                        ? "ملاحظات إضافية حول نوع الطلاء أو الحماية..."
                        : "Additional notes about the coating..."
                    }
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>

                {coatingError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                    {coatingError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold h-10 text-xs rounded-xl"
                  >
                    {coatingEditId
                      ? isAr
                        ? "تحديث النوع"
                        : "Update"
                      : isAr
                        ? "إضافة النوع"
                        : "Save"}
                  </Button>
                  {coatingEditId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCoatingEditId("");
                        setCoatingName("");
                        setCoatingDesc("");
                      }}
                      className="border-slate-800 text-slate-300 hover:bg-slate-800 h-10 text-xs rounded-xl"
                    >
                      {isAr ? "إلغاء" : "Cancel"}
                    </Button>
                  )}
                </div>
              </form>

              {/* Coating Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? "قائمة أنواع الطلاء المسجلة" : "Registered Lens Coatings"}
                  </h3>
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                    {db.lens_types.length} {isAr ? "نوع" : "types"}
                  </Badge>
                </div>

                <div className="divide-y divide-slate-800">
                  {db.lens_types.map((lt) => {
                    const count = db.items.filter((i) => i.lens_type_id === lt.id).length;
                    return (
                      <div
                        key={lt.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-sky-400" />
                            <span className="font-bold text-sm text-white">{lt.name}</span>
                            <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px]">
                              {count} {isAr ? "صنف" : "items"}
                            </Badge>
                          </div>
                          {lt.description && (
                            <p className="text-xs text-slate-400 pr-4">{lt.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCoatingEditId(lt.id);
                              setCoatingName(lt.name);
                              setCoatingDesc(lt.description || "");
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              dir={isAr ? "rtl" : "ltr"}
                              className="bg-slate-900 border-slate-800 text-white"
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {isAr ? `تأكيد حذف "${lt.name}"؟` : `Delete "${lt.name}"?`}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400 text-xs">
                                  {isAr
                                    ? "سيتم حذف هذا النوع من النظام. تأكد من عدم استخدامه في أصناف مسجلة."
                                    : "This will remove this lens coating from the system."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                  {isAr ? "إلغاء" : "Cancel"}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    const err = deleteLensType(lt.id);
                                    if (err) toast.error(err);
                                    else
                                      toast.success(
                                        isAr ? "تم الحذف بنجاح" : "Deleted successfully",
                                      );
                                  }}
                                  className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  {isAr ? "حذف نهائي" : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG: CREATE / EDIT MAIN TYPE */}
      <Dialog open={isMainTypeModalOpen} onOpenChange={setIsMainTypeModalOpen}>
        <DialogContent
          dir={isAr ? "rtl" : "ltr"}
          className="bg-slate-900 border-slate-800 text-white max-w-lg"
        >
          <form onSubmit={handleSaveMainTypeSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-sky-400" />
                {editingMainType
                  ? isAr
                    ? `تعديل النوع الرئيسي (${editingMainType.name})`
                    : `Edit Main Lens Type (${editingMainType.name})`
                  : isAr
                    ? "إضافة نوع رئيسي جديد (MAIN TYPE)"
                    : "Add New Main Lens Type"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {editingMainType
                  ? isAr
                    ? "تنبيه: تغيير اسم النوع الرئيسي سيقوم بتحديث جميع الأصناف ونطاقات الأسعار التابعة له في الكتالوج تلقائياً."
                    : "Note: Renaming this main type will automatically cascade to all linked products in the catalog."
                  : isAr
                    ? "أدخل اسم النوع الرئيسي وأضف الأنواع الفرعية التابعة له لتسهيل البحث والتسعير."
                    : "Enter the main lens type name and define its second types for easy filtering."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="mname" className="text-xs font-semibold text-slate-300">
                  {isAr ? "اسم النوع الرئيسي (MAIN TYPE) *" : "Main Lens Type Name *"}
                </Label>
                <Input
                  id="mname"
                  value={mainTypeName}
                  onChange={(e) => setMainTypeName(e.target.value)}
                  placeholder={
                    isAr
                      ? "مثل: بلاستيك أبيض 65M، بلوكت، فوتوجراي بالستين، بيفوتال..."
                      : "e.g. White Plastic 65M, Blue-Cut, Kodak..."
                  }
                  className="bg-slate-950 border-slate-800 h-10 text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mdesc" className="text-xs font-semibold text-slate-300">
                  {isAr ? "الوصف والمواصفات" : "Description"}
                </Label>
                <Textarea
                  id="mdesc"
                  rows={2}
                  value={mainTypeDesc}
                  onChange={(e) => setMainTypeDesc(e.target.value)}
                  placeholder={
                    isAr
                      ? "ملاحظات حول المادة، الشركة، أو الاستخدام..."
                      : "Notes on material, brand, or usage..."
                  }
                  className="bg-slate-950 border-slate-800 text-xs text-white"
                />
              </div>

              {/* Second Types Tags inside Modal */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <Label className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>{isAr ? "الأنواع الفرعية التابعة (SECOND TYPES):" : "Second Types:"}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {modalSecondTypes.length} {isAr ? "مضاف" : "added"}
                  </span>
                </Label>

                <div className="flex gap-2">
                  <Input
                    value={newSecondTypeTag}
                    onChange={(e) => setNewSecondTypeTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTagInModal();
                      }
                    }}
                    placeholder={
                      isAr
                        ? "أدخل نوعاً فرعياً (مثل: 1.56 ستوك، 1.60 داجاس)..."
                        : "Enter a second type (e.g. 1.56 stock)..."
                    }
                    className="bg-slate-950 border-slate-800 h-9 text-xs text-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTagInModal}
                    disabled={!newSecondTypeTag.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-3 text-xs shrink-0 rounded-lg"
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" />
                    {isAr ? "إضافة" : "Add"}
                  </Button>
                </div>

                {modalSecondTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {modalSecondTypes.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTagInModal(idx)}
                          className="text-emerald-400 hover:text-rose-400 ml-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {mainTypeError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {mainTypeError}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMainTypeModalOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl"
              >
                {editingMainType
                  ? isAr
                    ? "حفظ التعديلات والتحديث"
                    : "Save Changes"
                  : isAr
                    ? "حفظ النوع الرئيسي"
                    : "Save Main Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDIT SECOND TYPE NAME (CASCADE TO CATALOG) */}
      <Dialog open={isSecondTypeModalOpen} onOpenChange={setIsSecondTypeModalOpen}>
        <DialogContent
          dir={isAr ? "rtl" : "ltr"}
          className="bg-slate-900 border-slate-800 text-white max-w-md"
        >
          <form onSubmit={handleSaveSecondTypeSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Pencil className="h-4 w-4 text-emerald-400" />
                {isAr ? "تعديل اسم النوع الفرعي (SECOND TYPE)" : "Edit Second Type Name"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {isAr
                  ? `النوع الرئيسي التابع له: ${activeParentMainType?.name}. سيتم تحديث هذا الاسم في جميع مقاسات وأصناف الكتالوج المرتبطة فوراً.`
                  : `Parent Main Type: ${activeParentMainType?.name}. Renaming will automatically update all matching catalog items.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="stname" className="text-xs font-semibold text-slate-300">
                  {isAr ? "اسم النوع الفرعي الجديد *" : "New Second Type Name *"}
                </Label>
                <Input
                  id="stname"
                  value={editingSecondNewName}
                  onChange={(e) => setEditingSecondNewName(e.target.value)}
                  placeholder="مثل: 1.56 ستوك، 1.60 داجاس كوري..."
                  className="bg-slate-950 border-slate-800 h-10 text-xs text-white"
                  required
                />
              </div>
            </div>

            {secondTypeError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {secondTypeError}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSecondTypeModalOpen(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {isAr ? "تحديث وتطبيق التغيير" : "Update & Apply"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
