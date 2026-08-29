import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImagePlus, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import {
  KINDS,
  formatDiopter,
  formatPrice,
  getAllMainTypes,
  getSecondTypesForMainType,
  hasFrame,
  hasLensPowers,
  parseDiopter,
  uid,
} from "@/lib/db";
import type { Eye, ProductKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/add-item")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add Items — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Add glasses with supplier, customer category, image and a price per size.",
      },
      { property: "og:title", content: "Add Items — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Add glasses with supplier, customer category, image and a price per size.",
      },
    ],
  }),
  component: AddItemPage,
});

interface SizeRow {
  id: string;
  eye: Eye;
  sph: number;
  cyl: number;
  price: number;
}

const sortRows = (rows: SizeRow[]) =>
  [...rows].sort((a, b) => (a.eye === b.eye ? a.sph - b.sph : a.eye === "R" ? -1 : 1));

function AddItemPage() {
  const { id: editId } = Route.useSearch();
  const { db, saveItem, deleteItem, saveLensType, saveFrameType } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [itemId, setItemId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<ProductKind | null>(null);
  const [mainType, setMainType] = useState("");
  const [secondType, setSecondType] = useState("");
  const [lensTypeId, setLensTypeId] = useState("");
  const [frameTypeId, setFrameTypeId] = useState("");
  const [framePrice, setFramePrice] = useState("");
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [newEye, setNewEye] = useState<Eye>("R");
  const [newSph, setNewSph] = useState("");
  const [newCyl, setNewCyl] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [draft, setDraft] = useState({ eye: "R" as Eye, sph: "", cyl: "", price: "" });
  const [error, setError] = useState<string | null>(null);
  const withLenses = kind !== null && hasLensPowers(kind);
  const withFrame = kind !== null && hasFrame(kind);

  const allMainTypes = useMemo(() => getAllMainTypes(db), [db]);
  const availableSecondTypes = useMemo(
    () => getSecondTypesForMainType(db, mainType),
    [db, mainType],
  );

  const reset = () => {
    setItemId("");
    setCreatedAt(undefined);
    setName("");
    setSku("");
    setSupplierId("");
    setCategoryId("");
    setNotes("");
    setImage(undefined);
    setKind(null);
    setMainType("");
    setSecondType("");
    setLensTypeId("");
    setFrameTypeId("");
    setFramePrice("");
    setRows([]);
    setError(null);
  };

  useEffect(() => {
    if (!editId) {
      reset();
      return;
    }
    const item = db.items.find((i) => i.id === editId);
    if (!item) return;
    setItemId(item.id);
    setCreatedAt(item.created_at);
    setName(item.name);
    setSku(item.sku);
    setSupplierId(item.supplier_id);
    setCategoryId(item.customer_category_id);
    setNotes(item.notes ?? "");
    setImage(item.image);
    setKind(item.kind ?? "frame_lens");
    setMainType(item.main_type ?? "");
    setSecondType(item.second_type ?? "");
    setLensTypeId(item.lens_type_id ?? "");
    setFrameTypeId(item.frame_type_id ?? "");
    setFramePrice(item.price != null ? String(item.price) : "");
    setRows(
      sortRows(
        db.sizes
          .filter((s) => s.item_id === item.id)
          .map((s) => ({
            id: s.id,
            eye: s.eye === "B" ? "R" : s.eye,
            sph: s.sph_min ?? 0,
            cyl: s.cyl_min ?? 0,
            price: s.price ?? 0,
          })),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const onImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const validateLens = (
    eye: Eye,
    sphRaw: string,
    cylRaw: string,
    priceRaw: string,
    ignoreRowId?: string,
  ) => {
    const sph = parseDiopter(sphRaw);
    const cyl = parseDiopter(cylRaw);
    const price = Number(priceRaw);
    if (sph === null) return { error: "SPH is required (e.g. +6.00)." } as const;
    if (cyl === null) return { error: "CYL is required (e.g. -1.00)." } as const;
    if (rows.some((r) => r.id !== ignoreRowId && r.eye === eye && r.sph === sph && r.cyl === cyl))
      return { error: "This eye already has the same SPH and CYL." } as const;
    if (!Number.isFinite(price) || price <= 0)
      return { error: "Price must be a positive number." } as const;
    return { value: { eye, sph, cyl, price } } as const;
  };

  const addSize = () => {
    const res = validateLens(newEye, newSph, newCyl, newPrice);
    if ("error" in res) return setError(res.error);
    setRows((r) => sortRows([...r, { id: uid(), ...res.value }]));
    setNewSph("");
    setNewCyl("");
    setNewPrice("");
    setError(null);
  };

  const saveRow = (rowId: string) => {
    const res = validateLens(draft.eye, draft.sph, draft.cyl, draft.price, rowId);
    if ("error" in res) return setError(res.error);
    setRows((r) => sortRows(r.map((x) => (x.id === rowId ? { ...x, ...res.value } : x))));
    setEditingRow(null);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind) {
      setError("Choose the product type first.");
      return;
    }
    const err = saveItem(
      {
        id: itemId,
        name,
        sku,
        image,
        kind,
        main_type: mainType || undefined,
        second_type: secondType || undefined,
        lens_type_id: withLenses ? lensTypeId || undefined : undefined,
        frame_type_id: withFrame ? frameTypeId || undefined : undefined,
        price: withLenses ? undefined : Number(framePrice),
        supplier_id: supplierId,
        customer_category_id: categoryId,
        notes,
        created_at: createdAt,
      },
      withLenses
        ? rows.map((r) => ({
            id: r.id,
            item_id: itemId,
            main_type: mainType || undefined,
            second_type: secondType || undefined,
            eye: r.eye,
            sph_min: r.sph,
            sph_max: r.sph,
            cyl_min: r.cyl,
            cyl_max: r.cyl,
            price: r.price,
          }))
        : [],
    );
    if (err) {
      setError(err);
      return;
    }
    toast.success(itemId ? "Item updated" : "Item added");
    if (itemId) {
      navigate({ to: "/items/$id", params: { id: itemId } });
    } else {
      reset();
    }
  };

  return (
    <AppShell
      title={itemId ? "Edit Item" : "Add Items"}
      description="Every size stores its own fixed price"
    >
      <div className="card-elevated p-6">
        <h2 className="text-lg font-semibold">Step 1 — What are you adding?</h2>
        <p className="text-sm text-muted-foreground">
          Choose the product type first, then the rest of the form opens.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                kind === k.value
                  ? "border-accent bg-accent/10 ring-2 ring-accent"
                  : "border-border bg-card"
              }`}
            >
              <span className="block font-semibold">{k.short}</span>
              <span className="block text-xs text-muted-foreground">{k.label}</span>
            </button>
          ))}
        </div>
      </div>

      {kind === null ? (
        <div className="card-elevated mt-6 p-10 text-center text-muted-foreground">
          Select a product type above to continue.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="card-elevated space-y-5 p-6">
            <h2 className="text-lg font-semibold">Basic Information</h2>

            {/* MAIN TYPE AND SECOND TYPE */}
            <div className="rounded-xl border-2 border-sky-500/20 bg-sky-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                <span className="text-xs font-bold text-sky-300">
                  MAIN TYPE & SECOND TYPE (تصنيف النوع الرئيسي والفرعي)
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">
                  النوع الرئيسي (MAIN TYPE)
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={mainType}
                    onValueChange={(val) => {
                      setMainType(val);
                      // If secondType is not in new available, keep or reset
                    }}
                  >
                    <SelectTrigger className="bg-background text-xs">
                      <SelectValue placeholder="اختر النوع الرئيسي (أو اكتبه بالأسفل)" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMainTypes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="أو اكتب نوعاً رئيسياً جديداً (مثلاً: بلاستيك أبيض 65M)"
                  value={mainType}
                  onChange={(e) => setMainType(e.target.value)}
                  className="bg-background text-xs font-medium text-sky-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-300">
                  النوع الفرعي (SECOND TYPE)
                </Label>
                {availableSecondTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pb-1">
                    {availableSecondTypes.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSecondType(st)}
                        className={`rounded px-2 py-0.5 text-[11px] font-medium border ${
                          secondType === st
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="اكتب النوع الفرعي (مثلاً: 1.56 ستوك أو 1.60 داجاس كوري)"
                  value={secondType}
                  onChange={(e) => setSecondType(e.target.value)}
                  className="bg-background text-xs font-medium text-emerald-400"
                />
              </div>
            </div>

            {withLenses ? (
              <TypeField
                label="Lens Type *"
                placeholder="Select lens type"
                newPlaceholder="New lens type name"
                options={db.lens_types}
                value={lensTypeId}
                onChange={setLensTypeId}
                onCreate={(name) => {
                  const id = uid();
                  const err = saveLensType({ id, name });
                  if (err) return err;
                  setLensTypeId(id);
                  return null;
                }}
              />
            ) : null}

            {withFrame ? (
              <TypeField
                label="Frame Type *"
                placeholder="Select frame type"
                newPlaceholder="New frame type name"
                options={db.frame_types}
                value={frameTypeId}
                onChange={setFrameTypeId}
                onCreate={(name) => {
                  const id = uid();
                  const err = saveFrameType({ id, name });
                  if (err) return err;
                  setFrameTypeId(id);
                  return null;
                }}
              />
            ) : null}

            {withLenses ? null : (
              <div className="space-y-2">
                <Label htmlFor="frame-price">Frame Price (EGP) *</Label>
                <Input
                  id="frame-price"
                  inputMode="decimal"
                  value={framePrice}
                  onChange={(e) => setFramePrice(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">Item Code / SKU *</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Supplier / Company *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {db.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Glasses Image</Label>
              <div className="flex items-center gap-4">
                {image ? (
                  <img src={image} alt="Preview" className="h-24 w-32 rounded-lg object-cover" />
                ) : (
                  <ImagePlaceholder className="h-24 w-32 rounded-lg" />
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onImage(e.target.files?.[0])}
                  />
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {image ? "Replace image" : "Upload image"}
                  </Button>
                  {image ? (
                    <Button type="button" variant="ghost" onClick={() => setImage(undefined)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Remove image
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {withLenses ? (
            <div className="card-elevated space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold">Lens Powers and Prices</h2>
                <p className="text-sm text-muted-foreground">
                  Each eye (R / L) gets its own SPH and CYL with a fixed price (e.g. R · SPH +6.00 ·
                  CYL -1.00 → 500 EGP).
                </p>
              </div>

              <div className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-5">
                <Select value={newEye} onValueChange={(v) => setNewEye(v as Eye)}>
                  <SelectTrigger aria-label="Eye">
                    <SelectValue placeholder="Eye" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">R — Right</SelectItem>
                    <SelectItem value="L">L — Left</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="SPH (+6.00)"
                  value={newSph}
                  inputMode="decimal"
                  onChange={(e) => setNewSph(e.target.value)}
                />
                <Input
                  placeholder="CYL (-1.00)"
                  value={newCyl}
                  inputMode="decimal"
                  onChange={(e) => setNewCyl(e.target.value)}
                />
                <Input
                  placeholder="Price in EGP"
                  value={newPrice}
                  inputMode="decimal"
                  onChange={(e) => setNewPrice(e.target.value)}
                />
                <Button type="button" onClick={addSize}>
                  <Plus className="mr-2 h-4 w-4" /> Add lens
                </Button>
              </div>

              {error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eye</TableHead>
                    <TableHead>SPH</TableHead>
                    <TableHead>CYL</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No lens powers added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) =>
                      editingRow === r.id ? (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Select
                              value={draft.eye}
                              onValueChange={(v) => setDraft((d) => ({ ...d, eye: v as Eye }))}
                            >
                              <SelectTrigger aria-label="Eye">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="R">R</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={draft.sph}
                              onChange={(e) => setDraft((d) => ({ ...d, sph: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={draft.cyl}
                              onChange={(e) => setDraft((d) => ({ ...d, cyl: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={draft.price}
                              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" size="sm" onClick={() => saveRow(r.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingRow(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Badge variant={r.eye === "R" ? "default" : "secondary"}>{r.eye}</Badge>
                          </TableCell>
                          <TableCell className="tabular-nums">{formatDiopter(r.sph)}</TableCell>
                          <TableCell className="tabular-nums">{formatDiopter(r.cyl)}</TableCell>
                          <TableCell className="font-semibold text-price">
                            {formatPrice(r.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingRow(r.id);
                                setDraft({
                                  eye: r.eye,
                                  sph: formatDiopter(r.sph),
                                  cyl: formatDiopter(r.cyl),
                                  price: String(r.price),
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}

          <div className="card-elevated space-y-4 p-6 xl:col-span-2">
            {!withLenses && error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button type="submit" size="lg" className="flex-1">
                {itemId ? "Save changes" : "Save item"}
              </Button>
              {itemId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate({ to: "/add-item", search: { id: undefined } })}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      )}

      <div className="card-elevated mt-8 overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold">Manage Items</h2>
          <p className="text-sm text-muted-foreground">{db.items.length} items in the catalog</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {db.items.map((item) => {
              const s = db.sizes.filter((x) => x.item_id === item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link to="/items/$id" params={{ id: item.id }} className="hover:text-accent">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell>
                    {db.suppliers.find((x) => x.id === item.supplier_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {db.categories.find((x) => x.id === item.customer_category_id)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.length}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/add-item" search={{ id: item.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This also deletes all size and price records for this item.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteItem(item.id);
                              if (itemId === item.id) reset();
                              toast.success("Item deleted");
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

function TypeField({
  label,
  placeholder,
  newPlaceholder,
  options,
  value,
  onChange,
  onCreate,
}: {
  label: string;
  placeholder: string;
  newPlaceholder: string;
  options: Array<{ id: string; name: string }>;
  value: string;
  onChange: (v: string) => void;
  onCreate: (name: string) => string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = () => {
    const message = onCreate(draftName);
    if (message) {
      setErr(message);
      return;
    }
    toast.success(`${draftName.trim()} added`);
    setDraftName("");
    setErr(null);
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAdding((a) => !a)}
          aria-label="Add new type"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      {adding ? (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder={newPlaceholder}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
            />
            <Button type="button" onClick={create}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
