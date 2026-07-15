import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, type IngestionJob } from "@/services/api";
import { UploadCloud, Loader2 } from "lucide-react";

const STAGES = ["queued", "ocr", "embedding", "indexed"] as const;

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Ingestion — Drishti" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFilenames, setUploadingFilenames] = useState<string[]>([]);

  useEffect(() => {
    api.getIngestionJobs().then(setJobs);
    const interval = setInterval(() => {
      api.getIngestionJobs().then(setJobs);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadingFilenames(files.map((f) => f.name));

    Promise.all(files.map((f) => api.uploadDocument(f)))
      .then((newJobs) => {
        setJobs((j) => [...newJobs, ...j]);
      })
      .catch(() => {
        alert("Upload failed. Please check the backend connection and try again.");
      })
      .finally(() => {
        setUploading(false);
        setUploadingFilenames([]);
      });
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Ingestion pipeline" description="Upload documents and monitor OCR, embedding, and indexing stages." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {uploading && (
          <div className="bg-accent/10 border border-accent/40 rounded-sm p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0" />
            <div>
              <div className="text-sm font-medium text-primary">
                Uploading and processing {uploadingFilenames.length > 1 ? `${uploadingFilenames.length} documents` : uploadingFilenames[0]}…
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Larger documents can take a minute or more (OCR, entity extraction, and indexing all run before this finishes). Please don't close this tab.
              </div>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault(); setDrag(false);
            const files = Array.from(e.dataTransfer.files);
            handleUpload(files);
          }}
          className={`border-2 border-dashed rounded-sm p-10 text-center transition-colors ${drag ? "border-accent bg-accent/5" : "border-border bg-card"} ${uploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="font-serif text-lg text-primary mt-3">Drop documents to ingest</div>
          <p className="text-sm text-muted-foreground mt-1">Supports PDF, DOCX, TIFF, TXT. Multilingual OCR runs automatically.</p>
          <input
            type="file"
            id="file-input"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              handleUpload(files);
              e.target.value = "";
            }}
          />
          <label htmlFor="file-input" className={`mt-4 inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-sm text-sm hover:bg-primary/90 cursor-pointer ${uploading ? "pointer-events-none" : ""}`}>
            {uploading ? "Uploading…" : "Choose files"}
          </label>
        </div>

        <div className="bg-card border border-border rounded-sm">
          <header className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-lg text-primary">Processing queue</h3>
            <span className="text-xs text-muted-foreground">{jobs.length} active</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-paper">
                <tr>
                  <th className="text-left px-5 py-2 font-medium">Job</th>
                  <th className="text-left px-3 py-2 font-medium">Filename</th>
                  <th className="text-left px-3 py-2 font-medium">Lang</th>
                  <th className="text-left px-3 py-2 font-medium">Size</th>
                  <th className="text-left px-3 py-2 font-medium">Stage</th>
                  <th className="text-left px-3 py-2 font-medium w-48">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobs.map((j) => {
                  const stageIdx = STAGES.indexOf(j.stage as any);
                  return (
                    <tr key={j.id} className="hover:bg-muted/40">
                      <td className="px-5 py-3 font-mono text-xs">{j.id}</td>
                      <td className="px-3 py-3 truncate max-w-[260px]">{j.filename}</td>
                      <td className="px-3 py-3 uppercase text-xs">{j.language}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{j.size}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {STAGES.map((s, i) => (
                            <span key={s} className={`px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${i <= stageIdx ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground"}`}>{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${j.progress}%` }} />
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">{j.progress}%</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}