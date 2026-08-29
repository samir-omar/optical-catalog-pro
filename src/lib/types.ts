export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | undefined;
  notes?: string | undefined;
  created_at: string;
}

export interface CustomerCategory {
  id: string;
  name: string;
  description?: string | undefined;
  created_at: string;
}

/** Lens type (e.g. White, Blue-cut, Photochromic) — it changes the price. */
export interface LensType {
  id: string;
  name: string;
  description?: string | undefined;
  created_at: string;
}

/** Main Type Definition (e.g. بلاستيك أبيض 65M, بالستين أبيض, بلوكت) with its nested Second Types */
export interface MainTypeDefinition {
  id: string;
  name: string;
  description?: string | undefined;
  second_types: string[];
  created_at?: string | undefined;
}

/** Frame type (e.g. Metal, Acetate, Titanium) — it changes the price. */
export interface FrameType {
  id: string;
  name: string;
  description?: string | undefined;
  created_at: string;
}

export type Eye = "R" | "L";

/** Eye scope of a price row: right, left, or both eyes (the usual case). */
export type EyeScope = Eye | "B";

/** What the catalog record actually is. */
export type ProductKind = "lens" | "frame" | "frame_lens";

/**
 * A price row. Prices in real optical price lists are given for a RANGE of
 * powers (e.g. SPH from PL to -6.00 with CYL up to -2.00), so every row stores
 * a min/max for both SPH and CYL. A single exact power is just min === max.
 */
export interface ItemSize {
  id: string;
  item_id: string;
  /** Optional per-row lens type, overrides the item-level one (price lists price per brand). */
  lens_type_id?: string | undefined;
  /** Optional per-row main type (e.g. "بلاستيك أبيض 65M", "بالستين أبيض", "بلوكت") */
  main_type?: string | undefined;
  /** Optional per-row second type (e.g. "1.56", "1.60", "سكوير إيطالي", "كوداك") */
  second_type?: string | undefined;
  eye: EyeScope;
  sph_min: number;
  sph_max: number;
  cyl_min: number;
  cyl_max: number;
  price: number;
  /** Free note shown next to the price, e.g. "60mm" or "مجموع 6 سلندر 4". */
  note?: string | undefined;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  image?: string | undefined;
  kind: ProductKind;
  /** Main Type (النوع الرئيسي) e.g. "بلاستيك أبيض 65M", "بالستين أبيض", "بلوكت", "فوتوجراي" */
  main_type?: string | undefined;
  /** Second Type (النوع الفرعي / الثانوي) e.g. "1.56", "1.60", "سكوير إيطالي", "كوداك" */
  second_type?: string | undefined;
  /** Required for lens and frame+lens records. */
  lens_type_id?: string | undefined;
  /** Used by frame and frame+lens records. */
  frame_type_id?: string | undefined;
  /** Fixed price used by frame-only records (no lens powers). */
  price?: number | undefined;
  supplier_id: string;
  customer_category_id: string;
  notes?: string | undefined;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  application_name: string;
  logo?: string | undefined;
  background_mode: "default" | "color" | "image";
  background_color: string;
  background_image?: string | undefined;
  theme: "light" | "dark";
  language?: "ar" | "en";
  currency?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
}

export type PriceUpdateStatus = "will_update" | "no_match" | "unchanged" | "needs_review";

/** Exact size/power range entry under a Type Variant */
export interface HierarchicalSizeRow {
  id: string;
  eye: EyeScope;
  sph_min: number;
  sph_max: number;
  cyl_min: number;
  cyl_max: number;
  old_price: number | null;
  new_price: number;
  status: PriceUpdateStatus;
  matched_item_id?: string | undefined;
  matched_size_id?: string | undefined;
  note?: string | undefined;
  selected?: boolean;
}

/** Type / Variant entry under a Main Item (e.g. 1.56, 1.60, 1.67, 1.74, Polarized, etc.) */
export interface HierarchicalTypeVariant {
  id: string;
  name: string; // e.g. "1.56", "1.60", "1.67", "1.74"
  index_material: string;
  lens_type_id?: string;
  sizes: HierarchicalSizeRow[];
}

/** Main Item / Primary Category (e.g. بالستين أبيض, بالستين أخضر, بلوكت, فوتوجراي بالستين, فوتوجراي بلوكت, لياده ليلية, مقاوم للكسر, مضغوط, 1.74, تصنيعات سكوب, باي فوكل, تصنيعات النور, العدسات اللاصقة) */
export interface HierarchicalMainItem {
  id: string;
  name: string; // e.g. "بالستين أبيض", "بلوكت", "فوتوجراي بلوكت"
  brand: string; // e.g. "كوداك", "بلاتنيوم", "سكوير", "صيني", "اتحاد بصريين مصر"
  variants: HierarchicalTypeVariant[];
  totalSizesCount: number;
}

export interface ExtractedPriceItem {
  id: string;
  main_item_name: string; // e.g. "بالستين أبيض"
  variant_type: string; // e.g. "1.56"
  lens_name: string;
  brand: string;
  category: string;
  lens_type: string;
  index_material?: string | undefined;
  eye: EyeScope;
  sph_min: number;
  sph_max: number;
  cyl_min: number;
  cyl_max: number;
  current_price: number | null;
  new_price: number;
  status: PriceUpdateStatus;
  matched_item_id?: string | undefined;
  matched_size_id?: string | undefined;
  matched_item_name?: string | undefined;
  note?: string | undefined;
  selected?: boolean;
}

export interface PriceUpdateLog {
  id: string;
  batch_id?: string;
  timestamp: string;
  filename: string;
  user: string;
  total_extracted: number;
  updated_count: number;
  unmatched_count: number;
  unchanged_count: number;
  needs_review_count?: number;
  items_snapshot_before: Item[];
  sizes_snapshot_before: ItemSize[];
  notes?: string | undefined;
}

export interface SalePrescription {
  r_sph?: number;
  r_cyl?: number;
  r_axis?: number;
  l_sph?: number;
  l_cyl?: number;
  l_axis?: number;
  pd?: number;
  addition?: number;
}

export interface SaleItemLine {
  id: string;
  item_id?: string;
  name: string;
  kind: ProductKind;
  lens_type?: string;
  frame_type?: string;
  details?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface SaleInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_category_id?: string;
  prescription?: SalePrescription;
  items: SaleItemLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  remaining: number;
  status: "paid" | "partial" | "pending";
  notes?: string;
  created_at: string;
}

export interface Database {
  users: User[];
  suppliers: Supplier[];
  categories: CustomerCategory[];
  lens_types: LensType[];
  frame_types: FrameType[];
  main_types?: MainTypeDefinition[];
  items: Item[];
  sizes: ItemSize[];
  settings: AppSettings;
  price_updates?: PriceUpdateLog[];
  invoices?: SaleInvoice[];
}
