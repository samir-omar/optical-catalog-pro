import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, Rows3, Search, X } from "lucide-react";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { formatPrice } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/items/")({
  head: () => ({
    meta: [
      { title: "Search by Size — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Search glasses by lens size and see the supplier, category and exact price.",
      },
      { property: "og:title", content: "Search by Size — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Search glasses by lens size and see the supplier, category and exact price.",
      },
    ],
  }),
  component: ItemsSearch,
});

function ItemsSearch() {
  const { db } = useApp();
  const [sizeQuery, setSizeQuery] = useState("");
  const [exact, setExact] = useState(true);
  const [text, setText] = useState("");
  const [supplier, setSupplier] = useState("all");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<"cards" | "table">("cards");

  const results = useMemo(() => {
    const q = sizeQuery.trim();
    const t = text.trim().toLowerCase();
    const rows: Array<{
      itemId: string;
      name: string;
      sku: string;
      image?: string;
      size: string;
      price: number;
      supplier: string;
      category: string;
      allSizes: string[];
      created_at: string;
    }> = [];

    for (const item of db.items) {
      if (supplier !== "all" && item.supplier_id !== supplier) continue;
      if (category !== "all" && item.customer_category_id !== category) continue;
      if (t && !(item.name.toLowerCase().includes(t) || item.sku.toLowerCase().includes(t)))
        continue;

      const itemSizes = db.sizes
        .filter((s) => s.item_id === item.id)
        .sort((a, b) => Number(a.size) - Number(b.size));
      const matching = q
        ? itemSizes.filter((s) => (exact ? s.size === q : s.size.includes(q)))
        : itemSizes;
      if (matching.length === 0) continue;

      const supplierName =
        db.suppliers.find((s) => s.id === item.supplier_id)?.name ?? "—";
      const categoryName =
        db.categories.find((c) => c.id === item.customer_category_id)?.name ?? "—";

      for (const m of matching) {
        rows.push({
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          image: item.image,
          size: m.size,
          price: m.price,
          supplier: supplierName,
          category: categoryName,
          allSizes: itemSizes.map((s) => s.size),
          created_at: item.created_at,
        });
      }
    }
    return rows;
  }, [db, sizeQuery, exact, text, supplier, category]);

  return (
    <AppShell title="Items" description="Search the catalog by size">
      <div className="card-elevated p-6">
        <Label htmlFor="size" className="text-sm font-medium">
          Search by Size
        </Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="size"
              inputMode="numeric"
              autoFocus
              value={sizeQuery}
              onChange={(e) => setSizeQuery(e.target.value)}
              placeholder="e.g. 52"
              className="h-14 pl-12 text-lg"
            />
            {sizeQuery ? (
              <button
                type="button"
                onClick={() => setSizeQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear size"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <Button
            type="button"
            variant={exact ? "default" : "outline"}
            className="h-14 px-6"
            onClick={() => setExact((v) => !v)}
          >
            {exact ? "Exact match" : "Partial match"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Item name or code"
          />
          <Select value={supplier} onValueChange={setSupplier}>
            <SelectTrigger>
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suppliers</SelectItem>
              {db.suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Customer category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {db.categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"}
          {sizeQuery ? ` for size ${sizeQuery}` : ""}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={view === "cards" ? "default" : "outline"}
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            <Rows3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="card-elevated mt-4 p-12 text-center text-muted-foreground">
          No glasses found for this search.
        </div>
      ) : view === "cards" ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <Link
              key={`${r.itemId}-${r.size}`}
              to="/items/$id"
              params={{ id: r.itemId }}
              className="card-elevated group overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              {r.image ? (
                <img src={r.image} alt={r.name} className="h-44 w-full bg-muted object-cover" />
              ) : (
                <ImagePlaceholder className="h-44 w-full" />
              )}
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.sku}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-sm">
                    Size {r.size}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-price">{formatPrice(r.price)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1">{r.supplier}</span>
                  <span className="rounded-md bg-muted px-2 py-1">{r.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sizes: {r.allSizes.join(", ")} · Added{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-elevated mt-4 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Available sizes</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={`${r.itemId}-${r.size}-row`}>
                  <TableCell>
                    <Link
                      to="/items/$id"
                      params={{ id: r.itemId }}
                      className="flex items-center gap-3 font-medium hover:text-accent"
                    >
                      {r.image ? (
                        <img
                          src={r.image}
                          alt={r.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <ImagePlaceholder className="h-10 w-10 rounded-md" />
                      )}
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.size}</Badge>
                  </TableCell>
                  <TableCell>{r.supplier}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-muted-foreground">{r.allSizes.join(", ")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold text-price">
                    {formatPrice(r.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
