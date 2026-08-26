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
}

export interface Database {
  users: User[];
  suppliers: Supplier[];
  categories: CustomerCategory[];
  lens_types: LensType[];
  frame_types: FrameType[];
  items: Item[];
  sizes: ItemSize[];
  settings: AppSettings;
}
