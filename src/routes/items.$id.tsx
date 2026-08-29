import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { eyeLabel, formatPrice, rangeLabel } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/items/$id")({
  head: () => ({
    meta: [
      { title: "Item Details — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Full frame details with every available size and its fixed price.",
      },
      { property: "og:title", content: "Item Details — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Full frame details with every available size and its fixed price.",
      },
    ],
  }),
  component: ItemDetails,
});

function ItemDetails() {
  const { id } = Route.useParams();
  const { db, deleteItem } = useApp();
  const navigate = useNavigate();

  const item = db.items.find((i) => i.id === id);

  if (!item) {
    return (
      <AppShell title="Item not found">
        <div className="card-elevated p-12 text-center">
          <p className="text-muted-foreground">This item no longer exists.</p>
          <Button asChild className="mt-4">
            <Link to="/items">Back to search</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const sizes = db.sizes
    .filter((s) => s.item_id === item.id)
    .sort((a, b) => (a.eye === b.eye ? a.sph_min - b.sph_min : a.eye < b.eye ? -1 : 1));
  const supplier = db.suppliers.find((s) => s.id === item.supplier_id)?.name ?? "—";
  const category = db.categories.find((c) => c.id === item.customer_category_id)?.name ?? "—";

  return (
    <AppShell title={item.name} description={`Item code ${item.sku}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link to="/items">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to search
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/add-item" search={{ id: item.id }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit item
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  {item.name} and all of its size/price records will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteItem(item.id);
                    toast.success("Item deleted");
                    navigate({ to: "/items" });
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="card-elevated overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.name} className="h-80 w-full bg-muted object-cover" />
          ) : (
            <ImagePlaceholder className="h-80 w-full" />
          )}
          <dl className="space-y-3 p-6 text-sm">
            <Row label="Item name" value={item.name} />
            <Row label="Item code" value={item.sku} />
            {item.main_type ? (
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">النوع الرئيسي (MAIN TYPE)</dt>
                <dd className="text-right font-bold text-sky-400">{item.main_type}</dd>
              </div>
            ) : null}
            {item.second_type ? (
              <div className="flex justify-between gap-4 border-b border-border pb-2">
                <dt className="text-muted-foreground">النوع الفرعي (SECOND TYPE)</dt>
                <dd className="text-right font-bold text-emerald-400">{item.second_type}</dd>
              </div>
            ) : null}
            <Row label="Supplier / Company" value={supplier} />
            <Row label="Customer category" value={category} />
            <Row label="Date added" value={new Date(item.created_at).toLocaleDateString()} />
            <div>
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap">{item.notes || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold">Lens Powers &amp; Prices</h2>
          <p className="text-sm text-muted-foreground">
            Every row covers a range of powers. A prescription is priced by the row its SPH and CYL
            fall into.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sizes.map((s) => {
              const rowLensType =
                db.lens_types.find((l) => l.id === (s.lens_type_id ?? item.lens_type_id))?.name ??
                null;
              return (
                <div key={s.id} className="rounded-xl border border-border bg-muted/40 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={s.eye === "L" ? "secondary" : "default"} className="text-sm">
                      {eyeLabel(s.eye)}
                    </Badge>
                    {rowLensType ? (
                      <Badge variant="outline" className="text-sm">
                        {rowLensType}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm tabular-nums text-muted-foreground">{rangeLabel(s)}</p>
                  <p className="mt-1 text-3xl font-bold text-price">{formatPrice(s.price)}</p>
                  {s.note ? <p className="mt-1 text-xs text-muted-foreground">{s.note}</p> : null}
                </div>
              );
            })}
            {sizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lens powers recorded.</p>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
