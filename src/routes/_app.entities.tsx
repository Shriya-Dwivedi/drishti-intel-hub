import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api, type Edge, type Entity } from "@/services/api";

const TYPE_COLOR: Record<Entity["type"], string> = {
  person: "var(--entity-person)",
  org: "var(--entity-org)",
  location: "var(--entity-location)",
  date: "var(--entity-date)",
};

export const Route = createFileRoute("/_app/entities")({
  head: () => ({ meta: [{ title: "Entities — Drishti" }] }),
  component: EntitiesPage,
});

function EntitiesPage() {
  const [data, setData] = useState<{ entities: Entity[]; edges: Edge[] } | null>(null);
  const [active, setActive] = useState<Entity | null>(null);

  useEffect(() => { api.getEntities().then((d) => { setData(d); setActive(d.entities[0] ?? null); }); }, []);

  if (!data) return null;

  const cx = 400, cy = 380, r = 300;
  const n = data.entities.length || 1;
  const pos = new Map(data.entities.map((e, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [e.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, angle: a }] as const;
  }));

  // Only show the strongest edges to reduce clutter (top 20 by weight, or all if fewer)
  const visibleEdges = [...data.edges].sort((a, b) => b.weight - a.weight).slice(0, 20);

  return (
    <>
      <PageHeader eyebrow="Network" title="Entities & relationships" description="Co-occurrence graph derived from the ingested corpus." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-card border border-border rounded-sm p-2 overflow-auto">
          <svg viewBox="0 0 800 760" className="w-full h-auto" style={{ minWidth: 600 }}>
            {visibleEdges.map((e, i) => {
  const a = pos.get(e.from), b = pos.get(e.to);
  if (!a || !b) return null;
  const isConnectedToActive = active && (e.from === active.id || e.to === active.id);
  return (
    <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke="currentColor"
      strokeOpacity={isConnectedToActive ? 0.6 : 0.06}
      strokeWidth={isConnectedToActive ? 2 : 1}
      className={isConnectedToActive ? "text-accent" : "text-primary"} />
  );
})}
            {data.entities.map((e) => {
              const p = pos.get(e.id)!;
              const isActive = active?.id === e.id;
              // Alternate label above/below/side based on angle to reduce overlap
              const labelDx = Math.cos(p.angle) * 14;
              const labelDy = Math.sin(p.angle) >= 0 ? 34 : -22;
              const anchor = Math.cos(p.angle) > 0.3 ? "start" : Math.cos(p.angle) < -0.3 ? "end" : "middle";
              return (
                <g key={e.id} className="cursor-pointer" onClick={() => setActive(e)}>
                  <circle cx={p.x} cy={p.y} r={isActive ? 16 : 10 + Math.min(6, e.mentions)} fill={`color-mix(in oklab, ${TYPE_COLOR[e.type]} 30%, transparent)`} stroke={TYPE_COLOR[e.type]} strokeWidth={isActive ? 2.5 : 1.5} />
                  <text x={p.x + labelDx} y={p.y + labelDy} textAnchor={anchor} fontSize="10" className="fill-foreground font-medium">
                    {e.name.length > 24 ? e.name.slice(0, 22) + "…" : e.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="px-3 pb-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-wider">
            {(["person", "org", "location", "date"] as const).map((t) => (
              <span key={t} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />{t}</span>
            ))}
          </div>
        </div>

        <aside className="bg-card border border-border rounded-sm p-5">
          {active && (
            <>
              <div className="text-[11px] uppercase tracking-wider text-accent">{active.type}</div>
              <h3 className="font-serif text-2xl text-primary mt-1">{active.name}</h3>
              <div className="text-xs text-muted-foreground mt-1">{active.mentions} mentions across corpus</div>
              {active.aliases && <div className="mt-3 text-sm"><span className="text-muted-foreground text-xs uppercase tracking-wider">Aliases · </span>{active.aliases.join(", ")}</div>}
              {active.summary && <p className="mt-3 text-sm leading-relaxed">{active.summary}</p>}
              <div className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">Connected to</div>
              <ul className="mt-2 space-y-1.5 max-h-64 overflow-auto">
                {data.edges.filter((e) => e.from === active.id || e.to === active.id).map((e, i) => {
                  const other = data.entities.find((x) => x.id === (e.from === active.id ? e.to : e.from));
                  if (!other) return null;
                  return <li key={i} className="flex items-center justify-between text-sm border-b border-border/60 pb-1">
                    <span><span className="h-2 w-2 rounded-full inline-block mr-2" style={{ background: TYPE_COLOR[other.type] }} />{other.name}</span>
                    <span className="text-xs text-muted-foreground">co-occurs · {e.weight}</span>
                  </li>;
                })}
              </ul>
            </>
          )}
        </aside>
      </div>
    </>
  );
}