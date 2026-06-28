import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, LANGUAGES, type AuditEntry, scriptFontClass } from "@/services/api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Drishti" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [uiLang, setUiLang] = useState("en");
  const [queryLang, setQueryLang] = useState("all");
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => { api.getAuditLog().then(setAudit); }, []);

  const verified = LANGUAGES.filter((l) => l.tier === "verified");
  const supported = LANGUAGES.filter((l) => l.tier === "supported");

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <section className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-serif text-lg text-primary">Interface language</h3>
          <p className="text-xs text-muted-foreground mt-1">Controls the UI chrome — independent of query language.</p>
          <div className="mt-3 inline-flex border border-border rounded-sm">
            {[["en", "English"], ["hi", "हिन्दी"]].map(([v, l]) => (
              <button key={v} onClick={() => setUiLang(v as string)} className={`px-4 py-2 text-sm ${uiLang === v ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>{l}</button>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-sm p-6">
          <h3 className="font-serif text-lg text-primary">Query language preference</h3>
          <p className="text-xs text-muted-foreground mt-1">Restrict retrieval scope. Two tiers reflect retrieval quality.</p>
          <select value={queryLang} onChange={(e) => setQueryLang(e.target.value)} className="mt-3 w-full max-w-md bg-card border border-input rounded-sm px-3 py-2 text-sm">
            <option value="all">All languages (auto-detect)</option>
            <optgroup label="Verified">
              {verified.map((l) => <option key={l.code} value={l.code}>{l.name} · {l.native}</option>)}
            </optgroup>
            <optgroup label="Supported">
              {supported.map((l) => <option key={l.code} value={l.code}>{l.name} · {l.native}</option>)}
            </optgroup>
          </select>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Tier title="Verified" tone="success" items={verified} />
            <Tier title="Supported" tone="accent" items={supported} />
          </div>
        </section>

        <section className="bg-card border border-border rounded-sm">
          <header className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-lg text-primary">Audit log</h3>
            <span className="text-xs text-muted-foreground">Past queries · {audit.length} entries</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-paper">
                <tr>
                  <th className="text-left px-5 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium">User</th>
                  <th className="text-left px-3 py-2 font-medium">Role</th>
                  <th className="text-left px-3 py-2 font-medium">Lang</th>
                  <th className="text-left px-3 py-2 font-medium">Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audit.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/40">
                    <td className="px-5 py-2 font-mono text-xs whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs">{a.user}</td>
                    <td className="px-3 py-2 text-xs uppercase">{a.role}</td>
                    <td className="px-3 py-2 text-xs uppercase">{a.language}</td>
                    <td className={`px-3 py-2 ${scriptFontClass(a.language)}`}>{a.query}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function Tier({ title, tone, items }: { title: string; tone: "success" | "accent"; items: { code: string; name: string; native: string }[] }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-paper">
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-base text-primary">{title}</h4>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${tone === "success" ? "border-success/40 text-success" : "border-accent/40 text-accent"}`}>{items.length} languages</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.map((l) => (
          <span key={l.code} className="text-[11px] border border-border bg-card px-2 py-0.5 rounded-sm">{l.name} · {l.native}</span>
        ))}
      </div>
    </div>
  );
}
