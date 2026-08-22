import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hashPassword, loadDb, saveDb, uid } from "./db";
import type {
  AppSettings,
  CustomerCategory,
  Database,
  Item,
  ItemSize,
  Supplier,
  User,
} from "./types";

// The session is intentionally kept in memory only: closing or reloading the
// app always requires signing in again.

interface AppContextValue {
  db: Database;
  ready: boolean;
  currentUser: string | null;
  login: (u: string, p: string) => string | null;
  logout: () => void;
  // users
  addUser: (username: string, password: string) => string | null;
  updateUser: (id: string, username: string, password?: string) => string | null;
  deleteUser: (id: string) => string | null;
  // suppliers
  saveSupplier: (s: Omit<Supplier, "created_at"> & { created_at?: string }) => string | null;
  deleteSupplier: (id: string) => string | null;
  // categories
  saveCategory: (c: Omit<CustomerCategory, "created_at"> & { created_at?: string }) => string | null;
  deleteCategory: (id: string) => string | null;
  // items
  saveItem: (
    item: Omit<Item, "created_at" | "updated_at"> & { created_at?: string },
    sizes: Array<Omit<ItemSize, "item_id">>,
  ) => string | null;
  deleteItem: (id: string) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDb());
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setDb(loadDb());
    setCurrentUser(window.localStorage.getItem(SESSION_KEY));
    setReady(true);
  }, []);

  const commit = useCallback((next: Database) => {
    setDb(next);
    saveDb(next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle("dark", db.settings.theme === "dark");
  }, [db.settings.theme, ready]);

  const value = useMemo<AppContextValue>(() => {
    const login = (username: string, password: string) => {
      const u = db.users.find(
        (x) => x.username.toLowerCase() === username.trim().toLowerCase(),
      );
      if (!u) return "Username not found.";
      if (u.password_hash !== hashPassword(password)) return "Incorrect password.";
      window.localStorage.setItem(SESSION_KEY, u.username);
      setCurrentUser(u.username);
      return null;
    };

    const logout = () => {
      window.localStorage.removeItem(SESSION_KEY);
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

    const saveItem: AppContextValue["saveItem"] = (item, sizes) => {
      if (!item.name.trim()) return "Item name is required.";
      if (!item.sku.trim()) return "Item code (SKU) is required.";
      if (
        db.items.some(
          (i) => i.id !== item.id && i.sku.toLowerCase() === item.sku.trim().toLowerCase(),
        )
      )
        return "This item code (SKU) already exists.";
      if (!item.supplier_id) return "Supplier is required.";
      if (!item.customer_category_id) return "Customer category is required.";
      if (sizes.length === 0) return "Add at least one size with its price.";
      const normalized = sizes.map((s) => s.size.trim());
      if (normalized.some((s) => !s)) return "Size cannot be empty.";
      if (new Set(normalized).size !== normalized.length)
        return "Duplicate sizes are not allowed for the same item.";
      if (sizes.some((s) => !Number.isFinite(s.price) || s.price <= 0))
        return "Price must be a valid positive number.";

      const exists = db.items.some((i) => i.id === item.id);
      const stamp = new Date().toISOString();
      const record: Item = {
        ...item,
        id: item.id || uid(),
        name: item.name.trim(),
        sku: item.sku.trim(),
        created_at: item.created_at ?? stamp,
        updated_at: stamp,
      };
      const newSizes: ItemSize[] = sizes.map((s) => ({
        id: s.id || uid(),
        item_id: record.id,
        size: s.size.trim(),
        price: s.price,
      }));
      commit({
        ...db,
        items: exists ? db.items.map((i) => (i.id === record.id ? record : i)) : [...db.items, record],
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

    return {
      db,
      ready,
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
      saveItem,
      deleteItem,
      updateSettings,
    };
  }, [db, ready, currentUser, commit]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
