import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hashPassword, loadDb, saveDb, seed, uid } from "./db";
import type { Language } from "./i18n";
import type {
  AppSettings,
  CustomerCategory,
  Database,
  ExtractedPriceItem,
  FrameType,
  Item,
  ItemSize,
  LensType,
  MainTypeDefinition,
  SaleInvoice,
  Supplier,
  User,
} from "./types";

// The session is intentionally kept in memory only: closing or reloading the
// app always requires signing in again.

interface AppContextValue {
  db: Database;
  ready: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currentUser: string | null;
  login: (u: string, p: string) => string | null;
  logout: () => void;
  // users
  addUser: (username: string, password: string) => string | null;
  updateUser: (id: string, username: string, password?: string) => string | null;
  deleteUser: (id: string) => string | null;
  // suppliers
  saveSupplier: (
    s: Omit<Supplier, "created_at"> & { created_at?: string | undefined },
  ) => string | null;
  deleteSupplier: (id: string) => string | null;
  // categories
  saveCategory: (
    c: Omit<CustomerCategory, "created_at"> & { created_at?: string | undefined },
  ) => string | null;
  deleteCategory: (id: string) => string | null;
  // lens types
  saveLensType: (
    l: Omit<LensType, "created_at"> & { created_at?: string | undefined },
  ) => string | null;
  deleteLensType: (id: string) => string | null;
  // main & second lens types (الأنواع الرئيسية والفرعية)
  saveMainType: (
    m: { id?: string; name: string; description?: string; second_types?: string[] },
    oldName?: string,
  ) => string | null;
  deleteMainType: (id: string) => string | null;
  addSecondType: (mainTypeId: string, secondTypeName: string) => string | null;
  updateSecondType: (
    mainTypeId: string,
    oldSecondName: string,
    newSecondName: string,
  ) => string | null;
  deleteSecondType: (mainTypeId: string, secondTypeName: string) => string | null;
  // frame types
  saveFrameType: (
    f: Omit<FrameType, "created_at"> & { created_at?: string | undefined },
  ) => string | null;
  deleteFrameType: (id: string) => string | null;
  // items
  saveItem: (
    item: Omit<Item, "created_at" | "updated_at"> & { created_at?: string | undefined },
    sizes: Array<Omit<ItemSize, "item_id">>,
  ) => string | null;
  deleteItem: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  // price updates
  applyPriceUpdate: (params: {
    filename: string;
    itemsToUpdate: ExtractedPriceItem[];
    createNewItems?: boolean;
    notes?: string;
  }) => { updatedCount: number; createdCount: number };
  rollbackPriceUpdate: (updateLogId: string) => boolean;
  deletePriceUpdateLog: (updateLogId: string) => void;
  // sales & invoices
  saveInvoice: (invoice: Omit<SaleInvoice, "created_at"> & { created_at?: string }) => string;
  deleteInvoice: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => seed());
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setDb(loadDb());
    setReady(true);
  }, []);

  const commit = useCallback((next: Database) => {
    setDb(next);
    saveDb(next);
  }, []);

  const currentLanguage: Language = db.settings.language || "ar";

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle("dark", db.settings.theme === "dark");
    root.dir = currentLanguage === "ar" ? "rtl" : "ltr";
    root.lang = currentLanguage;
  }, [db.settings.theme, currentLanguage, ready]);

  const value = useMemo<AppContextValue>(() => {
    const setLanguage = (lang: Language) => {
      commit({ ...db, settings: { ...db.settings, language: lang } });
    };

    const toggleLanguage = () => {
      const nextLang = currentLanguage === "ar" ? "en" : "ar";
      setLanguage(nextLang);
    };

    const login = (username: string, password: string) => {
      const u = db.users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
      if (!u) return "Username not found.";
      if (u.password_hash !== hashPassword(password)) return "Incorrect password.";
      setCurrentUser(u.username);
      return null;
    };

    const logout = () => {
      setCurrentUser(null);
    };

    const addUser = (username: string, password: string) => {
      if (!username.trim()) return "Username is required.";
      if (!password) return "Password cannot be empty.";
      if (db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase()))
        return "Username already exists.";
      const user: User = {
        id: uid(),
        username: username.trim(),
        password_hash: hashPassword(password),
        created_at: new Date().toISOString(),
      };
      commit({ ...db, users: [...db.users, user] });
      return null;
    };

    const updateUser = (id: string, username: string, password?: string) => {
      if (!username.trim()) return "Username is required.";
      if (
        db.users.some(
          (u) => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase(),
        )
      )
        return "Username already exists.";
      commit({
        ...db,
        users: db.users.map((u) =>
          u.id === id
            ? {
                ...u,
                username: username.trim(),
                password_hash: password ? hashPassword(password) : u.password_hash,
              }
            : u,
        ),
      });
      return null;
    };

    const deleteUser = (id: string) => {
      if (db.users.length <= 1) return "At least one user must remain.";
      const target = db.users.find((u) => u.id === id);
      if (target && target.username === currentUser) return "You cannot delete the logged-in user.";
      commit({ ...db, users: db.users.filter((u) => u.id !== id) });
      return null;
    };

    const saveSupplier: AppContextValue["saveSupplier"] = (s) => {
      if (!s.name.trim()) return "Company name is required.";
      if (
        db.suppliers.some(
          (x) => x.id !== s.id && x.name.toLowerCase() === s.name.trim().toLowerCase(),
        )
      )
        return "A company with this name already exists.";
      const exists = db.suppliers.some((x) => x.id === s.id);
      const record: Supplier = {
        id: s.id || uid(),
        name: s.name.trim(),
        phone: s.phone,
        notes: s.notes,
        created_at: s.created_at ?? new Date().toISOString(),
      };
      commit({
        ...db,
        suppliers: exists
          ? db.suppliers.map((x) => (x.id === record.id ? record : x))
          : [...db.suppliers, record],
      });
      return null;
    };

    const deleteSupplier = (id: string) => {
      if (db.items.some((i) => i.supplier_id === id))
        return "This company is used by existing items.";
      commit({ ...db, suppliers: db.suppliers.filter((s) => s.id !== id) });
      return null;
    };

    const saveCategory: AppContextValue["saveCategory"] = (c) => {
      if (!c.name.trim()) return "Category name is required.";
      if (
        db.categories.some(
          (x) => x.id !== c.id && x.name.toLowerCase() === c.name.trim().toLowerCase(),
        )
      )
        return "A category with this name already exists.";
      const exists = db.categories.some((x) => x.id === c.id);
      const record: CustomerCategory = {
        id: c.id || uid(),
        name: c.name.trim(),
        description: c.description,
        created_at: c.created_at ?? new Date().toISOString(),
      };
      commit({
        ...db,
        categories: exists
          ? db.categories.map((x) => (x.id === record.id ? record : x))
          : [...db.categories, record],
      });
      return null;
    };

    const deleteCategory = (id: string) => {
      if (db.items.some((i) => i.customer_category_id === id))
        return "This category is used by existing items.";
      commit({ ...db, categories: db.categories.filter((c) => c.id !== id) });
      return null;
    };

    const saveLensType: AppContextValue["saveLensType"] = (l) => {
      if (!l.name.trim()) return "Lens type name is required.";
      if (
        db.lens_types.some(
          (x) => x.id !== l.id && x.name.toLowerCase() === l.name.trim().toLowerCase(),
        )
      )
        return "A lens type with this name already exists.";
      const exists = db.lens_types.some((x) => x.id === l.id);
      const record: LensType = {
        id: l.id || uid(),
        name: l.name.trim(),
        description: l.description,
        created_at: l.created_at ?? new Date().toISOString(),
      };
      commit({
        ...db,
        lens_types: exists
          ? db.lens_types.map((x) => (x.id === record.id ? record : x))
          : [...db.lens_types, record],
      });
      return null;
    };

    const deleteLensType = (id: string) => {
      if (db.items.some((i) => i.lens_type_id === id))
        return "This lens type is used by existing items.";
      commit({ ...db, lens_types: db.lens_types.filter((l) => l.id !== id) });
      return null;
    };

    // Main & Second Types Management
    const saveMainType: AppContextValue["saveMainType"] = (m, oldName) => {
      const trimmedName = m.name.trim();
      if (!trimmedName) return "اسم النوع الرئيسي مطلوب.";

      const currentMainTypes = db.main_types ?? [];
      const isDuplicate = currentMainTypes.some(
        (x) => x.id !== m.id && x.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (isDuplicate) return "يوجد نوع رئيسي مسجل بهذا الاسم بالفعل.";

      const exists = currentMainTypes.some((x) => x.id === m.id);
      const existingRecord = currentMainTypes.find((x) => x.id === m.id);
      const prevName = oldName || existingRecord?.name || trimmedName;

      const record: MainTypeDefinition = {
        id: m.id || `mt-${Date.now().toString(36)}`,
        name: trimmedName,
        description: m.description?.trim(),
        second_types: m.second_types ?? existingRecord?.second_types ?? [],
        created_at: existingRecord?.created_at ?? new Date().toISOString(),
      };

      const updatedMainTypes = exists
        ? currentMainTypes.map((x) => (x.id === record.id ? record : x))
        : [...currentMainTypes, record];

      // Cascade update to items and sizes if the Main Type name changed
      let updatedItems = db.items;
      let updatedSizes = db.sizes;

      if (prevName && prevName !== trimmedName) {
        updatedItems = db.items.map((it) =>
          it.main_type === prevName ? { ...it, main_type: trimmedName } : it,
        );
        updatedSizes = db.sizes.map((sz) =>
          sz.main_type === prevName ? { ...sz, main_type: trimmedName } : sz,
        );
      }

      commit({
        ...db,
        main_types: updatedMainTypes,
        items: updatedItems,
        sizes: updatedSizes,
      });

      return null;
    };

    const deleteMainType: AppContextValue["deleteMainType"] = (id) => {
      const currentMainTypes = db.main_types ?? [];
      const target = currentMainTypes.find((m) => m.id === id);
      if (!target) return "النوع الرئيسي غير موجود.";

      const isUsedInItems = db.items.some((it) => it.main_type === target.name);
      const isUsedInSizes = db.sizes.some((sz) => sz.main_type === target.name);

      if (isUsedInItems || isUsedInSizes) {
        return "لا يمكن حذف هذا النوع الرئيسي لأنه مستخدم في أصناف أو مقاسات مسجلة بالكتالوج.";
      }

      commit({
        ...db,
        main_types: currentMainTypes.filter((m) => m.id !== id),
      });

      return null;
    };

    const addSecondType: AppContextValue["addSecondType"] = (mainTypeId, secondTypeName) => {
      const trimmed = secondTypeName.trim();
      if (!trimmed) return "اسم النوع الفرعي مطلوب.";

      const currentMainTypes = db.main_types ?? [];
      const target = currentMainTypes.find((m) => m.id === mainTypeId);
      if (!target) return "النوع الرئيسي غير موجود.";

      if (target.second_types.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        return "هذا النوع الفرعي موجود بالفعل تحت هذا النوع الرئيسي.";
      }

      const updated = currentMainTypes.map((m) =>
        m.id === mainTypeId ? { ...m, second_types: [...m.second_types, trimmed] } : m,
      );

      commit({
        ...db,
        main_types: updated,
      });

      return null;
    };

    const updateSecondType: AppContextValue["updateSecondType"] = (
      mainTypeId,
      oldSecondName,
      newSecondName,
    ) => {
      const trimmedOld = oldSecondName.trim();
      const trimmedNew = newSecondName.trim();
      if (!trimmedNew) return "اسم النوع الفرعي الجديد مطلوب.";

      const currentMainTypes = db.main_types ?? [];
      const target = currentMainTypes.find((m) => m.id === mainTypeId);
      if (!target) return "النوع الرئيسي غير موجود.";

      if (
        trimmedOld !== trimmedNew &&
        target.second_types.some((s) => s.toLowerCase() === trimmedNew.toLowerCase())
      ) {
        return "يوجد نوع فرعي آخر بهذا الاسم بالفعل.";
      }

      const updatedMainTypes = currentMainTypes.map((m) =>
        m.id === mainTypeId
          ? {
              ...m,
              second_types: m.second_types.map((st) => (st === trimmedOld ? trimmedNew : st)),
            }
          : m,
      );

      // Cascade update to items and sizes under this main type
      const mainName = target.name;
      const updatedItems = db.items.map((it) =>
        it.main_type === mainName && it.second_type === trimmedOld
          ? { ...it, second_type: trimmedNew }
          : it,
      );
      const updatedSizes = db.sizes.map((sz) =>
        sz.main_type === mainName && sz.second_type === trimmedOld
          ? { ...sz, second_type: trimmedNew }
          : sz,
      );

      commit({
        ...db,
        main_types: updatedMainTypes,
        items: updatedItems,
        sizes: updatedSizes,
      });

      return null;
    };

    const deleteSecondType: AppContextValue["deleteSecondType"] = (mainTypeId, secondTypeName) => {
      const trimmed = secondTypeName.trim();
      const currentMainTypes = db.main_types ?? [];
      const target = currentMainTypes.find((m) => m.id === mainTypeId);
      if (!target) return "النوع الرئيسي غير موجود.";

      const isUsedInItems = db.items.some(
        (it) => it.main_type === target.name && it.second_type === trimmed,
      );
      const isUsedInSizes = db.sizes.some(
        (sz) => sz.main_type === target.name && sz.second_type === trimmed,
      );

      if (isUsedInItems || isUsedInSizes) {
        return "لا يمكن حذف هذا النوع الفرعي لأنه مستخدم في أصناف أو أسعار بالكتالوج.";
      }

      const updated = currentMainTypes.map((m) =>
        m.id === mainTypeId
          ? { ...m, second_types: m.second_types.filter((st) => st !== trimmed) }
          : m,
      );

      commit({
        ...db,
        main_types: updated,
      });

      return null;
    };

    const saveFrameType: AppContextValue["saveFrameType"] = (f) => {
      if (!f.name.trim()) return "Frame type name is required.";
      if (
        db.frame_types.some(
          (x) => x.id !== f.id && x.name.toLowerCase() === f.name.trim().toLowerCase(),
        )
      )
        return "A frame type with this name already exists.";
      const exists = db.frame_types.some((x) => x.id === f.id);
      const record: FrameType = {
        id: f.id || uid(),
        name: f.name.trim(),
        description: f.description,
        created_at: f.created_at ?? new Date().toISOString(),
      };
      commit({
        ...db,
        frame_types: exists
          ? db.frame_types.map((x) => (x.id === record.id ? record : x))
          : [...db.frame_types, record],
      });
      return null;
    };

    const deleteFrameType = (id: string) => {
      if (db.items.some((i) => i.frame_type_id === id))
        return "This frame type is used by existing items.";
      commit({ ...db, frame_types: db.frame_types.filter((f) => f.id !== id) });
      return null;
    };

    const saveItem: AppContextValue["saveItem"] = (item, sizes) => {
      if (!item.name.trim()) return "Item name is required.";
      if (!item.sku.trim()) return "Item code (SKU) is required.";
      if (
        db.items.some(
          (i) => i.id !== item.id && i.sku.toLowerCase() === item.sku.trim().toLowerCase(),
        )
      )
        return "This item code (SKU) already exists.";
      if (!item.kind) return "Choose what this record is: lenses, frame, or frame with lenses.";
      if (!item.supplier_id) return "Supplier is required.";
      if (!item.customer_category_id) return "Customer category is required.";

      const withLenses = item.kind !== "frame";
      if (!withLenses) {
        if (!Number.isFinite(item.price ?? NaN) || (item.price ?? 0) <= 0)
          return "Frame price must be a valid positive number.";
      } else {
        if (!item.lens_type_id && sizes.some((s) => !s.lens_type_id))
          return "Lens type is required (on the item or on each price row).";
        if (sizes.length === 0) return "Add at least one price row (SPH/CYL range + price).";
        if (sizes.some((s) => s.eye !== "R" && s.eye !== "L" && s.eye !== "B"))
          return "Each price row must target the right eye, left eye, or both.";
        if (
          sizes.some(
            (s) =>
              !Number.isFinite(s.sph_min) ||
              !Number.isFinite(s.sph_max) ||
              !Number.isFinite(s.cyl_min) ||
              !Number.isFinite(s.cyl_max),
          )
        )
          return "SPH and CYL ranges must be valid numbers.";
        const normalized = sizes.map(
          (s) =>
            `${s.eye}|${s.lens_type_id ?? ""}|${s.sph_min}|${s.sph_max}|${s.cyl_min}|${s.cyl_max}`,
        );
        if (new Set(normalized).size !== normalized.length)
          return "This price row (same eye, lens type and range) already exists.";
        if (sizes.some((s) => !Number.isFinite(s.price) || s.price <= 0))
          return "Price must be a valid positive number.";
      }

      const exists = db.items.some((i) => i.id === item.id);
      const stamp = new Date().toISOString();
      const record: Item = {
        ...item,
        id: item.id || uid(),
        name: item.name.trim(),
        sku: item.sku.trim(),
        main_type: item.main_type?.trim() || undefined,
        second_type: item.second_type?.trim() || undefined,
        lens_type_id: withLenses ? item.lens_type_id : undefined,
        frame_type_id: item.kind === "lens" ? undefined : item.frame_type_id,
        price: withLenses ? undefined : item.price,
        created_at: item.created_at ?? stamp,
        updated_at: stamp,
      };
      const newSizes: ItemSize[] = (withLenses ? sizes : []).map((s) => ({
        id: s.id || uid(),
        item_id: record.id,
        lens_type_id: s.lens_type_id,
        main_type: s.main_type || record.main_type,
        second_type: s.second_type || record.second_type,
        eye: s.eye,
        sph_min: s.sph_min,
        sph_max: s.sph_max,
        cyl_min: s.cyl_min,
        cyl_max: s.cyl_max,
        price: s.price,
        note: s.note,
      }));

      commit({
        ...db,
        items: exists
          ? db.items.map((i) => (i.id === record.id ? record : i))
          : [...db.items, record],
        sizes: [...db.sizes.filter((s) => s.item_id !== record.id), ...newSizes],
      });
      return null;
    };

    const deleteItem = (id: string) => {
      commit({
        ...db,
        items: db.items.filter((i) => i.id !== id),
        sizes: db.sizes.filter((s) => s.item_id !== id),
      });
    };

    const updateSettings = (patch: Partial<AppSettings>) =>
      commit({ ...db, settings: { ...db.settings, ...patch } });

    const applyPriceUpdate: AppContextValue["applyPriceUpdate"] = ({
      filename,
      itemsToUpdate,
      createNewItems = true,
      notes,
    }) => {
      const now = new Date().toISOString();
      const batchId = `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const snapshotItems = JSON.parse(JSON.stringify(db.items));
      const snapshotSizes = JSON.parse(JSON.stringify(db.sizes));

      let updatedSizes = [...db.sizes];
      let updatedItems = [...db.items];
      let updatedCount = 0;
      let createdCount = 0;
      let needsReviewCount = 0;

      // Ensure we have default supplier and category if creating new items
      const defaultSupplier = db.suppliers[0] || {
        id: uid(),
        name: "مورّد افتراضي (اتحاد بصريين مصر)",
        created_at: now,
      };
      const defaultCategory = db.categories[0] || {
        id: uid(),
        name: "عام (Unisex)",
        created_at: now,
      };

      const suppliersList = db.suppliers.length > 0 ? db.suppliers : [defaultSupplier];
      const categoriesList = db.categories.length > 0 ? db.categories : [defaultCategory];

      itemsToUpdate.forEach((update) => {
        if (!update.selected) return;
        if (update.status === "needs_review") needsReviewCount++;

        if (update.matched_size_id) {
          // Update existing size
          updatedSizes = updatedSizes.map((s) =>
            s.id === update.matched_size_id
              ? {
                  ...s,
                  main_type: s.main_type || update.main_item_name,
                  second_type: s.second_type || update.variant_type,
                  price: update.new_price,
                  sph_min: update.sph_min,
                  sph_max: update.sph_max,
                  cyl_min: update.cyl_min,
                  cyl_max: update.cyl_max,
                  note: update.note || s.note,
                }
              : s,
          );
          // Touch item updated_at & set main/second type if missing
          if (update.matched_item_id) {
            updatedItems = updatedItems.map((i) =>
              i.id === update.matched_item_id
                ? {
                    ...i,
                    main_type: i.main_type || update.main_item_name,
                    second_type: i.second_type || update.variant_type,
                    updated_at: now,
                  }
                : i,
            );
          }
          updatedCount++;
        } else if (update.matched_item_id) {
          // Matched item exists, add a new size range to it
          const newSize: ItemSize = {
            id: uid(),
            item_id: update.matched_item_id,
            main_type: update.main_item_name,
            second_type: update.variant_type,
            eye: update.eye,
            sph_min: update.sph_min,
            sph_max: update.sph_max,
            cyl_min: update.cyl_min,
            cyl_max: update.cyl_max,
            price: update.new_price,
            note: update.note,
          };
          updatedSizes.push(newSize);
          updatedItems = updatedItems.map((i) =>
            i.id === update.matched_item_id
              ? {
                  ...i,
                  main_type: i.main_type || update.main_item_name,
                  second_type: i.second_type || update.variant_type,
                  updated_at: now,
                }
              : i,
          );
          updatedCount++;
        } else if (createNewItems) {
          // Create new catalog item & lens size
          let lensTypeId = db.lens_types.find((lt) =>
            lt.name.toLowerCase().includes(update.lens_type.toLowerCase()),
          )?.id;

          if (!lensTypeId && db.lens_types.length > 0) {
            lensTypeId = db.lens_types[0].id;
          }

          const newItemId = uid();
          const newItem: Item = {
            id: newItemId,
            name: update.lens_name || `${update.main_item_name} - ${update.variant_type}`,
            sku: `LENS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
            kind: "lens",
            main_type: update.main_item_name,
            second_type: update.variant_type,
            lens_type_id: lensTypeId,
            supplier_id: defaultSupplier.id,
            customer_category_id: defaultCategory.id,
            notes: `${update.main_item_name || ""} · ${update.variant_type || ""} · ${update.brand || ""}`,
            created_at: now,
            updated_at: now,
          };

          const newSize: ItemSize = {
            id: uid(),
            item_id: newItemId,
            lens_type_id: lensTypeId,
            main_type: update.main_item_name,
            second_type: update.variant_type,
            eye: update.eye,
            sph_min: update.sph_min,
            sph_max: update.sph_max,
            cyl_min: update.cyl_min,
            cyl_max: update.cyl_max,
            price: update.new_price,
            note: update.note,
          };

          updatedItems.push(newItem);
          updatedSizes.push(newSize);
          createdCount++;
        }
      });

      const logEntry: PriceUpdateLog = {
        id: uid(),
        batch_id: batchId,
        timestamp: now,
        filename,
        user: currentUser || "المدير (Admin)",
        total_extracted: itemsToUpdate.length,
        updated_count: updatedCount,
        unmatched_count: createdCount,
        unchanged_count: itemsToUpdate.filter((i) => i.status === "unchanged").length,
        needs_review_count: needsReviewCount,
        items_snapshot_before: snapshotItems,
        sizes_snapshot_before: snapshotSizes,
        notes: notes || `تحديث أسعار هرمي (دفعة ${batchId})`,
      };

      const nextDb: Database = {
        ...db,
        suppliers: suppliersList,
        categories: categoriesList,
        items: updatedItems,
        sizes: updatedSizes,
        price_updates: [logEntry, ...(db.price_updates || [])],
      };

      commit(nextDb);
      return { updatedCount, createdCount };
    };

    const rollbackPriceUpdate = (updateLogId: string): boolean => {
      const log = (db.price_updates || []).find((l) => l.id === updateLogId);
      if (!log || !log.items_snapshot_before || !log.sizes_snapshot_before) {
        return false;
      }

      commit({
        ...db,
        items: log.items_snapshot_before,
        sizes: log.sizes_snapshot_before,
        price_updates: (db.price_updates || []).filter((l) => l.id !== updateLogId),
      });
      return true;
    };

    const deletePriceUpdateLog = (updateLogId: string) => {
      commit({
        ...db,
        price_updates: (db.price_updates || []).filter((l) => l.id !== updateLogId),
      });
    };

    const saveInvoice: AppContextValue["saveInvoice"] = (invoice) => {
      const now = new Date().toISOString();
      const id = invoice.id || uid();
      const invoiceNumber = invoice.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
      const record = {
        ...invoice,
        id,
        invoice_number: invoiceNumber,
        created_at: invoice.created_at || now,
      };

      const exists = (db.invoices || []).some((i) => i.id === id);
      const invoices = exists
        ? (db.invoices || []).map((i) => (i.id === id ? record : i))
        : [record, ...(db.invoices || [])];

      commit({ ...db, invoices });
      return id;
    };

    const deleteInvoice = (id: string) => {
      commit({
        ...db,
        invoices: (db.invoices || []).filter((i) => i.id !== id),
      });
    };

    return {
      db,
      ready,
      language: currentLanguage,
      setLanguage,
      toggleLanguage,
      currentUser,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      saveSupplier,
      deleteSupplier,
      saveCategory,
      deleteCategory,
      saveLensType,
      deleteLensType,
      saveMainType,
      deleteMainType,
      addSecondType,
      updateSecondType,
      deleteSecondType,
      saveFrameType,
      deleteFrameType,
      saveItem,
      deleteItem,
      updateSettings,
      applyPriceUpdate,
      rollbackPriceUpdate,
      deletePriceUpdateLog,
      saveInvoice,
      deleteInvoice,
    };
  }, [db, ready, currentLanguage, currentUser, commit]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
