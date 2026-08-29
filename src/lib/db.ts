import type { Database, Eye, EyeScope, ItemSize, ProductKind } from "./types";

const STORAGE_KEY = "optic-catalog-db-v4";

export const hashPassword = (pw: string) => {
  try {
    if (typeof btoa === "function") return btoa(`optic::${pw}`);
  } catch {
    // fallback
  }
  return `optic::${pw}`;
};

let uidCounter = 0;
export const uid = () =>
  `${Date.now().toString(36)}-${(uidCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const now = () => new Date().toISOString();

/** Formats a prescription value the way an eye report does: +6.00 / -1.00 / 0.00 */
export const formatDiopter = (n: number | null | undefined) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return "0.00";
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)}`;
};

/** Price lists write 0.00 as "PL" (plano). */
export const diopterLabel = (n: number | null | undefined) => (n === 0 ? "PL" : formatDiopter(n));

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

type RangeLike = {
  sph_min?: number;
  sph_max?: number;
  cyl_min?: number;
  cyl_max?: number;
};

const span = (min: number | undefined, max: number | undefined) => {
  const safeMin = typeof min === "number" && Number.isFinite(min) ? min : 0;
  const safeMax = typeof max === "number" && Number.isFinite(max) ? max : 0;
  return safeMin === safeMax
    ? diopterLabel(safeMin)
    : `${diopterLabel(safeMin)} → ${diopterLabel(safeMax)}`;
};

/** "SPH PL → -6.00 · CYL 0.00 → -2.00" */
export const rangeLabel = (s: RangeLike) =>
  `SPH ${span(s.sph_min, s.sph_max)} · CYL ${span(s.cyl_min, s.cyl_max)}`;

export const lensLabel = (s: RangeLike & { eye: EyeScope }) =>
  `${eyeShort(s.eye)} · ${rangeLabel(s)}`;

/** True when a requested power falls inside the row's range (order-independent). */
export const inRange = (value: number, a: number, b: number, tolerance = 0) => {
  const safeA = typeof a === "number" && Number.isFinite(a) ? a : 0;
  const safeB = typeof b === "number" && Number.isFinite(b) ? b : 0;
  return value >= Math.min(safeA, safeB) - tolerance && value <= Math.max(safeA, safeB) + tolerance;
};

export const rowMatches = (
  row: RangeLike & { eye: EyeScope },
  q: { sph?: number | null; cyl?: number | null; eye?: "all" | Eye },
  tolerance = 0,
) => {
  if (q.eye && q.eye !== "all" && row.eye !== "B" && row.eye !== q.eye) return false;
  const sphMin = row.sph_min ?? 0;
  const sphMax = row.sph_max ?? 0;
  const cylMin = row.cyl_min ?? 0;
  const cylMax = row.cyl_max ?? 0;
  if (q.sph !== null && q.sph !== undefined && !inRange(q.sph, sphMin, sphMax, tolerance))
    return false;
  if (q.cyl !== null && q.cyl !== undefined && !inRange(q.cyl, cylMin, cylMax, tolerance))
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

export const formatPrice = (n: number | null | undefined, currency = "EGP") => {
  if (n === null || n === undefined || !Number.isFinite(n)) return `0 ${currency}`;
  return `${Math.round(n).toLocaleString()} ${currency}`;
};

export const PRESET_MAIN_TYPES_DEFINITIONS: MainTypeDefinition[] = [
  {
    id: "mt-white-65m",
    name: "بلاستيك أبيض 65M",
    description: "العدسات البيضاء القياسية مقاس 65M بجميع معاملات الانكسار",
    second_types: [
      "1.56 ستوك",
      "1.56 بلس",
      "1.56 سفير عالي",
      "1.60 مضغوط",
      "1.67 فائق الضغط",
      "65M ستوك",
    ],
  },
  {
    id: "mt-pal-white",
    name: "بالستين أبيض",
    description: "بالستين أبيض عالي النقاوة وكوداك وبلاتنيوم",
    second_types: [
      "1.56 ستوك",
      "1.56 بلس",
      "1.56 سفير عالي",
      "1.60 كوداك",
      "1.67 بلاتنيوم",
      "1.74 فائق الرقة",
    ],
  },
  {
    id: "mt-pal-green",
    name: "بالستين أخضر",
    description: "عدسات بالستين ريفلكشن أخضر وسكوير إيطالي",
    second_types: ["1.56 ستوك", "1.56 سكوير إيطالي", "1.60 داجاس كوري", "1.67 بلاتنيوم", "1.74"],
  },
  {
    id: "mt-bluecut",
    name: "بلوكت",
    description: "حماية كاملة من الضوء الأزرق والشاشات الرقمية",
    second_types: [
      "1.56 سكوير صيني",
      "1.56 إيطالي عالي النقاء",
      "1.60 داجاس كوري",
      "1.67 بلاتنيوم ياباني",
      "1.74 فائق الرقة",
    ],
  },
  {
    id: "mt-photo-pal",
    name: "فوتوجراي بالستين",
    description: "عدسات فوتو سريعة التفاعل مع أشعة الشمس",
    second_types: ["1.56 ستوك", "1.56 سريع التفاعل Fast Darkening", "1.60 كوداك", "1.67 بلاتنيوم"],
  },
  {
    id: "mt-photo-blue",
    name: "فوتوجراي بلوكت",
    description: "دمج حماية الشاشات وحماية الشمس الذكية",
    second_types: ["1.56 دمج حماية شاشات وشمس", "1.60 مضغوط", "1.67 بلاتنيوم"],
  },
  {
    id: "mt-night-drive",
    name: "قيادة ليلية",
    description: "مانع وهج أصفر فوسفوري مخصص للقيادة الليلية",
    second_types: ["1.56 مانع وهج أصفر فوسفوري", "1.60 داجاس", "1.67"],
  },
  {
    id: "mt-anti-break",
    name: "مقاوم للكسر",
    description: "بولي كاربونيت وتريكس غير قابل للكسر للنظارات الرياضية وبدون إطار",
    second_types: ["1.59 بولي كاربونيت غير قابل للكسر", "1.56 تريكس Trivex"],
  },
  {
    id: "mt-hi-160",
    name: "مضغوط 1.60",
    description: "عدسات مضغوطة عالية الجودة كوداك وداجاس وسكوير",
    second_types: ["كوداك Kodak", "داجاس Dagas", "سكوير Square"],
  },
  {
    id: "mt-hi-167",
    name: "مضغوط 1.67",
    description: "عدسات رقيقة جداً بلاتنيوم وسيكو",
    second_types: ["بلاتنيوم Platinum", "كوداك Kodak", "سيكو Seiko"],
  },
  {
    id: "mt-hi-174",
    name: "1.74",
    description: "أعلى معامل انكسار وأقصى نحافة ياباني ورودنشتوك",
    second_types: ["بلاتنيوم ياباني", "رودنشتوك Rodenstock"],
  },
  {
    id: "mt-scope-lab",
    name: "تصنيعات سكوب",
    description: "تصنيعات خاصة سنجل فيجن وباي فوكل وبروجريسيف Scope",
    second_types: ["سنجل فيجن تصنيع Scope", "باي فوكل Scope", "بروجريسيف ديجيتال Scope"],
  },
  {
    id: "mt-bifocal",
    name: "باي فوكل",
    description: "عدسات ثنائية البؤرة فلات توب وروند وخفي",
    second_types: [
      "باي فوكل فلات توب Flat Top",
      "باي فوكل روند Round Top",
      "باي فوكل خفي Invisible",
    ],
  },
  {
    id: "mt-nour-lab",
    name: "تصنيعات النور",
    description: "تصنيعات معمل النور عالية الدقة وفري فورم",
    second_types: ["تصنيع معمل النور عالي الدقة", "فري فورم Free Form"],
  },
  {
    id: "mt-contacts",
    name: "العدسات اللاصقة",
    description: "عدسات لاصقة تجميلية وطبية بيلا وديفا وأكيوفيو وكلير",
    second_types: ["بيلا Bella", "ديفا Diva", "أكيوفيو Acuvue", "كلير Clear"],
  },
];

export const PRESET_MAIN_TYPES: string[] = PRESET_MAIN_TYPES_DEFINITIONS.map((m) => m.name);

export const PRESET_SECOND_TYPES_MAP: Record<string, string[]> = Object.fromEntries(
  PRESET_MAIN_TYPES_DEFINITIONS.map((m) => [m.name, m.second_types]),
);

/** Collects all distinct MAIN TYPES from db definitions, items/sizes, and presets */
export function getAllMainTypes(db?: Database | null): string[] {
  const set = new Set<string>();
  if (db?.main_types && db.main_types.length > 0) {
    db.main_types.forEach((m) => {
      if (m.name?.trim()) set.add(m.name.trim());
    });
  } else {
    PRESET_MAIN_TYPES.forEach((m) => set.add(m));
  }

  if (db?.items) {
    db.items.forEach((item) => {
      if (item.main_type?.trim()) set.add(item.main_type.trim());
    });
  }
  if (db?.sizes) {
    db.sizes.forEach((s) => {
      if (s.main_type?.trim()) set.add(s.main_type.trim());
    });
  }
  return Array.from(set);
}

/** Collects all distinct SECOND TYPES for a specific MAIN TYPE from db definitions, items/sizes, and presets */
export function getSecondTypesForMainType(
  db?: Database | null,
  mainType?: string | null,
): string[] {
  const set = new Set<string>();

  if (!mainType || mainType === "all") {
    if (db?.main_types && db.main_types.length > 0) {
      db.main_types.forEach((m) => {
        m.second_types.forEach((st) => set.add(st));
      });
    } else {
      Object.values(PRESET_SECOND_TYPES_MAP).forEach((arr) => arr.forEach((v) => set.add(v)));
    }
    if (db?.items) {
      db.items.forEach((item) => {
        if (item.second_type?.trim()) set.add(item.second_type.trim());
      });
    }
    if (db?.sizes) {
      db.sizes.forEach((s) => {
        if (s.second_type?.trim()) set.add(s.second_type.trim());
      });
    }
    return Array.from(set);
  }

  const trimmed = mainType.trim();

  // 1. Check in db.main_types
  if (db?.main_types && db.main_types.length > 0) {
    const found = db.main_types.find(
      (m) =>
        m.name === trimmed ||
        m.name.toLowerCase() === trimmed.toLowerCase() ||
        trimmed.includes(m.name) ||
        m.name.includes(trimmed),
    );
    if (found) {
      found.second_types.forEach((st) => set.add(st));
    }
  }

  // 2. Check in preset map
  const directMatches = PRESET_SECOND_TYPES_MAP[trimmed];
  if (directMatches) {
    directMatches.forEach((s) => set.add(s));
  } else {
    const key = Object.keys(PRESET_SECOND_TYPES_MAP).find(
      (k) => trimmed.includes(k) || k.includes(trimmed),
    );
    if (key && PRESET_SECOND_TYPES_MAP[key]) {
      PRESET_SECOND_TYPES_MAP[key].forEach((s) => set.add(s));
    }
  }

  // 3. Check in items
  if (db?.items) {
    db.items.forEach((item) => {
      if (
        item.main_type &&
        (item.main_type === trimmed ||
          item.main_type.toLowerCase() === trimmed.toLowerCase() ||
          trimmed.includes(item.main_type) ||
          item.main_type.includes(trimmed))
      ) {
        if (item.second_type?.trim()) set.add(item.second_type.trim());
      }
    });
  }

  // 4. Check in sizes
  if (db?.sizes) {
    db.sizes.forEach((s) => {
      if (
        s.main_type &&
        (s.main_type === trimmed ||
          s.main_type.toLowerCase() === trimmed.toLowerCase() ||
          trimmed.includes(s.main_type) ||
          s.main_type.includes(trimmed))
      ) {
        if (s.second_type?.trim()) set.add(s.second_type.trim());
      }
    });
  }

  return Array.from(set);
}

const SEED_DATE = "2025-01-01T00:00:00.000Z";

export function seed(): Database {
  const supA = {
    id: "sup-vision-optics",
    name: "Vision Optics Co.",
    phone: "0100 111 2233",
    notes: "Frames importer",
    created_at: SEED_DATE,
  };
  const supB = {
    id: "sup-nile-eyewear",
    name: "Nile Eyewear",
    phone: "0122 555 8877",
    notes: "",
    created_at: SEED_DATE,
  };
  const supC = {
    id: "sup-delta-frames",
    name: "Delta Frames",
    phone: "",
    notes: "Local workshop",
    created_at: SEED_DATE,
  };

  const catMen = {
    id: "cat-men",
    name: "Men",
    description: "Frames for men",
    created_at: SEED_DATE,
  };
  const catWomen = {
    id: "cat-women",
    name: "Women",
    description: "Frames for women",
    created_at: SEED_DATE,
  };
  const catKids = {
    id: "cat-kids",
    name: "Kids",
    description: "Children frames",
    created_at: SEED_DATE,
  };
  const catSport = {
    id: "cat-sports",
    name: "Sports",
    description: "Sport and outdoor",
    created_at: SEED_DATE,
  };

  const ltWhite = {
    id: "lt-cr39-white",
    name: "White (CR-39)",
    description: "Standard clear lens",
    created_at: SEED_DATE,
  };
  const ltBlue = {
    id: "lt-blue-cut",
    name: "Blue Cut",
    description: "Blue light filter",
    created_at: SEED_DATE,
  };
  const ltPhoto = {
    id: "lt-photochromic",
    name: "Photochromic",
    description: "Darkens in sunlight",
    created_at: SEED_DATE,
  };
  const ltProg = {
    id: "lt-progressive",
    name: "Progressive",
    description: "Multifocal lens",
    created_at: SEED_DATE,
  };

  const ftMetal = {
    id: "ft-metal",
    name: "Metal",
    description: "Metal frames",
    created_at: SEED_DATE,
  };
  const ftAcetate = {
    id: "ft-acetate",
    name: "Acetate",
    description: "Acetate frames",
    created_at: SEED_DATE,
  };
  const ftTitanium = {
    id: "ft-titanium",
    name: "Titanium",
    description: "Lightweight titanium",
    created_at: SEED_DATE,
  };

  const mk = (
    id: string,
    name: string,
    sku: string,
    kind: ProductKind,
    supplier_id: string,
    customer_category_id: string,
    notes: string,
    lens_type_id?: string,
    price?: number,
    frame_type_id?: string,
    main_type?: string,
    second_type?: string,
  ) => ({
    id,
    name,
    sku,
    kind,
    main_type,
    second_type,
    lens_type_id,
    frame_type_id,
    price,
    supplier_id,
    customer_category_id,
    notes,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  });

  const i1 = mk(
    "item-w65-156",
    "بلاستيك أبيض 65M - 1.56 ستوك",
    "LENS-W65-156",
    "lens",
    supA.id,
    catMen.id,
    "بلاستيك أبيض 65M كوري عالي الوضوح",
    ltWhite.id,
    undefined,
    undefined,
    "بلاستيك أبيض 65M",
    "1.56 ستوك",
  );
  const i2 = mk(
    "item-blu-160",
    "بلوكت Blue Cut - 1.60 داجاس",
    "LENS-BLU-160",
    "lens",
    supB.id,
    catWomen.id,
    "عدسات بلوكت لحماية العين من الشاشات",
    ltBlue.id,
    undefined,
    undefined,
    "بلوكت",
    "1.60 داجاس كوري",
  );
  const i3 = mk(
    "item-pht-156",
    "فوتوجراي بالستين - 1.56 سريع التفاعل",
    "LENS-PHT-156",
    "lens",
    supC.id,
    catKids.id,
    "عدسات فوتوجراي يتغير لونها مع أشعة الشمس",
    ltPhoto.id,
    undefined,
    undefined,
    "فوتوجراي بالستين",
    "1.56 سريع التفاعل Fast Darkening",
  );
  const i4 = mk(
    "item-wht-160",
    "بالستين أبيض - 1.60 كوداك مضغوط",
    "LENS-WHT-160",
    "lens",
    supA.id,
    catSport.id,
    "كوداك أصلي أبيض خفيف الوزن",
    ltWhite.id,
    undefined,
    undefined,
    "بالستين أبيض",
    "1.60 كوداك",
  );
  const i5 = mk(
    "item-met-f100",
    "Metro Frame Titanium",
    "MET-F-100",
    "frame",
    supB.id,
    catMen.id,
    "Frame only, titanium",
    undefined,
    1200,
    ftTitanium.id,
  );
  const i6 = mk(
    "item-bel-f210",
    "Bella Frame Acetate",
    "BEL-F-210",
    "frame",
    supC.id,
    catWomen.id,
    "Frame only, acetate",
    undefined,
    850,
    ftAcetate.id,
  );

  const seedItems: Item[] = [
    i1,
    i2,
    i3,
    i4,
    mk(
      "item-pal-green-156",
      "بالستين أخضر - 1.56 سكوير إيطالي",
      "LENS-GRN-156",
      "lens",
      supB.id,
      catMen.id,
      "ريفلكشن أخضر سكوير إيطالي فائق الوضوح",
      ltWhite.id,
      undefined,
      undefined,
      "بالستين أخضر",
      "1.56 سكوير إيطالي",
    ),
    mk(
      "item-pht-blu-156",
      "فوتوجراي بلوكت - 1.56 2 في 1",
      "LENS-PHTBLU-156",
      "lens",
      supC.id,
      catWomen.id,
      "عدسات فوتو بلوكت لحماية الشاشات والشمس معاً",
      ltPhoto.id,
      undefined,
      undefined,
      "فوتوجراي بلوكت",
      "1.56 دمج حماية شاشات وشمس",
    ),
    mk(
      "item-drv-156",
      "قيادة ليلية - 1.56 مانع وهج",
      "LENS-DRV-156",
      "lens",
      supA.id,
      catSport.id,
      "عدسات صفراء مانعة للتوهج ومخصصة للقيادة الليلية",
      ltWhite.id,
      undefined,
      undefined,
      "قيادة ليلية",
      "1.56 مانع وهج أصفر فوسفوري",
    ),
    mk(
      "item-poly-159",
      "مقاوم للكسر - 1.59 بولي كاربونيت",
      "LENS-POLY-159",
      "lens",
      supB.id,
      catKids.id,
      "بولي كاربونيت ضد الكسر للنظارات الرياضية وبدون إطار",
      ltWhite.id,
      undefined,
      undefined,
      "مقاوم للكسر",
      "1.59 بولي كاربونيت غير قابل للكسر",
    ),
    mk(
      "item-hi-167",
      "مضغوط 1.67 - بلاتنيوم ياباني",
      "LENS-HI-167",
      "lens",
      supA.id,
      catMen.id,
      "عدسات فائقة الرقة 1.67 بلاتنيوم",
      ltWhite.id,
      undefined,
      undefined,
      "مضغوط 1.67",
      "بلاتنيوم Platinum",
    ),
    mk(
      "item-hi-174",
      "1.74 ألترا مضغوط بلاتنيوم",
      "LENS-HI-174",
      "lens",
      supB.id,
      catWomen.id,
      "أقصى درجات النحافة معامل انكسار 1.74",
      ltWhite.id,
      undefined,
      undefined,
      "1.74",
      "بلاتنيوم ياباني",
    ),
    mk(
      "item-bifocal-ft",
      "باي فوكل فلات توب Flat Top",
      "LENS-BIFOCAL-FT",
      "lens",
      supC.id,
      catMen.id,
      "عدسات ثنائية البؤرة للقراءة والمسافات",
      ltProg.id,
      undefined,
      undefined,
      "باي فوكل",
      "باي فوكل فلات توب Flat Top",
    ),
    i5,
    i6,
  ];

  const rawSizes: Array<
    [string, string, EyeScope, number, number, number, number, number, string, string, string?]
  > = [
    ["sz-1", i1.id, "B", 0, -6, 0, -2, 320, "بلاستيك أبيض 65M", "1.56 ستوك", "استوك عادي"],
    ["sz-2", i1.id, "B", 0.25, 4, 0, -2, 380, "بلاستيك أبيض 65M", "1.56 بلس", "درجات بلس خفيفة"],
    [
      "sz-3",
      i1.id,
      "B",
      -6.25,
      -10,
      0,
      -2,
      520,
      "بلاستيك أبيض 65M",
      "1.56 سفير عالي",
      "درجات عالية",
    ],
    ["sz-4", i2.id, "B", 0, -6, 0, -2, 550, "بلوكت", "1.60 داجاس كوري", "كوري أصلي"],
    ["sz-5", i2.id, "B", 0.25, 4, 0, -2, 600, "بلوكت", "1.60 داجاس كوري", "بلس كوري"],
    [
      "sz-6",
      i3.id,
      "B",
      0,
      -6,
      0,
      -2,
      480,
      "فوتوجراي بالستين",
      "1.56 سريع التفاعل Fast Darkening",
      "تفاعل سريع",
    ],
    [
      "sz-7",
      i3.id,
      "B",
      0.25,
      4,
      0,
      -2,
      550,
      "فوتوجراي بالستين",
      "1.56 سريع التفاعل Fast Darkening",
      "بلس تفاعل سريع",
    ],
    ["sz-8", i4.id, "B", 0, -8, 0, -2, 850, "بالستين أبيض", "1.60 كوداك", "كوداك أصلي"],
    [
      "sz-9",
      "item-pal-green-156",
      "B",
      0,
      -6,
      0,
      -2,
      420,
      "بالستين أخضر",
      "1.56 سكوير إيطالي",
      "ريفلكشن أخضر",
    ],
    [
      "sz-10",
      "item-pal-green-156",
      "B",
      0.25,
      4,
      0,
      -2,
      490,
      "بالستين أخضر",
      "1.56 سكوير إيطالي",
      "بلس ريفلكشن أخضر",
    ],
    [
      "sz-11",
      "item-pht-blu-156",
      "B",
      0,
      -6,
      0,
      -2,
      720,
      "فوتوجراي بلوكت",
      "1.56 دمج حماية شاشات وشمس",
      "2*1",
    ],
    [
      "sz-12",
      "item-drv-156",
      "B",
      0,
      -6,
      0,
      -2,
      650,
      "قيادة ليلية",
      "1.56 مانع وهج أصفر فوسفوري",
      "درايفنج",
    ],
    [
      "sz-13",
      "item-poly-159",
      "B",
      0,
      -8,
      0,
      -2,
      780,
      "مقاوم للكسر",
      "1.59 بولي كاربونيت غير قابل للكسر",
      "ضد الكسر",
    ],
    [
      "sz-14",
      "item-hi-167",
      "B",
      -2,
      -10,
      0,
      -2,
      1150,
      "مضغوط 1.67",
      "بلاتنيوم Platinum",
      "مضغوط فائق الرقة",
    ],
    ["sz-15", "item-hi-174", "B", -3, -14, 0, -2, 1950, "1.74", "بلاتنيوم ياباني", "ألترا مضغوط"],
    [
      "sz-16",
      "item-bifocal-ft",
      "B",
      -4,
      4,
      0,
      -2,
      680,
      "باي فوكل",
      "باي فوكل فلات توب Flat Top",
      "Add +1.00 -> +3.50",
    ],
  ];

  const sizes: ItemSize[] = rawSizes.map(
    ([
      id,
      item_id,
      eye,
      sph_min,
      sph_max,
      cyl_min,
      cyl_max,
      price,
      main_type,
      second_type,
      note,
    ]) => ({
      id,
      item_id,
      eye,
      main_type,
      second_type,
      sph_min,
      sph_max,
      cyl_min,
      cyl_max,
      price,
      note,
    }),
  );

  return {
    users: [
      {
        id: "user-admin",
        username: "admin",
        password_hash: hashPassword("admin123"),
        created_at: SEED_DATE,
      },
    ],
    suppliers: [supA, supB, supC],
    categories: [catMen, catWomen, catKids, catSport],
    lens_types: [ltWhite, ltBlue, ltPhoto, ltProg],
    frame_types: [ftMetal, ftAcetate, ftTitanium],
    main_types: PRESET_MAIN_TYPES_DEFINITIONS,
    items: seedItems,
    sizes,
    settings: {
      application_name: "Optical Store Pro — كتالوج البصريات",
      background_mode: "default",
      background_color: "#0f172a",
      theme: "dark",
      currency: "EGP",
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
    const seedData = seed();

    // Ensure all seed items exist if not present
    const existingItemIds = new Set((parsed.items ?? []).map((i) => i.id));
    const combinedItems = [...(parsed.items ?? [])];
    for (const si of seedData.items) {
      if (!existingItemIds.has(si.id)) {
        combinedItems.push(si);
      }
    }

    const itemsMapped = combinedItems.map((i) => {
      let inferredMain = i.main_type;
      let inferredSecond = i.second_type;
      if (!inferredMain) {
        if (i.name.includes("65M") || i.name.includes("بلاستيك أبيض")) {
          inferredMain = "بلاستيك أبيض 65M";
        } else if (i.name.includes("بلوكت") || i.name.includes("Blue")) {
          inferredMain = "بلوكت";
        } else if (i.name.includes("فوتوجراي") || i.name.includes("Photo")) {
          inferredMain = "فوتوجراي بالستين";
        } else if (i.name.includes("أخضر") || i.name.includes("Green")) {
          inferredMain = "بالستين أخضر";
        } else if (i.name.includes("قيادة") || i.name.includes("Drive")) {
          inferredMain = "قيادة ليلية";
        } else if (i.name.includes("كسر") || i.name.includes("بولي")) {
          inferredMain = "مقاوم للكسر";
        } else if (i.name.includes("1.67")) {
          inferredMain = "مضغوط 1.67";
        } else if (i.name.includes("1.74")) {
          inferredMain = "1.74";
        } else if (i.name.includes("باي فوكل") || i.name.includes("bifocal")) {
          inferredMain = "باي فوكل";
        } else if (i.kind === "lens" || i.kind === "frame_lens") {
          inferredMain = "بالستين أبيض";
        }
      }
      if (!inferredSecond) {
        if (i.name.includes("1.56")) inferredSecond = "1.56 ستوك";
        else if (i.name.includes("1.60")) inferredSecond = "1.60 مضغوط";
        else if (i.name.includes("1.67")) inferredSecond = "1.67 فائق الضغط";
        else if (i.name.includes("1.74")) inferredSecond = "بلاتنيوم ياباني";
      }
      return {
        ...i,
        kind: i.kind ?? "frame_lens",
        main_type: inferredMain,
        second_type: inferredSecond,
      };
    });

    const itemMap = new Map(itemsMapped.map((it) => [it.id, it]));

    // Ensure all seed sizes exist
    const existingSizeIds = new Set((parsed.sizes ?? []).map((s) => s.id));
    const combinedSizes = [...(parsed.sizes ?? [])];
    for (const ss of seedData.sizes) {
      if (!existingSizeIds.has(ss.id)) {
        combinedSizes.push(ss);
      }
    }

    const sizesMapped = combinedSizes.map((s: Record<string, unknown>) => {
      const sphVal = typeof s.sph === "number" ? s.sph : 0;
      const cylVal = typeof s.cyl === "number" ? s.cyl : 0;
      const itemId = String(s.item_id || "");
      const parentItem = itemMap.get(itemId);

      return {
        id: typeof s.id === "string" ? s.id : uid(),
        item_id: itemId,
        lens_type_id: typeof s.lens_type_id === "string" ? s.lens_type_id : undefined,
        main_type:
          typeof s.main_type === "string" && s.main_type.trim()
            ? s.main_type
            : parentItem?.main_type,
        second_type:
          typeof s.second_type === "string" && s.second_type.trim()
            ? s.second_type
            : parentItem?.second_type,
        eye: (s.eye === "R" || s.eye === "L" || s.eye === "B" ? s.eye : "B") as EyeScope,
        sph_min: typeof s.sph_min === "number" ? s.sph_min : sphVal,
        sph_max: typeof s.sph_max === "number" ? s.sph_max : sphVal,
        cyl_min: typeof s.cyl_min === "number" ? s.cyl_min : cylVal,
        cyl_max: typeof s.cyl_max === "number" ? s.cyl_max : cylVal,
        price: typeof s.price === "number" ? s.price : 0,
        note: typeof s.note === "string" ? s.note : undefined,
      };
    });

    // Defensive defaults for databases saved before newer fields existed.
    return {
      ...parsed,
      suppliers:
        parsed.suppliers && parsed.suppliers.length > 0 ? parsed.suppliers : seedData.suppliers,
      categories:
        parsed.categories && parsed.categories.length > 0 ? parsed.categories : seedData.categories,
      lens_types:
        parsed.lens_types && parsed.lens_types.length > 0 ? parsed.lens_types : seedData.lens_types,
      frame_types:
        parsed.frame_types && parsed.frame_types.length > 0
          ? parsed.frame_types
          : seedData.frame_types,
      main_types:
        parsed.main_types && parsed.main_types.length > 0
          ? parsed.main_types
          : PRESET_MAIN_TYPES_DEFINITIONS,
      items: itemsMapped,
      sizes: sizesMapped,
      users: parsed.users && parsed.users.length > 0 ? parsed.users : seedData.users,
      settings: {
        application_name: "Optical Store Pro — كتالوج البصريات",
        background_mode: "default",
        background_color: "#0f172a",
        theme: "dark",
        currency: "EGP",
        ...parsed.settings,
      },
      price_updates: parsed.price_updates ?? [],
      invoices: parsed.invoices ?? [],
    };
  } catch {
    return seed();
  }
}

export function saveDb(db: Database) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
