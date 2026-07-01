import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, type CaseRecord } from "@/services/api";
import { FileDown, Plus, CheckCircle2, X } from "lucide-react";

export const Route = createFileRoute("/_app/cases")({
  head: () => ({ meta: [{ title: "Cases — Drishti" }] }),
  component: CasesPage,
});

function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [active, setActive] = useState<CaseRecord | null>(null);
  const [exported, setExported] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<"open" | "review" | "closed">("open");
  const [summary, setSummary] = useState("");

  const loadCases = () => {
    api.getCases().then((c) => { setCases(c); if (c.length) setActive(c[0]); });
  };

  useEffect(() => { loadCases(); }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: CaseRecord = {
      id: "C-" + Math.floor(1000 + Math.random() * 9000),
      title,
      status,
      owner,
      updated: new Date().toISOString().slice(0, 10),
      summary,
      queries: [],
      findings: [],
    };
    await api.createCase(newCase);
    setTitle(""); setOwner(""); setSummary(""); setStatus("open");
    setShowForm(false);
    loadCases();
  };

  return (
    <>
      <PageHeader eyebrow="Workspace" title="Case files"
        actions={
          <button onClick={() => setShowForm(true)} className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-sm inline-flex items-center gap-1.5 hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> New case
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleCreateCase} className="bg-card border border-border rounded-sm p-6 w-full max-w-md space-y-4 relative">
            <button type="button" onClick={() => setShowForm(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-serif text-lg text-primary">New case</h3>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 border border-border rounded-sm px-3 py-2 text-sm bg-background" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Owner</label>
              <input required value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full mt-1 border border-border rounded-sm px-3 py-2 text-sm bg-background" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full mt-1 border border-border rounded-sm px-3 py-2 text-sm bg-background">
                <option value="open">Open</option>
                <option value="review">Review</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Summary</label>
              <textarea required value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full mt-1 border border-border rounded-sm px-3 py-2 text-sm bg-background" rows={3} />
            </div>

            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-sm text-sm hover:bg-primary/90">
              Create case
            </button>
          </form>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_2fr] gap-6">
        <ul className="space-y-2">
          {cases.length === 0 && <li className="text-sm text-muted-foreground italic">No cases yet. Click "New case" to create one.</li>}
          {cases.map((c) => (
            <li key={c.id}>
              <button onClick={() => { setActive(c); setExported(false); }} className={`w-full text-left bg-card border rounded-sm p-4 corner-notch ${active?.id === c.id ? "border-accent" : "border-border hover:border-accent/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${c.status === "open" ? "border-accent/50 text-accent" : c.status === "review" ? "border-primary/40 text-primary" : "border-success/40 text-success"}`}>{c.status}</span>
                </div>
                <div className="mt-1 font-serif text-base text-primary">{c.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{c.owner} · updated {c.updated}</div>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <article className="bg-card border border-border rounded-sm p-6 corner-notch">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-accent">{active.id} · {active.status}</div>
                <h2 className="font-serif text-2xl text-primary mt-1">{active.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{active.owner} · updated {active.updated}</p>
              </div>
              <button onClick={() => setExported(true)} className="text-xs bg-primary text-primary-foreground px-3 py-2 rounded-sm inline-flex items-center gap-2 hover:bg-primary/90">
                {exported ? <><CheckCircle2 className="h-3.5 w-3.5" /> Brief.pdf generated</> : <><FileDown className="h-3.5 w-3.5" /> Export as brief</>}
              </button>
            </div>
            <p className="mt-5 text-[15px] leading-relaxed">{active.summary}</p>

            <section className="mt-6">
              <h3 className="font-serif text-lg text-primary">Findings</h3>
              <ul className="mt-2 space-y-2">
                {active.findings.length === 0 && <li className="text-sm text-muted-foreground italic">No findings recorded yet.</li>}
                {active.findings.map((f, i) => (
                  <li key={i} className="text-sm flex gap-3"><span className="font-mono text-xs text-muted-foreground mt-0.5">F.{i + 1}</span><span>{f}</span></li>
                ))}
              </ul>
            </section>

            <section className="mt-6">
              <h3 className="font-serif text-lg text-primary">Attached queries</h3>
              {active.queries.length === 0
                ? <p className="text-sm text-muted-foreground italic mt-2">No queries attached.</p>
                : <ul className="mt-2 space-y-2">{active.queries.map((q) => (
                    <li key={q} className="text-sm border border-border rounded-sm px-3 py-2 bg-paper flex items-center justify-between">
                      <span className="font-mono text-xs">{q}</span>
                      <span className="text-xs text-muted-foreground">3 sources · 1 verified</span>
                    </li>
                  ))}</ul>}
            </section>
          </article>
        )}
      </div>
    </>
  );
}