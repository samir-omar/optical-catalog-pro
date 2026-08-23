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

export type Eye = "R" | "L";

/** What the catalog record actually is. */
export type ProductKind = "lens" | "frame" | "frame_lens";

export interface ItemSize {
  id: string;
  item_id: string;
  eye: Eye;
  sph: number;
  cyl: number;
  price: number;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  image?: string | undefined;
  kind: ProductKind;
  /** Required for lens and frame+lens records. */
  lens_type_id?: string | undefined;
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
  items: Item[];
  sizes: ItemSize[];
  settings: AppSettings;
}
