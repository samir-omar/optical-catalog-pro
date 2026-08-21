import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Manage the companies and suppliers that provide the optical shop frames.",
      },
      { property: "og:title", content: "Suppliers — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Manage the companies and suppliers that provide the optical shop frames.",
      },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const { db, saveSupplier, deleteSupplier } = useApp();
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditId("");
    setName("");
    setPhone("");
    setNotes("");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = db.suppliers.find((s) => s.id === editId)?.created_at;
    const err = saveSupplier({ id: editId, name, phone, notes, created_at: created });
    if (err) return setError(err);
    toast.success(editId ? "Company updated" : "Company added");
    reset();
  };

  const list = db.suppliers.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <AppShell title="Suppliers" description="Companies you purchase glasses from">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card-elevated h-fit space-y-4 p-6">
          <h2 className="text-lg font-semibold">{editId ? "Edit Company" : "Add Company"}</h2>
          <div className="space-y-2">
            <Label htmlFor="sname">Company Name *</Label>
            <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sphone">Phone</Label>
            <Input id="sphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="snotes">Notes</Label>
            <Textarea id="snotes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> {editId ? "Save changes" : "Add company"}
            </Button>
            {editId ? (
              <Button type="button" variant="outline" onClick={reset}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        <div className="card-elevated overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {db.items.filter((i) => i.supplier_id === s.id).length}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditId(s.id);
                        setName(s.name);
                        setPhone(s.phone ?? "");
                        setNotes(s.notes ?? "");
                        setError(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Companies used by existing items cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const err = deleteSupplier(s.id);
                              if (err) toast.error(err);
                              else toast.success("Company deleted");
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No companies found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
