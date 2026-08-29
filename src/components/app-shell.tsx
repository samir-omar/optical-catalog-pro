import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  Circle,
  Frame,
  Glasses,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Search,
  Settings as SettingsIcon,
  Users,
  UploadCloud,
  Receipt,
  Moon,
  Sun,
  Menu,
  X,
  Languages,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  {
    to: "/dashboard",
    labelKey: "dashboard",
    labelEn: "Dashboard",
    labelAr: "لوحة التحكم",
    icon: LayoutDashboard,
  },
  {
    to: "/items",
    labelKey: "searchCatalog",
    labelEn: "Search & Catalog",
    labelAr: "البحث والكتالوج",
    icon: Search,
    highlight: true,
    badgeAr: "بحث بالنوع والمقاس",
    badgeEn: "Type & Powers",
  },
  {
    to: "/lens-types",
    labelKey: "lensTypes",
    labelEn: "Lens Types (MAIN & SECOND)",
    labelAr: "أنواع العدسات (MAIN & SECOND)",
    icon: Circle,
    badgeAr: "MAIN / SECOND",
    badgeEn: "MAIN / SECOND",
  },
  {
    to: "/price-updates",
    labelKey: "priceUpdates",
    labelEn: "Price Updates",
    labelAr: "تحديث الأسعار",
    icon: UploadCloud,
    badgeAr: "PDF فوري",
    badgeEn: "PDF Auto",
  },
  {
    to: "/add-item",
    labelKey: "addProduct",
    labelEn: "Add Products",
    labelAr: "إضافة صنف",
    icon: PlusSquare,
  },
  {
    to: "/frame-types",
    labelKey: "frameTypes",
    labelEn: "Frame Types",
    labelAr: "أنواع الشنابر",
    icon: Frame,
  },
  {
    to: "/suppliers",
    labelKey: "suppliers",
    labelEn: "Suppliers",
    labelAr: "الموردين والشركات",
    icon: Building2,
  },
  {
    to: "/categories",
    labelKey: "customerGroups",
    labelEn: "Customer Groups",
    labelAr: "فئات العملاء",
    icon: Users,
  },
  {
    to: "/settings",
    labelKey: "settings",
    labelEn: "Settings",
    labelAr: "الإعدادات",
    icon: SettingsIcon,
  },
] as const;

export function AppLogo({ className }: { className?: string }) {
  const { db } = useApp();
  if (db.settings.logo) {
    return (
      <img
        src={db.settings.logo}
        alt={`${db.settings.application_name} logo`}
        className={cn(
          "h-10 w-10 rounded-xl object-cover border border-sky-500/20 shadow-md",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-sky-500/20 border border-sky-400/30",
        className,
      )}
    >
      <Glasses className="h-5 w-5" />
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
  const { db, currentUser, ready, language, toggleLanguage, logout, updateSettings } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAr = language === "ar";

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

  const toggleTheme = () => {
    const nextTheme = db.settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: nextTheme });
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="flex min-h-screen bg-background text-foreground transition-colors duration-200"
      style={style}
    >
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar/95 backdrop-blur-xl text-sidebar-foreground md:flex",
          isAr ? "border-l border-sidebar-border" : "border-r border-sidebar-border",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <AppLogo />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-100">
              {db.settings.application_name}
            </p>
            <p className="text-[11px] text-sky-400 font-medium">
              {isAr ? "نظام إدارة البصريات والأسعار" : "Optical Store Management"}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {NAV.map(({ to, labelEn, labelAr, icon: Icon, highlight, badgeAr, badgeEn }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
            const primaryLabel = isAr ? labelAr : labelEn;
            const secondaryLabel = isAr ? labelEn : labelAr;
            const badge = isAr ? badgeAr : badgeEn;

            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/25 font-semibold"
                    : highlight
                      ? "bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 hover:text-white"
                      : "text-slate-300 hover:bg-sidebar-accent/60 hover:text-slate-100",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-white" : highlight ? "text-sky-400" : "text-slate-400",
                    )}
                  />
                  <div className={cn("flex flex-col truncate", isAr ? "text-right" : "text-left")}>
                    <span className="truncate">{primaryLabel}</span>
                    <span className="text-[10px] opacity-60 leading-none">{secondaryLabel}</span>
                  </div>
                </div>

                {badge && (
                  <Badge
                    variant="outline"
                    className="border-sky-400/40 bg-sky-400/20 text-[10px] px-1.5 py-0 text-sky-200 font-bold shrink-0"
                  >
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Database Status */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div
              className={cn(
                "text-[11px] text-slate-300 min-w-0",
                isAr ? "text-right" : "text-left",
              )}
            >
              <span className="font-semibold block truncate">
                {isAr ? "قاعدة البيانات المحلية" : "Local Secure Database"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isAr ? "Offline Ready (آمنة 100%)" : "100% Offline Ready"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-card/90 px-4 sm:px-6 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-slate-100">
                {title}
              </h1>
              {description ? (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Price Update Link Button */}
            <Link
              to="/price-updates"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-all shadow-sm"
            >
              <UploadCloud className="h-3.5 w-3.5 text-sky-400" />
              {isAr ? "تحديث الأسعار (PDF)" : "Price Updates (PDF)"}
            </Link>

            {/* Language Switcher Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold text-xs px-2.5 h-8.5 gap-1.5 transition-all shadow-sm"
              title={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
            >
              <Languages className="h-3.5 w-3.5 text-sky-400" />
              <span>{isAr ? "English" : "العربية"}</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8.5 w-8.5 text-slate-300 hover:text-white"
              title={isAr ? "تبديل المظهر (Dark / Light)" : "Toggle Theme"}
            >
              {db.settings.theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-sky-400" />
              )}
            </Button>

            {/* User Profile */}
            <div
              className={cn(
                "hidden sm:block border-slate-800",
                isAr ? "border-r pr-3 mr-1 text-right" : "border-l pl-3 ml-1 text-left",
              )}
            >
              <p className="text-xs font-bold leading-tight text-slate-200">{currentUser}</p>
              <p
                className={cn(
                  "text-[10px] text-emerald-400 flex items-center gap-1",
                  isAr ? "justify-end" : "justify-start",
                )}
              >
                <ShieldCheck className="h-3 w-3" /> {isAr ? "متصل" : "Online"}
              </p>
            </div>

            {/* Logout */}
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 text-xs h-8.5"
              onClick={() => {
                logout();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className={cn("h-3.5 w-3.5", isAr ? "ml-1.5" : "mr-1.5")} />
              {isAr ? "خروج" : "Logout"}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
              <div className="flex items-center gap-2">
                <AppLogo className="h-8 w-8" />
                <span className="font-bold text-sm text-slate-100">
                  {db.settings.application_name}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto bg-slate-900/95">
              {NAV.map(({ to, labelEn, labelAr, icon: Icon, badgeAr, badgeEn }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl text-slate-200 hover:bg-slate-800 text-sm font-medium"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-sky-400" />
                    <span>
                      {isAr ? labelAr : labelEn} ({isAr ? labelEn : labelAr})
                    </span>
                  </div>
                  {(isAr ? badgeAr : badgeEn) && (
                    <Badge className="bg-sky-500 text-[10px]">{isAr ? badgeAr : badgeEn}</Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Page Children */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
    >
      <Glasses className="h-8 w-8 opacity-50" />
    </div>
  );
}
