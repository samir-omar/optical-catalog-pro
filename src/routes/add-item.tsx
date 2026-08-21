import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { formatPrice, uid } from "@/lib/db";
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
    id: typeof search.id === "string" ? search.id : undefined,
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
  size: string;
  price: number;
}

function AddItemPage() {
  const { id: editId } = Route.useSearch();
  const { db, saveItem, deleteItem } = useApp();
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
  const [rows, setRows] = useState<SizeRow[]>([]);
  const [newSize, setNewSize] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [draft, setDraft] = useState({ size: "", price: "" });
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setItemId("");
    setCreatedAt(undefined);
    setName("");
    setSku("");
    setSupplierId("");
    setCategoryId("");
    setNotes("");
    setImage(undefined);
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
    setRows(
      db.sizes
        .filter((s) => s.item_id === item.id)
        .sort((a, b) => Number(a.size) - Number(b.size))
        .map((s) => ({ id: s.id, size: s.size, price: s.price })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const onImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addSize = () => {
    const size = newSize.trim();
    const price = Number(newPrice);
    if (!size) return setError("Size is required.");
    if (rows.some((r) => r.size === size)) return setError("This size already exists for the item.");
    if (!Number.isFinite(price) || price <= 0) return setError("Price must be a positive number.");
    setRows((r) => [...r, { id: uid(), size, price }].sort((a, b) => Number(a.size) - Number(b.size)));
    setNewSize("");
    setNewPrice("");
    setError(null);
  };

  const saveRow = (rowId: string) => {
    const size = draft.size.trim();
    const price = Number(draft.price);
    if (!size) return setError("Size is required.");
    if (rows.some((r) => r.id !== rowId && r.size === size))
      return setError("This size already exists for the item.");
    if (!Number.isFinite(price) || price <= 0) return setError("Price must be a positive number.");
    setRows((r) =>
      r
        .map((x) => (x.id === rowId ? { ...x, size, price } : x))
        .sort((a, b) => Number(a.size) - Number(b.size)),
    );
    setEditingRow(null);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = saveItem(
      {
        id: itemId,
        name,
        sku,
        image,
        supplier_id: supplierId,
        customer_category_id: categoryId,
        notes,
        created_at: createdAt,
      },
      rows,
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
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card-elevated space-y-5 p-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

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
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="card-elevated space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Sizes and Prices</h2>
            <p className="text-sm text-muted-foreground">
              Add each size with its own fixed price (e.g. 52 → 550 EGP).
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row">
            <Input
              placeholder="Size (e.g. 52)"
              value={newSize}
              inputMode="numeric"
              onChange={(e) => setNewSize(e.target.value)}
            />
            <Input
              placeholder="Price in EGP"
              value={newPrice}
              inputMode="decimal"
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <Button type="button" onClick={addSize}>
              <Plus className="mr-2 h-4 w-4" /> Add size
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
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No sizes added yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) =>
                  editingRow === r.id ? (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Input
                          value={draft.size}
                          onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
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
                        <Badge variant="secondary">{r.size}</Badge>
                      </TableCell>
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
                            setDraft({ size: r.size, price: String(r.price) });
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" className="flex-1">
              {itemId ? "Save changes" : "Save item"}
            </Button>
            {itemId ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: "/add-item", search: {} })}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </div>
      </form>

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
                    <Link
                      to="/items/$id"
                      params={{ id: item.id }}
                      className="hover:text-accent"
                    >
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
