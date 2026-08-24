import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, Moon, Sun, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ImagePlaceholder } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Customize application name, logo, background, theme and manage user accounts.",
      },
      { property: "og:title", content: "Settings — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Customize application name, logo, background, theme and manage user accounts.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { db, updateSettings, addUser, updateUser, deleteUser, currentUser } = useApp();
  const s = db.settings;
  const logoRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState(s.application_name);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const readFile = (file: File | undefined, cb: (dataUrl: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <AppShell title="Settings" description="Customize the application">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card-elevated space-y-4 p-6">
          <h2 className="text-lg font-semibold">Application Name</h2>
          <div className="flex gap-3">
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
            <Button
              onClick={() => {
                if (!appName.trim()) {
                  toast.error("Application name cannot be empty.");
                  return;
                }
                updateSettings({ application_name: appName.trim() });
                toast.success("Application name saved");
              }}
            >
              Save
            </Button>
          </div>
        </section>

        <section className="card-elevated space-y-4 p-6">
          <h2 className="text-lg font-semibold">Theme</h2>
          <div className="flex gap-3">
            <Button
              variant={s.theme === "light" ? "default" : "outline"}
              onClick={() => updateSettings({ theme: "light" })}
            >
              <Sun className="mr-2 h-4 w-4" /> Light Mode
            </Button>
            <Button
              variant={s.theme === "dark" ? "default" : "outline"}
              onClick={() => updateSettings({ theme: "dark" })}
            >
              <Moon className="mr-2 h-4 w-4" /> Dark Mode
            </Button>
          </div>
        </section>

        <section className="card-elevated space-y-4 p-6">
          <h2 className="text-lg font-semibold">Application Logo</h2>
          <div className="flex items-center gap-4">
            {s.logo ? (
              <img src={s.logo} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <ImagePlaceholder className="h-20 w-20 rounded-xl" />
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  readFile(e.target.files?.[0], (url) => {
                    updateSettings({ logo: url });
                    toast.success("Logo updated");
                  })
                }
              />
              <Button variant="outline" onClick={() => logoRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" /> Upload logo
              </Button>
              {s.logo ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    updateSettings({ logo: undefined });
                    toast.success("Logo reset");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Reset logo
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card-elevated space-y-4 p-6">
          <h2 className="text-lg font-semibold">Background</h2>
          <div className="flex flex-wrap gap-2">
            {(["default", "color", "image"] as const).map((mode) => (
              <Button
                key={mode}
                variant={s.background_mode === mode ? "default" : "outline"}
                onClick={() => updateSettings({ background_mode: mode })}
                className="capitalize"
              >
                {mode === "default" ? "Default" : mode === "color" ? "Solid color" : "Custom image"}
              </Button>
            ))}
          </div>
          {s.background_mode === "color" ? (
            <div className="flex items-center gap-3">
              <Label htmlFor="bgcolor">Color</Label>
              <input
                id="bgcolor"
                type="color"
                value={s.background_color}
                onChange={(e) => updateSettings({ background_color: e.target.value })}
                className="h-10 w-16 cursor-pointer rounded-md border border-border bg-transparent"
              />
              <span className="text-sm text-muted-foreground">{s.background_color}</span>
            </div>
          ) : null}
          {s.background_mode === "image" ? (
            <div className="flex items-center gap-4">
              {s.background_image ? (
                <img
                  src={s.background_image}
                  alt="Background preview"
                  className="h-20 w-32 rounded-lg object-cover"
                />
              ) : (
                <ImagePlaceholder className="h-20 w-32 rounded-lg" />
              )}
              <input
                ref={bgRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  readFile(e.target.files?.[0], (url) => {
                    updateSettings({ background_image: url });
                    toast.success("Background updated");
                  })
                }
              />
              <Button variant="outline" onClick={() => bgRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" /> Upload background
              </Button>
            </div>
          ) : null}
        </section>

        <section className="card-elevated space-y-4 p-6 xl:col-span-2">
          <h2 className="text-lg font-semibold">Users</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              onClick={() => {
                const err = addUser(newUsername, newPassword);
                if (err) return toast.error(err);
                setNewUsername("");
                setNewPassword("");
                toast.success("User created");
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add user
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {editUserId === u.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                        />
                        <Input
                          type="password"
                          placeholder="New password (optional)"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        {u.username}
                        {u.username === currentUser ? (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        ) : null}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {editUserId === u.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            const err = updateUser(u.id, editUsername, editPassword || undefined);
                            if (err) return toast.error(err);
                            setEditUserId("");
                            setEditPassword("");
                            toast.success("User updated");
                          }}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditUserId("")}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditUserId(u.id);
                            setEditUsername(u.username);
                            setEditPassword("");
                          }}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user {u.username}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This account will no longer be able to sign in.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  const err = deleteUser(u.id);
                                  if (err) toast.error(err);
                                  else toast.success("User deleted");
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </AppShell>
  );
}
