import type { Database, Eye } from "./types";

const STORAGE_KEY = "optic-catalog-db-v2";

export const hashPassword = (pw: string) =>
  typeof window === "undefined" ? pw : btoa(`optic::${pw}`);

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const now = () => new Date().toISOString();

/** Formats a prescription value the way an eye report does: +6.00 / -1.00 / 0.00 */
export const formatDiopter = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)}`;

export const eyeLabel = (eye: Eye) => (eye === "R" ? "Right (R)" : "Left (L)");

export const lensLabel = (s: { eye: Eye; sph: number; cyl: number }) =>
  `${s.eye} · SPH ${formatDiopter(s.sph)} · CYL ${formatDiopter(s.cyl)}`;

/** Parses "+6", "6.00", "-1.5" into a number; returns null when invalid. */
export const parseDiopter = (raw: string): number | null => {
  const v = raw.trim().replace(/\s+/g, "");
  if (!v || !/^[+-]?\d+(\.\d+)?$/.test(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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

  const sizes = (
    [
      [i1.id, "R", 6, -1, 500],
      [i1.id, "L", 8, -0.5, 550],
      [i1.id, "R", 2.5, -0.75, 600],
      [i1.id, "L", 2.5, -0.75, 600],
      [i2.id, "R", 1.25, -0.5, 700],
      [i2.id, "L", 1.25, -0.5, 700],
      [i2.id, "R", -3, -1.25, 820],
      [i3.id, "R", 0.5, 0, 350],
      [i3.id, "L", 0.5, 0, 350],
      [i3.id, "L", -1.5, -0.25, 400],
      [i4.id, "R", -2.25, -1, 900],
      [i4.id, "L", -2.25, -1, 900],
      [i4.id, "R", 4, -2, 1050],
    ] as Array<[string, Eye, number, number, number]>
  ).map(([item_id, eye, sph, cyl, price]) => ({
    id: uid(),
    item_id,
    eye,
    sph,
    cyl,
    price,
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
