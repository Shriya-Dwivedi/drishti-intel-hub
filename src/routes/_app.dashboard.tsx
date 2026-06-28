import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, type CaseRecord, LANGUAGES } from "@/services/api";
import { Search, FileText, ArrowRight, CircleDot } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Drishti" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.getCorpusStats().then(setStats);
    api.getSystemHealth().then(setHealth);
    api.getCases().then(setCases);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Operations overview" title="Workbench dashboard"
        description="Live state of the corpus, ingestion pipeline, and ongoing analyst caseload." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <section className="bg-primary text-primary-foreground rounded-sm overflow-hidden">
          <div className="p-6 sm:p-8 grid lg:grid-cols-[1.4fr_1fr] gap-6 items-end">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-accent">Quick query</div>
              <h2 className="font-serif text-2xl mt-1">Ask the corpus, in any indexed language.</h2>
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); window.location.href = "/query?q=" + encodeURIComponent(q); }}>
                <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/15 rounded-sm px-3">
                  <Search className="h-4 w-4 text-primary-foreground/60" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. broker A.M. — दबई channel ?" className="flex-1 bg-transparent py-2.5 text-sm placeholder:text-primary-foreground/40 focus:outline-none" />
                </div>
                <button className="bg-accent text-accent-foreground px-4 rounded-sm text-sm font-medium hover:bg-accent/90">Run</button>
              </form>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {health?.services?.map((s: any) => (
                <div key={s.name} className="bg-white/5 border border-white/10 px-3 py-2 rounded-sm">
                  <div className="text-[10px] uppercase tracking-wider text-primary-foreground/60">{s.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CircleDot className={`h-3 w-3 ${s.status === "ok" ? "text-success" : "text-accent"}`} />
                    <span className="capitalize">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Documents ingested" value={stats?.documents?.toLocaleString() ?? "—"} sub={`+${stats?.newToday ?? 0} today`} />
          <Stat label="Languages present" value={stats?.languagesPresent ?? "—"} sub={`${LANGUAGES.filter(l => l.tier === "verified").length} verified · ${LANGUAGES.filter(l => l.tier === "supported").length} supported`} />
          <Stat label="Index size" value={`${health?.indexSizeGB ?? "—"} GB`} sub={`Uptime ${health?.uptimeHours ?? 0} h`} />
          <Stat label="Last ingestion" value={stats?.lastIngestion ? new Date(stats.lastIngestion).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"} sub={stats?.lastIngestion ? new Date(stats.lastIngestion).toDateString() : ""} />
        </section>

        <section className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-card border border-border rounded-sm">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="font-serif text-lg text-primary">Active cases</h3>
              <Link to="/cases" className="text-xs text-accent hover:underline inline-flex items-center gap-1">All cases <ArrowRight className="h-3 w-3" /></Link>
            </header>
            <ul className="divide-y divide-border">
              {cases.map((c) => (
                <li key={c.id} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/40">
                  <span className="font-mono text-[11px] text-muted-foreground w-14">{c.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">{c.owner} · updated {c.updated}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${c.status === "open" ? "border-accent/50 text-accent" : c.status === "review" ? "border-primary/40 text-primary" : "border-success/40 text-success"}`}>{c.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card border border-border rounded-sm p-5">
            <h3 className="font-serif text-lg text-primary">Pipeline at a glance</h3>
            <p className="text-xs text-muted-foreground mt-1">Live counts since 00:00 IST.</p>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Queued", 7, "bg-muted"],
                ["OCR in progress", 3, "bg-accent/30"],
                ["Embedding", 4, "bg-primary/30"],
                ["Indexed today", 23, "bg-success/30"],
              ].map(([k, v, c]) => (
                <div key={k as string} className="flex items-center gap-3">
                  <dt className="w-32 text-muted-foreground">{k}</dt>
                  <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
                    <div className={`h-full ${c}`} style={{ width: `${Math.min(100, (v as number) * 4)}%` }} />
                  </div>
                  <dd className="font-mono text-xs w-8 text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <Link to="/admin" className="mt-4 inline-flex items-center gap-1 text-xs text-accent hover:underline">Open ingestion panel <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 corner-notch">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-serif text-3xl text-primary mt-1">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
