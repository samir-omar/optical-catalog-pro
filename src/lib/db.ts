import type { Database, Eye, EyeScope, ItemSize, ProductKind } from "./types";

const STORAGE_KEY = "optic-catalog-db-v4";

export const hashPassword = (pw: string) =>
  typeof window === "undefined" ? pw : btoa(`optic::${pw}`);

let uidCounter = 0;
export const uid = () =>
  `${Date.now().toString(36)}-${(uidCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const now = () => new Date().toISOString();

/** Formats a prescription value the way an eye report does: +6.00 / -1.00 / 0.00 */
export const formatDiopter = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)}`;

/** Price lists write 0.00 as "PL" (plano). */
export const diopterLabel = (n: number) => (n === 0 ? "PL" : formatDiopter(n));

export const eyeLabel = (eye: EyeScope) =>
  eye === "R" ? "Right (R)" : eye === "L" ? "Left (L)" : "Both eyes";

export const eyeShort = (eye: EyeScope) => (eye === "B" ? "R+L" : eye);

export const KINDS: Array<{ value: ProductKind; label: string; short: string }> = [
  { value: "lens", label: "Lenses only", short: "Lenses" },
  { value: "frame", label: "Frame only", short: "Frame" },
  { value: "frame_lens", label: "Frame with lenses", short: "Frame + Lenses" },
];

export const kindLabel = (k: ProductKind) =>
  KINDS.find((x) => x.value === k)?.label ?? "Frame only";

export const kindShort = (k: ProductKind) => KINDS.find((x) => x.value === k)?.short ?? "Frame";

/** Frame-only records have a single price, everything else is priced per lens. */
export const hasLensPowers = (k: ProductKind) => k !== "frame";

/** Lens-only records have no frame, so no frame type. */
export const hasFrame = (k: ProductKind) => k !== "lens";

type RangeLike = Pick<ItemSize, "sph_min" | "sph_max" | "cyl_min" | "cyl_max">;

const span = (min: number, max: number) =>
  min === max ? diopterLabel(min) : `${diopterLabel(min)} → ${diopterLabel(max)}`;

/** "SPH PL → -6.00 · CYL 0.00 → -2.00" */
export const rangeLabel = (s: RangeLike) =>
  `SPH ${span(s.sph_min, s.sph_max)} · CYL ${span(s.cyl_min, s.cyl_max)}`;

export const lensLabel = (s: RangeLike & { eye: EyeScope }) =>
  `${eyeShort(s.eye)} · ${rangeLabel(s)}`;

/** True when a requested power falls inside the row's range (order-independent). */
export const inRange = (value: number, a: number, b: number, tolerance = 0) =>
  value >= Math.min(a, b) - tolerance && value <= Math.max(a, b) + tolerance;

export const rowMatches = (
  row: RangeLike & { eye: EyeScope },
  q: { sph?: number | null; cyl?: number | null; eye?: "all" | Eye },
  tolerance = 0,
) => {
  if (q.eye && q.eye !== "all" && row.eye !== "B" && row.eye !== q.eye) return false;
  if (q.sph !== null && q.sph !== undefined && !inRange(q.sph, row.sph_min, row.sph_max, tolerance))
    return false;
  if (q.cyl !== null && q.cyl !== undefined && !inRange(q.cyl, row.cyl_min, row.cyl_max, tolerance))
    return false;
  return true;
};

/** Parses "+6", "6.00", "-1.5", "PL", "0" into a number; returns null when invalid. */
export const parseDiopter = (raw: string): number | null => {
  const v = raw.trim().replace(/\s+/g, "");
  if (!v) return null;
  if (/^(pl|plano)$/i.test(v)) return 0;
  if (!/^[+-]?\d+(\.\d+)?$/.test(v)) return null;
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

  const ltWhite = { id: uid(), name: "White (CR-39)", description: "Standard clear lens", created_at: now() };
  const ltBlue = { id: uid(), name: "Blue Cut", description: "Blue light filter", created_at: now() };
  const ltPhoto = { id: uid(), name: "Photochromic", description: "Darkens in sunlight", created_at: now() };
  const ltProg = { id: uid(), name: "Progressive", description: "Multifocal lens", created_at: now() };

  const ftMetal = { id: uid(), name: "Metal", description: "Metal frames", created_at: now() };
  const ftAcetate = { id: uid(), name: "Acetate", description: "Acetate frames", created_at: now() };
  const ftTitanium = { id: uid(), name: "Titanium", description: "Lightweight titanium", created_at: now() };

  const mk = (
    name: string,
    sku: string,
    kind: ProductKind,
    supplier_id: string,
    customer_category_id: string,
    notes: string,
    lens_type_id?: string,
    price?: number,
    frame_type_id?: string,
  ) => ({
    id: uid(),
    name,
    sku,
    kind,
    lens_type_id,
    frame_type_id,
    price,
    supplier_id,
    customer_category_id,
    notes,
    created_at: now(),
    updated_at: now(),
  });

  const i1 = mk("Ray Model A", "RAY-A-001", "frame_lens", supA.id, catMen.id, "Metal frame, matte black", ltWhite.id, undefined, ftMetal.id);
  const i2 = mk("Aurora Classic", "AUR-C-014", "frame_lens", supB.id, catWomen.id, "Acetate, rose gold detail", ltBlue.id, undefined, ftAcetate.id);
  const i3 = mk("Junior Flex", "JUN-F-220", "lens", supC.id, catKids.id, "Kids lenses", ltPhoto.id);
  const i4 = mk("Trail Sport", "TRL-S-031", "lens", supA.id, catSport.id, "Sport lenses", ltProg.id);
  const i5 = mk("Metro Frame", "MET-F-100", "frame", supB.id, catMen.id, "Frame only, titanium", undefined, 1200, ftTitanium.id);
  const i6 = mk("Bella Frame", "BEL-F-210", "frame", supC.id, catWomen.id, "Frame only, acetate", undefined, 850, ftAcetate.id);

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
    lens_types: [ltWhite, ltBlue, ltPhoto, ltProg],
    frame_types: [ftMetal, ftAcetate, ftTitanium],
    items: [i1, i2, i3, i4, i5, i6],
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
    const parsed = JSON.parse(raw) as Database;
    // Defensive defaults for databases saved before lens types existed.
    return {
      ...parsed,
      lens_types: parsed.lens_types ?? [],
      frame_types: parsed.frame_types ?? [],
      items: (parsed.items ?? []).map((i) => ({ ...i, kind: i.kind ?? "frame_lens" })),
    };
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
