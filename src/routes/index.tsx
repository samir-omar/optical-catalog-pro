import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Glasses, Lock, User } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { AppLogo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In — Eyewear Price Catalog" },
      {
        name: "description",
        content:
          "Secure sign in for the optical shop eyewear price catalog: search frames by size and see the exact price.",
      },
      { property: "og:title", content: "Sign In — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Secure sign in for the optical shop eyewear price catalog.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, currentUser, ready, db } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && currentUser) navigate({ to: "/dashboard", replace: true });
  }, [ready, currentUser, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Username is required.");
    if (!password) return setError("Password cannot be empty.");
    const err = login(username, password);
    if (err) return setError(err);
    setError(null);
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="brand-gradient relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Glasses className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold">{db.settings.application_name}</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-semibold leading-tight">
            Every frame. Every size. The exact price.
          </h2>
          <p className="text-primary-foreground/80">
            Type a lens size and instantly get every matching frame with its company, category and
            fixed price for that size.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Works fully offline — local database.</p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <AppLogo className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {db.settings.application_name}
              </h1>
              <p className="text-sm text-muted-foreground">Sign in to continue</p>
            </div>
          </div>

          <form onSubmit={submit} className="card-elevated space-y-5 p-6">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Login
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Default account: admin / admin123
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
