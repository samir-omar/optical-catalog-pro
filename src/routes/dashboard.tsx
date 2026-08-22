import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Layers, PlusSquare, Search, Settings, Tags, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Eyewear Price Catalog" },
      {
        name: "description",
        content: "Overview of items, suppliers, customer categories and size price records.",
      },
      { property: "og:title", content: "Dashboard — Eyewear Price Catalog" },
      {
        property: "og:description",
        content: "Overview of items, suppliers, customer categories and size price records.",
      },
    ],
  }),
  component: Dashboard,
});

const CARDS = [
  {
    to: "/items",
    title: "Items",
    text: "Search by eye, SPH and CYL and see prices instantly.",
    icon: Search,
  },
  { to: "/add-item", title: "Add Items", text: "Add and manage glasses with lens powers and prices.", icon: PlusSquare },
  { to: "/categories", title: "Customers", text: "Manage customer categories for frames.", icon: Users },
  { to: "/settings", title: "Settings", text: "Logo, name, background, theme and users.", icon: Settings },
] as const;

function Dashboard() {
  const { db } = useApp();

  const stats = [
    { label: "Total Items", value: db.items.length, icon: Layers },
    { label: "Total Suppliers", value: db.suppliers.length, icon: Building2 },
    { label: "Customer Categories", value: db.categories.length, icon: Tags },
    { label: "Lens Price Records", value: db.sizes.length, icon: Search },
  ];

  return (
    <AppShell title="Dashboard" description="Quick access to the catalog">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-elevated flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {CARDS.map(({ to, title, text, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card-elevated group flex items-start gap-5 p-7 transition-transform hover:-translate-y-0.5"
          >
            <div className="brand-gradient flex h-14 w-14 items-center justify-center rounded-xl text-primary-foreground">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold group-hover:text-accent">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
