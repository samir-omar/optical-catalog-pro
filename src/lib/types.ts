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

export type Eye = "R" | "L";

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
  items: Item[];
  sizes: ItemSize[];
  settings: AppSettings;
}
