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

  useEffect(() => { api.getEntities().then((d) => { setData(d); setActive(d.entities[0]); }); }, []);

  if (!data) return null;

  // Polygon layout
  const cx = 320, cy = 260, r = 200;
  const pos = new Map(data.entities.map((e, i) => {
    const a = (i / data.entities.length) * Math.PI * 2 - Math.PI / 2;
    return [e.id, { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }] as const;
  }));

  return (
    <>
      <PageHeader eyebrow="Network" title="Entities & relationships" description="Co-occurrence graph derived from the ingested corpus." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="bg-card border border-border rounded-sm p-2">
          <svg viewBox="0 0 640 520" className="w-full h-auto">
            {data.edges.map((e, i) => {
              const a = pos.get(e.from)!, b = pos.get(e.to)!;
              return (
                <g key={i}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeOpacity={0.15 + e.weight * 0.08} strokeWidth={1 + e.weight * 0.4} className="text-primary" />
                  {e.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{e.label}</text>}
                </g>
              );
            })}
            {data.entities.map((e) => {
              const p = pos.get(e.id)!;
              const isActive = active?.id === e.id;
              return (
                <g key={e.id} className="cursor-pointer" onClick={() => setActive(e)}>
                  <circle cx={p.x} cy={p.y} r={isActive ? 18 : 12 + Math.min(8, e.mentions / 2)} fill={`color-mix(in oklab, ${TYPE_COLOR[e.type]} 30%, transparent)`} stroke={TYPE_COLOR[e.type]} strokeWidth={isActive ? 2.5 : 1.5} />
                  <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize="11" className="fill-foreground font-medium">{e.name}</text>
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
              <ul className="mt-2 space-y-1.5">
                {data.edges.filter((e) => e.from === active.id || e.to === active.id).map((e, i) => {
                  const other = data.entities.find((x) => x.id === (e.from === active.id ? e.to : e.from))!;
                  return <li key={i} className="flex items-center justify-between text-sm border-b border-border/60 pb-1">
                    <span><span className="h-2 w-2 rounded-full inline-block mr-2" style={{ background: TYPE_COLOR[other.type] }} />{other.name}</span>
                    <span className="text-xs text-muted-foreground">{e.label ?? "co-occurs"} · {e.weight}</span>
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
