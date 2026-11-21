"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { useApp } from "./providers";
import { Card, Notice, Scale, cx } from "./ui";
import Link from "next/link";
import type { ModuleDef } from "@/modules/types";

type Pub = Omit<ModuleDef, "instructions">;

export function Flow({ m }: { m: Pub }) {
  const { t } = useApp();
  const steps = m.steps ?? []; const [i, setI] = useState(0); const [a, setA] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [res, setRes] = useState<{ text: string; crisis: boolean } | null>(null); const [err, setErr] = useState(""); const [saved, setSaved] = useState("");

  const run = async () => {
    setBusy(true); setErr("");
    try { setRes(await api<{ text: string; crisis: boolean }>(`/api/modules/${m.id}/flow`, { body: { answers: a } })); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const saveToKit = async (section: string) => {
    const lines = res!.text.split("\n").map((l) => l.replace(/^[-•\d.\s]+/, "").trim()).filter((l) => l.length > 3 && !/^(people you can reach|•)/i.test(l)).slice(0, 4);
    for (const l of lines) await api("/api/kit", { body: { section, text: l } });
    setSaved("Saved to your Low-Day Kit");
  };

  if (res) return (
    <div className="space-y-3 fade-in">
      <Card className={cx("prose-soft text-brown", res.crisis && "!border-amber !bg-[#fff1df]")}><p>{res.text}</p></Card>
      {res.crisis && <Link href="/safe" className="btn btn-primary w-full">{t("safe")}</Link>}
      {!res.crisis && <div className="flex flex-wrap gap-2">
        {m.id === "cp_ifthen" && <button className="btn btn-soft" onClick={() => saveToKit("if_then")}>Save to my Low-Day Kit</button>}
        {m.id === "cp_reasons" && <button className="btn btn-soft" onClick={() => saveToKit("reasons")}>Save as my reasons</button>}
        {m.id === "minimum_day" && <button className="btn btn-soft" onClick={() => saveToKit("reminders")}>Save to my Low-Day Kit</button>}
        {m.id !== "phq9_starter" && <button className="btn btn-soft" onClick={async () => { await api("/api/strengths", { body: { kind: "milestone", text: `Completed: ${m.title}` } }); setSaved("Added to your Strength Archive"); }}>Add to Strength Archive</button>}
        {m.id === "care_prep" && <Link href="/care" className="btn btn-soft">Use for an appointment</Link>}
        <button className="btn btn-ghost" onClick={() => { setRes(null); setI(0); setA({}); setSaved(""); }}>Start again</button>
      </div>}
      {saved && <Notice tone="ok">{saved}</Notice>}
    </div>
  );

  const s = steps[i]; const last = i === steps.length - 1;
  const val = a[s.id] ?? ""; const canNext = s.optional || val.trim().length > 0;
  return (
    <Card className="space-y-4">
      <p className="text-xs text-brown-soft" aria-live="polite">{i + 1} of {steps.length}</p>
      <h2 className="serif text-2xl text-brown">{s.prompt}</h2>
      {s.hint && <p className="text-sm text-brown-soft">{s.hint}</p>}
      {s.type === "text" && <textarea className="field min-h-28" value={val} placeholder={s.placeholder} onChange={(e) => setA({ ...a, [s.id]: e.target.value })} aria-label={s.prompt} />}
      {s.type === "choice" && <div className="space-y-2" role="radiogroup" aria-label={s.prompt}>{s.options!.map((o) => <button key={o} role="radio" aria-checked={val === o} className={cx("btn w-full !justify-start text-left", val === o ? "btn-primary" : "btn-soft")} onClick={() => setA({ ...a, [s.id]: o })}>{o}</button>)}</div>}
      {s.type === "scale" && <Scale label={s.prompt} value={val ? +val : null} onChange={(n) => setA({ ...a, [s.id]: String(n) })} min={s.min ?? 1} max={s.max ?? 5} />}
      {err && <Notice tone="warn"><span role="alert">{err}</span></Notice>}
      <div className="flex gap-2">
        {i > 0 && <button className="btn btn-ghost" onClick={() => setI(i - 1)}>{t("back")}</button>}
        {last ? <button className="btn btn-primary flex-1" disabled={busy || !canNext} onClick={run}>{busy ? "…" : "Done"}</button> : <button className="btn btn-primary flex-1" disabled={!canNext} onClick={() => setI(i + 1)}>{t("continue")}</button>}
      </div>
    </Card>
  );
}
