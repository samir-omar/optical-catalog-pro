import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Glasses,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Search,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Items", icon: Search },
  { to: "/add-item", label: "Add Items", icon: PlusSquare },
  { to: "/suppliers", label: "Suppliers", icon: Building2 },
  { to: "/categories", label: "Customers", icon: Users },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppLogo({ className }: { className?: string }) {
  const { db } = useApp();
  if (db.settings.logo) {
    return (
      <img
        src={db.settings.logo}
        alt={`${db.settings.application_name} logo`}
        className={cn("h-10 w-10 rounded-lg object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "brand-gradient flex h-10 w-10 items-center justify-center rounded-lg",
        className,
      )}
    >
      <Glasses className="h-5 w-5 text-primary-foreground" />
    </div>
  );
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { db, currentUser, ready, logout } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !currentUser) navigate({ to: "/", replace: true });
  }, [ready, currentUser, navigate]);

  const bg = db.settings;
  const style =
    bg.background_mode === "color"
      ? { backgroundColor: bg.background_color }
      : bg.background_mode === "image" && bg.background_image
        ? {
            backgroundImage: `url(${bg.background_image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : undefined;

  if (!ready || !currentUser) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex min-h-screen bg-background" style={style}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <AppLogo />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{db.settings.application_name}</p>
            <p className="text-xs opacity-70">Price Catalog</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "opacity-80 hover:bg-sidebar-accent/60 hover:opacity-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs opacity-70">
          Offline local database
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{currentUser}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
    >
      <Glasses className="h-8 w-8 opacity-50" />
    </div>
  );
}
