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

export const Route = createFileRoute("/frame-types")({
  head: () => ({
    meta: [
      { title: "Frame Types — Eyewear Price Catalog" },
      {
        name: "description",
        content:
          "Manage frame types such as metal, acetate and titanium — each one prices differently.",
      },
      { property: "og:title", content: "Frame Types — Eyewear Price Catalog" },
      {
        property: "og:description",
        content:
          "Manage frame types such as metal, acetate and titanium — each one prices differently.",
      },
    ],
  }),
  component: FrameTypesPage,
});

function FrameTypesPage() {
  const { db, saveFrameType, deleteFrameType } = useApp();
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditId("");
    setName("");
    setDescription("");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = db.frame_types.find((l) => l.id === editId)?.created_at;
    const err = saveFrameType({ id: editId, name, description, created_at: created });
    if (err) return setError(err);
    toast.success(editId ? "Frame type updated" : "Frame type added");
    reset();
  };

  const list = db.frame_types.filter((l) =>
    l.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <AppShell title="Frame Types" description="Frame type changes the price of the frame">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="card-elevated tilt-3d h-fit space-y-4 p-6">
          <h2 className="text-lg font-semibold">{editId ? "Edit Frame Type" : "Add Frame Type"}</h2>
          <div className="space-y-2">
            <Label htmlFor="fname">Frame Type Name *</Label>
            <Input
              id="fname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Metal, Acetate, Titanium…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fdesc">Description</Label>
            <Textarea
              id="fdesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="mr-2 h-4 w-4" /> {editId ? "Save changes" : "Add frame type"}
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
                placeholder="Search frame type"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frame type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.description || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {db.items.filter((i) => i.frame_type_id === l.id).length}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditId(l.id);
                        setName(l.name);
                        setDescription(l.description ?? "");
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
                          <AlertDialogTitle>Delete {l.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Frame types used by existing items cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const err = deleteFrameType(l.id);
                              if (err) toast.error(err);
                              else toast.success("Frame type deleted");
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
                    No frame types found.
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
