import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Database, Search, Network, Briefcase, Upload, Settings, LogOut, Globe2 } from "lucide-react";
import { LANGUAGES } from "@/services/api";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Database },
  { to: "/query", label: "Query console", icon: Search },
  { to: "/documents", label: "Documents", icon: Briefcase },
  { to: "/entities", label: "Entities", icon: Network },
  { to: "/cases", label: "Cases", icon: ShieldCheck },
  { to: "/admin", label: "Ingestion", icon: Upload },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [uiLang, setUiLang] = useState("en");
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="h-1 tricolor-strip" aria-hidden />
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <RadarMark className="h-8 w-8 text-accent" />
            <div className="leading-tight">
              <div className="font-serif text-xl tracking-wide">Drishti</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">Analyst workbench</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1 ml-6">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                  className={`px-3 py-2 text-sm rounded-sm flex items-center gap-2 transition-colors ${active ? "bg-accent text-accent-foreground" : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/5"}`}>
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <select
              aria-label="Interface language"
              value={uiLang}
              onChange={(e) => setUiLang(e.target.value)}
              className="bg-white/5 border border-white/15 text-primary-foreground text-xs rounded-sm px-2 py-1.5 focus:bg-white/10"
            >
              <option value="en" className="text-foreground">EN — English</option>
              <option value="hi" className="text-foreground">HI — हिन्दी</option>
            </select>
            <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Link>
            <button onClick={() => setOpen((v) => !v)} className="md:hidden text-primary-foreground/80 text-sm border border-white/20 rounded-sm px-2 py-1">Menu</button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-white/10 px-4 py-2 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-white/5">
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5" />
            <span>Multilingual coverage: {LANGUAGES.length} Indian languages indexed</span>
          </div>
          <span className="inline-flex items-center gap-2 px-2.5 py-1 border border-accent/40 text-accent rounded-sm uppercase tracking-wider">
            Academic prototype — NTCC project
          </span>
        </div>
      </footer>
    </div>
  );
}

export function RadarMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="16" y1="16" x2="28" y2="10" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
