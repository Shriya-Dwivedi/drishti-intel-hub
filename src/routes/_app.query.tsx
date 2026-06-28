import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CaseFileCard } from "@/components/CaseFileCard";
import { api, detectLanguage, LANGUAGES, scriptFontClass, type QueryResult } from "@/services/api";
import { Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/query")({
  head: () => ({ meta: [{ title: "Query console — Drishti" }] }),
  component: QueryConsole,
});

function QueryConsole() {
  const [query, setQuery] = useState("Who is the broker referenced as A.M. and what channels are described?");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const r = await api.submitQuery(query);
    setResult(r);
    setLoading(false);
  }

  const detected = result?.detectedLanguage ?? detectLanguage(query);
  const meta = LANGUAGES.find((l) => l.code === detected)!;

  // Inject citation links into the answer
  const renderAnswer = (answer: string) =>
    answer.split(/(\[\d+\])/g).map((part, i) => {
      const m = part.match(/^\[(\d+)\]$/);
      if (m) return <sup key={i}><a href={`#src-${m[1]}`} className="text-accent font-semibold mx-0.5">[{m[1]}]</a></sup>;
      return <span key={i}>{part}</span>;
    });

  return (
    <>
      <PageHeader eyebrow="Retrieval" title="Query console" description="Ask in any indexed language. The corpus answer is grounded in cited source documents." />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <form onSubmit={run} className="bg-card border border-border rounded-sm p-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className={`w-full bg-transparent text-base resize-none focus:outline-none ${scriptFontClass(detected)}`}
            dir={meta?.script === "arabic" ? "rtl" : "ltr"}
            placeholder="Ask a question — हिन्दी, English, اُردُو, தமிழ், বাংলা…"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-sm border border-border text-muted-foreground uppercase tracking-wider">
                Detected: {meta?.name} · {meta?.native}
              </span>
              <span className="text-muted-foreground">Cross-language retrieval enabled</span>
            </div>
            <button disabled={loading} className="bg-primary text-primary-foreground px-5 py-2 rounded-sm text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching corpus…" : "Run query"}
            </button>
          </div>
        </form>

        {result && (
          <>
            <section className="bg-card border border-border rounded-sm">
              <header className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-accent">Generated answer</div>
                  <div className="text-xs text-muted-foreground">Query {result.id} · {new Date(result.generatedAt).toLocaleString()}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 border border-success/40 text-success rounded-sm">Grounded · {result.sources.length} sources</span>
              </header>
              <div className="p-5 text-[15px] leading-relaxed text-foreground">{renderAnswer(result.answer)}</div>
            </section>

            <section className="space-y-3">
              <h3 className="font-serif text-lg text-primary">Sources</h3>
              <div className="grid gap-3">
                {result.sources.map((s, i) => (
                  <div id={`src-${i + 1}`} key={s.documentId + i}>
                    <CaseFileCard source={s} index={i} />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
