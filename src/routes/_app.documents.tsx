import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, LANGUAGES, scriptFontClass, type DocumentRecord } from "@/services/api";

const ENTITY_COLORS: Record<string, string> = {
  person: "bg-[color:var(--entity-person)]/15 text-[color:var(--entity-person)] border border-[color:var(--entity-person)]/40",
  org: "bg-[color:var(--entity-org)]/15 text-[color:var(--entity-org)] border border-[color:var(--entity-org)]/40",
  location: "bg-[color:var(--entity-location)]/15 text-[color:var(--entity-location)] border border-[color:var(--entity-location)]/40",
  date: "bg-[color:var(--entity-date)]/15 text-[color:var(--entity-date)] border border-[color:var(--entity-date)]/40",
};

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Documents — Drishti" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [lang, setLang] = useState("all");
  const [type, setType] = useState("all");
  const [active, setActive] = useState<DocumentRecord | null>(null);

  useEffect(() => { api.getDocuments().then((d) => { setDocs(d); setActive(d[0]); }); }, []);

  const filtered = useMemo(() => docs.filter((d) => (lang === "all" || d.language === lang) && (type === "all" || d.sourceType === type)), [docs, lang, type]);

  return (
    <>
      <PageHeader eyebrow="Corpus" title="Document explorer" description="Filter and inspect ingested documents with entity annotations." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="bg-card border border-border rounded-sm">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="text-xs border border-border bg-card rounded-sm px-2 py-1.5">
              <option value="all">All languages</option>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name} · {l.native}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="text-xs border border-border bg-card rounded-sm px-2 py-1.5">
              <option value="all">All source types</option>
              {["news", "report", "transcript", "social", "leaked-cable", "academic"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {docs.length}</span>
          </div>
          <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {filtered.map((d) => {
              const meta = LANGUAGES.find((l) => l.code === d.language)!;
              const isActive = active?.id === d.id;
              return (
                <li key={d.id}>
                  <button onClick={() => setActive(d)} className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${isActive ? "bg-muted/70 border-l-2 border-accent" : ""}`}>
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5">{d.id}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm text-foreground truncate ${scriptFontClass(d.language)}`}>{d.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span className="px-1.5 border border-border rounded-sm">{meta.name}</span>
                          <span>· {d.sourceType}</span>
                          <span>· {d.date}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-sm">
          {active ? <DocView doc={active} /> : <div className="p-10 text-center text-muted-foreground">Select a document</div>}
        </div>
      </div>
    </>
  );
}

function DocView({ doc }: { doc: DocumentRecord }) {
  const meta = LANGUAGES.find((l) => l.code === doc.language)!;
  // Synthetic entity overlay
  const tagged: Array<{ text: string; type?: keyof typeof ENTITY_COLORS }> = [
    { text: "Cross-source synthesis identifies " },
    { text: "A. Mehrotra", type: "person" },
    { text: ", a procurement broker, coordinating a Dubai-routed channel referenced in " },
    { text: "Islamabad", type: "location" },
    { text: " meeting minutes on " },
    { text: "5 February 2025", type: "date" },
    { text: ". Vessels held by " },
    { text: "Crescent Maritime LLC", type: "org" },
    { text: " are tied to the same broker, with anomalies first surfaced in case file " },
    { text: "C-204", type: "org" },
    { text: "." },
  ];
  return (
    <article className="p-6 sm:p-8">
      <div className="text-[11px] uppercase tracking-wider text-accent">{doc.id} · {meta.name} · {doc.sourceType}</div>
      <h2 className={`font-serif text-2xl text-primary mt-1 ${scriptFontClass(doc.language)}`}>{doc.title}</h2>
      <div className="text-xs text-muted-foreground mt-1">{doc.pages} pages · captured {doc.date} · ingested {new Date(doc.ingested).toLocaleString()}</div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-muted-foreground uppercase tracking-wider">Entities:</span>
        {(["person", "org", "location", "date"] as const).map((k) => (
          <span key={k} className={`px-2 py-0.5 rounded-sm uppercase tracking-wider ${ENTITY_COLORS[k]}`}>{k}</span>
        ))}
      </div>

      <p className="mt-5 text-[15px] leading-relaxed">
        {tagged.map((t, i) => t.type
          ? <mark key={i} className={`px-1 rounded-sm ${ENTITY_COLORS[t.type]} bg-transparent`}>{t.text}</mark>
          : <span key={i}>{t.text}</span>)}
      </p>
      {doc.excerptOriginal && (
        <p className={`mt-4 text-[15px] leading-relaxed border-l-2 border-accent pl-3 text-foreground/80 ${scriptFontClass(doc.language)}`}
           dir={meta.script === "arabic" ? "rtl" : "ltr"}>
          {doc.excerptOriginal}
        </p>
      )}
    </article>
  );
}
