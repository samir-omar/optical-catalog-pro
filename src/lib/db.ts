import type { Database } from "./types";

const STORAGE_KEY = "optic-catalog-db-v1";

export const hashPassword = (pw: string) =>
  typeof window === "undefined" ? pw : btoa(`optic::${pw}`);

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const now = () => new Date().toISOString();

function seed(): Database {
  const supA = { id: uid(), name: "Vision Optics Co.", phone: "0100 111 2233", notes: "Frames importer", created_at: now() };
  const supB = { id: uid(), name: "Nile Eyewear", phone: "0122 555 8877", notes: "", created_at: now() };
  const supC = { id: uid(), name: "Delta Frames", phone: "", notes: "Local workshop", created_at: now() };

  const catMen = { id: uid(), name: "Men", description: "Frames for men", created_at: now() };
  const catWomen = { id: uid(), name: "Women", description: "Frames for women", created_at: now() };
  const catKids = { id: uid(), name: "Kids", description: "Children frames", created_at: now() };
  const catSport = { id: uid(), name: "Sports", description: "Sport and outdoor", created_at: now() };

  const mk = (
    name: string,
    sku: string,
    supplier_id: string,
    customer_category_id: string,
    notes: string,
  ) => ({
    id: uid(),
    name,
    sku,
    supplier_id,
    customer_category_id,
    notes,
    created_at: now(),
    updated_at: now(),
  });

  const i1 = mk("Ray Model A", "RAY-A-001", supA.id, catMen.id, "Metal frame, matte black");
  const i2 = mk("Aurora Classic", "AUR-C-014", supB.id, catWomen.id, "Acetate, rose gold detail");
  const i3 = mk("Junior Flex", "JUN-F-220", supC.id, catKids.id, "Flexible TR90 frame");
  const i4 = mk("Trail Sport", "TRL-S-031", supA.id, catSport.id, "Wrap-around sport frame");

  const sizes = [
    [i1.id, "50", 500], [i1.id, "52", 550], [i1.id, "54", 600], [i1.id, "56", 650],
    [i2.id, "52", 700], [i2.id, "54", 760], [i2.id, "56", 820],
    [i3.id, "44", 350], [i3.id, "46", 380], [i3.id, "48", 400], [i3.id, "52", 430],
    [i4.id, "52", 900], [i4.id, "54", 950], [i4.id, "58", 1050],
  ].map(([item_id, size, price]) => ({
    id: uid(),
    item_id: item_id as string,
    size: size as string,
    price: price as number,
  }));

  return {
    users: [
      { id: uid(), username: "admin", password_hash: hashPassword("admin123"), created_at: now() },
    ],
    suppliers: [supA, supB, supC],
    categories: [catMen, catWomen, catKids, catSport],
    items: [i1, i2, i3, i4],
    sizes,
    settings: {
      application_name: "OptiPrice Catalog",
      background_mode: "default",
      background_color: "#0f2744",
      theme: "light",
    },
  };
}

export function loadDb(): Database {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = seed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as Database;
  } catch {
    return seed();
  }
}

export function saveDb(db: Database) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const formatPrice = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} EGP`;
