"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Empty, Spinner, cx, useAsync } from "@/components/ui";
import type { Category, ModuleDef } from "@/modules/types";

type Pub = Omit<ModuleDef, "instructions">;
interface Data { categories: Category[]; modules: Pub[] }

export default function Grow() {
  const { t, low } = useApp(); const { data, loading } = useAsync(() => api<Data>("/api/modules"), []);
  const [q, setQ] = useState(""); const [cat, setCat] = useState<string | null>(null);
  const shown = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return data.modules.filter((m) => (cat ? m.category === cat : true) && (!s || [m.title, m.blurb, ...(m.tags ?? [])].some((x) => x.toLowerCase().includes(s))));
  }, [data, q, cat]);
  if (loading || !data) return <Spinner />;
  const quick = ["breathing", "grounding", "overload", "that_stung", "pre_event", "cp_talk", "low_energy"].map((id) => data.modules.find((m) => m.id === id)).filter(Boolean) as Pub[];
  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-3xl text-brown">{t("grow.title")}</h1>
      <input className="field" type="search" placeholder={t("grow.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("grow.search")} />
      {!q && !cat && (
        <section aria-label="Quick starts"><div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{quick.map((m) => <Link key={m.id} href={`/grow/${m.id}`} className="card flex w-40 shrink-0 flex-col gap-1 p-3 text-brown"><span className="text-2xl">{m.icon}</span><span className="font-semibold leading-tight">{m.title}</span></Link>)}</div></section>
      )}
      {!low && <div className="flex flex-wrap gap-2"><button className={cx("chip", !cat && "on")} onClick={() => setCat(null)}>All</button>{data.categories.map((c) => <button key={c.id} className={cx("chip", cat === c.id && "on")} onClick={() => setCat(cat === c.id ? null : c.id)}>{c.icon} {c.title}</button>)}</div>}
      {!q && !cat ? (
        <div className="grid grid-cols-2 gap-3">{data.categories.map((c) => { const n = data.modules.filter((m) => m.category === c.id).length; return (
          <button key={c.id} onClick={() => setCat(c.id)} className="card p-4 text-left"><span className="text-3xl">{c.icon}</span><span className="serif mt-1 block text-lg leading-tight text-brown">{c.title}</span><span className="mt-1 block text-xs text-brown-soft">{c.blurb}</span><span className="mt-1 block text-xs text-amber-deep">{n} {n === 1 ? "tool" : "tools"}</span></button>
        ); })}</div>
      ) : shown.length ? (
        <ul className="space-y-2">{shown.map((m) => <li key={m.id}><Link href={`/grow/${m.id}`} className="card flex items-center gap-3 p-3"><span className="text-3xl" aria-hidden>{m.icon}</span><span><span className="block font-semibold text-brown">{m.title}</span><span className="text-sm text-brown-soft">{m.blurb}</span></span></Link></li>)}</ul>
      ) : <Empty>Nothing matches that. Try a feeling or a situation, like "interview" or "lonely".</Empty>}
    </div>
  );
}
