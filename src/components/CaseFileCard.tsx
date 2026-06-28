import type { CitationSource } from "@/services/api";
import { LANGUAGES, scriptFontClass } from "@/services/api";
import { useState } from "react";
import { FileText, Eye } from "lucide-react";

export function CaseFileCard({ source, index }: { source: CitationSource; index: number }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const meta = LANGUAGES.find((l) => l.code === source.language)!;
  const verified = source.confidence >= 0.75;
  return (
    <article className="relative bg-card border border-border corner-notch shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] uppercase tracking-wider font-medium ${verified ? "bg-success text-success-foreground" : "bg-accent text-accent-foreground"}`}>
        {verified ? "Verified source" : "Low confidence"}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="font-serif text-accent text-lg leading-none mt-0.5">[{index + 1}]</span>
          <div className="flex-1 min-w-0">
            <h4 className={`font-serif text-base text-primary truncate ${scriptFontClass(source.language)}`}>{source.documentTitle}</h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
              <span>{source.documentId}</span>
              <span>· page {source.page}</span>
              <span className="px-1.5 py-0.5 border border-border rounded-sm normal-case tracking-normal">{meta.name} · {meta.native}</span>
              <span>· confidence {(source.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{source.snippet}</p>
        {source.snippetOriginal && showOriginal && (
          <p className={`mt-2 text-sm text-foreground/80 leading-relaxed border-l-2 border-accent pl-3 ${scriptFontClass(source.language)}`}
             dir={meta.script === "arabic" ? "rtl" : "ltr"}>
            {source.snippetOriginal}
          </p>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <button className="inline-flex items-center gap-1.5 text-primary hover:text-accent">
            <FileText className="h-3.5 w-3.5" /> View full document
          </button>
          {source.snippetOriginal && (
            <button onClick={() => setShowOriginal((v) => !v)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
              <Eye className="h-3.5 w-3.5" /> {showOriginal ? "Hide" : "Show"} original script
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
