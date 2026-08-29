import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Glasses, Lock, User, Sparkles, ShieldCheck, ArrowRight, Eye } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { AppLogo } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Optical3DCanvas } from "@/components/optical-3d-canvas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — كتالوج البصريات والأسعار" },
      {
        name: "description",
        content: "نظام إدارة وتحديث أسعار العدسات والشنابر الطبية — كتالوج البصريات الذكي.",
      },
      { property: "og:title", content: "Optical Store Pro — تسجيل الدخول" },
      {
        property: "og:description",
        content: "نظام إدارة وتحديث أسعار العدسات والشنابر الطبية — كتالوج البصريات الذكي.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, currentUser, ready, db } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && currentUser) navigate({ to: "/dashboard", replace: true });
  }, [ready, currentUser, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("اسم المستخدم مطلوب.");
    if (!password) return setError("كلمة المرور مطلوبة.");
    setLoading(true);
    const err = login(username, password);
    setLoading(false);
    if (err) return setError(err);
    setError(null);
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr] bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
      {/* 3D Visual & Showcase Section */}
      <div className="relative hidden flex-col justify-between p-10 lg:flex overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/60 border-r border-slate-800">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo className="h-11 w-11 shadow-lg shadow-sky-500/20" />
            <div>
              <span className="text-base font-bold text-slate-100">
                {db.settings.application_name}
              </span>
              <p className="text-[11px] text-sky-400 font-mono">OPTICAL CATALOG PRO 2025</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs px-2.5 py-1"
          >
            <ShieldCheck className="ml-1 h-3.5 w-3.5" /> يعمل محلياً 100% Offline
          </Badge>
        </div>

        {/* 3D Eyewear Model Canvas */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          <div className="w-full h-[320px] max-w-lg">
            <Optical3DCanvas />
          </div>

          <div className="text-center max-w-md space-y-3 mt-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              كل عدسة. كل مقاس. السعر الدقيق فوراً.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              ابحث عن أي مقاس سفير وسلندر، وحدّث قوائم الأسعار من ملفات PDF الموردين واتحاد بصريين
              مصر بنقرة واحدة.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <span>نظام آمن للمحلات والمراكز البصرية</span>
          <span className="font-mono text-sky-400/80">v4.5.0 • Indexed Local DB</span>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-900/40 backdrop-blur-xl">
        <div className="w-full max-w-md space-y-8" dir="rtl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="lg:hidden">
              <AppLogo className="h-14 w-14 mb-2 shadow-xl shadow-sky-500/20" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                تسجيل الدخول
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                أدخل بيانات حسابك للوصول إلى كتالوج الأسعار والمبيعات
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl shadow-black/40"
          >
            {error ? (
              <Alert variant="destructive" className="bg-rose-950/40 border-rose-800 text-rose-200">
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold text-slate-300">
                اسم المستخدم
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  className="pr-9 bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500 h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  className="pr-9 bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold h-11 shadow-lg shadow-sky-600/30 transition-all"
              disabled={loading}
            >
              {loading ? "جاري التحقق..." : "دخول النظام"}
            </Button>

            <div className="rounded-xl bg-slate-950/80 p-3 text-center border border-slate-800/80">
              <p className="text-xs text-slate-400">
                الحساب الافتراضي للتجربة: <strong className="text-sky-300 font-mono">admin</strong>{" "}
                / <strong className="text-sky-300 font-mono">admin123</strong>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
