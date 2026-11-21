"use client";
import { useState } from "react";
import Link from "next/link";
import { api, today } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Card, Empty, Notice, Scale, Section, Spinner, cx, useAsync } from "@/components/ui";

const TABS = [["checkin", "Check-in"], ["journal", "Journal"], ["body", "Sleep & body"], ["strengths", "Strengths"], ["growth", "Growth"], ["more", "More"]] as const;
const EMOTIONS = ["calm", "okay", "happy", "hopeful", "tired", "numb", "anxious", "sad", "lonely", "angry", "overwhelmed", "ashamed", "hurt", "stressed", "restless", "content"];
type Tab = (typeof TABS)[number][0];

export default function Reflect() {
  const { t } = useApp(); const [tab, setTab] = useState<Tab>("checkin");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-brown">{t("reflect.title")}</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={cx("chip shrink-0", tab === k && "on")} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "checkin" && <CheckIn />}{tab === "journal" && <Journal />}{tab === "body" && <Body />}{tab === "strengths" && <Strengths />}{tab === "growth" && <Growth />}{tab === "more" && <More />}
    </div>
  );
}

/* ───────── Check-in ───────── */
interface Mood { id: string; createdAt: string; valence: number; energy: number | null; anxiety: number | null; intensity: number | null; emotions: string | null; triggers: string | null; note: string | null }
const FACE = ["", "😞", "😕", "😐", "🙂", "😊"];

function Spark({ items }: { items: Mood[] }) {
  const pts = [...items].reverse().slice(-30);
  if (pts.length < 2) return null;
  const w = 300, h = 60, step = w / (pts.length - 1);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(h - ((p.valence - 1) / 4) * (h - 8) - 4).toFixed(1)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" role="img" aria-label="Your recent check-ins over time"><path d={d} fill="none" stroke="#c47a1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIn() {
  const { t } = useApp(); const list = useAsync(() => api<{ items: Mood[] }>("/api/mood?days=90"), []); const ins = useAsync(() => api<{ observations: string[]; gentleCheckIn: boolean }>("/api/insights"), []);
  const [v, setV] = useState<number | null>(null); const [en, setEn] = useState<number | null>(null); const [em, setEm] = useState<string[]>([]); const [tr, setTr] = useState(""); const [note, setNote] = useState(""); const [more, setMore] = useState(false);
  const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  const save = async () => { if (!v) return; setBusy(true); await api("/api/mood", { body: { valence: v, energy: en, emotions: em.join(", ") || null, triggers: tr || null, note: note || null } }); setSaved(true); setV(null); setEn(null); setEm([]); setTr(""); setNote(""); setBusy(false); list.reload(); ins.reload(); };
  return (
    <div className="space-y-5">
      {ins.data?.gentleCheckIn && <Notice>You've logged a lot of heavy days this week. That's a lot to carry. Your <Link href="/care" className="underline">Low-Day Kit and safety plan</Link> are there if you want them, and a person you trust might like to hear from you.</Notice>}
      <Card className="space-y-4">
        <h2 className="serif text-xl text-brown">{t("mood.how")}</h2>
        <div className="flex justify-between" role="radiogroup" aria-label="Mood">{[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={v === n} onClick={() => setV(n)} className={cx("h-14 w-14 rounded-full text-3xl transition", v === n ? "bg-amber ring-2 ring-brown" : "bg-peach")} aria-label={["Very low", "Low", "Neutral", "Good", "Very good"][n - 1]}>{FACE[n]}</button>)}</div>
        <div><p className="mb-1 text-sm text-brown-soft">What's the feeling closest to? (optional)</p><div className="flex flex-wrap gap-2">{EMOTIONS.map((e) => <button key={e} className={cx("chip", em.includes(e) && "on")} aria-pressed={em.includes(e)} onClick={() => setEm(em.includes(e) ? em.filter((x) => x !== e) : [...em, e])}>{e}</button>)}</div></div>
        <button className="text-sm text-brown-soft underline" onClick={() => setMore(!more)}>{more ? "Less" : "Add more detail"}</button>
        {more && <div className="space-y-3 fade-in"><div><p className="mb-1 text-sm text-brown-soft">Energy</p><Scale label="Energy" value={en} onChange={setEn} labels={["drained", "full"]} /></div>
          <input className="field" placeholder="Anything that set it off? (optional)" value={tr} onChange={(e) => setTr(e.target.value)} aria-label="Triggers" />
          <textarea className="field" placeholder="A few words, if you like" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" /></div>}
        <button className="btn btn-primary w-full" disabled={!v || busy} onClick={save}>{t("mood.save")}</button>
        {saved && <p className="fade-in text-center text-sm text-brown-soft">Saved. Thank you for checking in with yourself.</p>}
      </Card>
      {ins.data && ins.data.observations.length > 0 && <Section title="Patterns I've noticed" hint="From your own check-ins. They're guesses, so tell me if they're off."><div className="space-y-2">{ins.data.observations.map((o, i) => <Card key={i} className="text-brown">{o}</Card>)}</div></Section>}
      <Section title="Recent">{list.loading ? <Spinner /> : !list.data?.items.length ? <Empty>Your check-ins will show up here.</Empty> : <><Spark items={list.data.items} />
        <ul className="mt-2 space-y-2">{list.data.items.slice(0, 8).map((m) => <li key={m.id} className="card flex items-start gap-3 p-3"><span className="text-2xl">{FACE[m.valence]}</span><span className="flex-1 text-sm text-brown"><span className="block text-xs text-brown-soft">{new Date(m.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>{m.emotions}{m.note ? ` — ${m.note}` : ""}</span><button className="text-xs text-brown-soft underline" onClick={async () => { await api(`/api/mood/${m.id}`, { method: "DELETE" }); list.reload(); }}>Delete</button></li>)}</ul></>}</Section>
    </div>
  );
}

/* ───────── Journal ───────── */
interface J { id: string; kind: string; title: string | null; body: string; createdAt: string }
function Journal() {
  const [kind, setKind] = useState("journal"); const list = useAsync(() => api<{ items: J[] }>(`/api/journal?kind=${kind}`), [kind]);
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [open, setOpen] = useState<string | null>(null);
  const kinds = [["journal", "Journal"], ["safe_space", "Safe Space"], ["unsent", "Unsent letters"], ["gratitude", "Gratitude"], ["reflection", "Reflections"], ["wisdom", "Wisdom Library"], ["timeline", "Relationship timeline"]];
  const prompts: Record<string, string> = { journal: "What happened today, and how did it sit with you?", safe_space: "This is private. Say it all, however it comes out.", unsent: "Dear… (you never have to send this)", gratitude: "A small good thing, if there is one. Or leave it blank, that's fine too.", reflection: "What have I noticed about myself lately?", wisdom: "A lesson, value or strategy I want to keep:", timeline: "A moment in this relationship worth remembering:" };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{kinds.map(([k, l]) => <button key={k} className={cx("chip", kind === k && "on")} onClick={() => setKind(k)}>{l}</button>)}</div>
      <Card className="space-y-3">
        {kind !== "safe_space" && <input className="field" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />}
        <textarea className="field min-h-40" placeholder={prompts[kind]} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Entry" />
        <button className="btn btn-primary w-full" disabled={!body.trim()} onClick={async () => { await api("/api/journal", { body: { kind, title: title || null, body } }); setTitle(""); setBody(""); list.reload(); }}>Save privately</button>
        <p className="text-xs text-brown-soft">Encrypted. Never shared. {kind === "unsent" && "There's no pressure to send. Keeping it is enough."}</p>
      </Card>
      {list.loading ? <Spinner /> : !list.data?.items.length ? <Empty>Nothing saved here yet.</Empty> : <ul className="space-y-2">{list.data.items.map((j) => (
        <li key={j.id} className="card p-3"><button className="w-full text-left" onClick={() => setOpen(open === j.id ? null : j.id)} aria-expanded={open === j.id}><span className="block text-xs text-brown-soft">{new Date(j.createdAt).toLocaleDateString()}</span><span className="font-semibold text-brown">{j.title || j.body.slice(0, 50)}</span></button>
          {open === j.id && <div className="fade-in mt-2"><p className="prose-soft text-brown"><span>{j.body}</span></p><button className="mt-2 text-sm text-danger underline" onClick={async () => { if (confirm("Delete this entry permanently?")) { await api(`/api/journal/${j.id}`, { method: "DELETE" }); list.reload(); } }}>Delete</button></div>}</li>))}</ul>}
    </div>
  );
}

/* ───────── Sleep, eating, body ───────── */
function Body() {
  const sleep = useAsync(() => api<{ items: { day: string; bedtime: string | null; wake: string | null; quality: number | null }[] }>("/api/sleep"), []);
  const eat = useAsync(() => api<{ items: { day: string; meals: number | null; energy: number | null }[] }>("/api/eating"), []);
  const wear = useAsync(() => api<{ items: { day: string; sleepMinutes: number | null; steps: number | null; restingHr: number | null; activeMinutes: number | null }[] }>("/api/wearable"), []);
  const [bed, setBed] = useState("23:00"), [wake, setWake] = useState("07:00"), [q, setQ] = useState<number | null>(null), [meals, setMeals] = useState<number | null>(null), [en, setEn] = useState<number | null>(null), [csv, setCsv] = useState(""), [msg, setMsg] = useState("");
  const importCsv = async () => {
    const rows = csv.trim().split(/\r?\n/).map((l) => l.split(/[,\t]/).map((x) => x.trim())).filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r[0])).map((r) => ({ day: r[0], sleepMinutes: r[1] ? Math.round(+r[1]) : null, steps: r[2] ? Math.round(+r[2]) : null, restingHr: r[3] ? Math.round(+r[3]) : null, activeMinutes: r[4] ? Math.round(+r[4]) : null }));
    if (!rows.length) { setMsg("I couldn't find any rows. Use: date, sleep minutes, steps, resting heart rate, active minutes."); return; }
    try { const r = await api<{ count: number }>("/api/wearable", { method: "PUT", body: { rows } }); setMsg(`Imported ${r.count} days.`); setCsv(""); wear.reload(); } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <div className="space-y-5">
      <Card className="space-y-3"><h2 className="serif text-xl text-brown">Last night's sleep</h2>
        <div className="grid grid-cols-2 gap-2"><label className="text-sm text-brown-soft">Went to bed<input type="time" className="field mt-1" value={bed} onChange={(e) => setBed(e.target.value)} /></label><label className="text-sm text-brown-soft">Woke up<input type="time" className="field mt-1" value={wake} onChange={(e) => setWake(e.target.value)} /></label></div>
        <div><p className="mb-1 text-sm text-brown-soft">How did it feel?</p><Scale label="Sleep quality" value={q} onChange={setQ} labels={["poor", "restful"]} /></div>
        <button className="btn btn-primary w-full" onClick={async () => { await api("/api/sleep", { method: "PUT", body: { day: today(), bedtime: bed, wake, quality: q } }); sleep.reload(); }}>Save</button>
        <p className="text-xs text-brown-soft">A bad night isn't a failure. This is just to notice your own rhythm.</p></Card>
      <Card className="space-y-3"><h2 className="serif text-xl text-brown">Eating and energy</h2><p className="text-sm text-brown-soft">Just a gentle note. No numbers about food or weight, ever.</p>
        <div><p className="mb-1 text-sm text-brown-soft">Meals or snacks today</p><div className="flex gap-2">{[0, 1, 2, 3, 4].map((n) => <button key={n} className={cx("chip flex-1 justify-center", meals === n && "on")} onClick={() => setMeals(n)}>{n === 4 ? "4+" : n}</button>)}</div></div>
        <div><p className="mb-1 text-sm text-brown-soft">Energy</p><Scale label="Energy" value={en} onChange={setEn} labels={["drained", "full"]} /></div>
        <button className="btn btn-primary w-full" onClick={async () => { await api("/api/eating", { method: "PUT", body: { day: today(), meals, energy: en } }); eat.reload(); }}>Save</button></Card>
      <Section title="Recent nights">{!sleep.data?.items.length ? <Empty>Nothing logged yet.</Empty> : <ul className="space-y-1 text-sm text-brown">{sleep.data.items.slice(0, 7).map((s) => <li key={s.day} className="card flex justify-between p-2 px-3"><span>{s.day}</span><span>{s.bedtime ?? "?"} → {s.wake ?? "?"}{s.quality ? ` · ${s.quality}/5` : ""}</span></li>)}</ul>}</Section>
      <Section title="Your own health-app numbers" hint="Optional. Paste what you exported. Used only to help you see your own routine, never to guess anxiety or depression.">
        <Card className="space-y-2"><textarea className="field min-h-24 font-mono text-xs" placeholder={"2026-11-18, 420, 6500, 68, 35\n2026-11-19, 380, 4200, 70, 10"} value={csv} onChange={(e) => setCsv(e.target.value)} aria-label="Health data rows" />
          <button className="btn btn-soft" onClick={importCsv}>Import</button>{msg && <p className="text-sm text-brown-soft">{msg}</p>}
          {!!wear.data?.items.length && <p className="text-xs text-brown-soft">{wear.data.items.length} days stored. Most recent: {wear.data.items[0].day}.</p>}</Card></Section>
    </div>
  );
}

/* ───────── Strengths ───────── */
interface S { id: string; kind: string; text: string; createdAt: string }
function Strengths() {
  const list = useAsync(() => api<{ items: S[] }>("/api/strengths"), []); const [text, setText] = useState(""); const [kind, setKind] = useState("small_win");
  const kinds = [["small_win", "Small win"], ["receipt", "Hard thing I got through"], ["feedback", "Kind feedback"], ["milestone", "Milestone"], ["lesson", "Lesson"]];
  const lab = Object.fromEntries(kinds);
  return (
    <div className="space-y-4">
      <Notice>A record of what you did and what you survived, not what you missed. No streaks, ever.</Notice>
      <Card className="space-y-3"><div className="flex flex-wrap gap-2">{kinds.map(([k, l]) => <button key={k} className={cx("chip", kind === k && "on")} onClick={() => setKind(k)}>{l}</button>)}</div>
        <textarea className="field" placeholder="e.g. I replied to that message even though I didn't feel like it" value={text} onChange={(e) => setText(e.target.value)} aria-label="Entry" />
        <button className="btn btn-primary w-full" disabled={!text.trim()} onClick={async () => { await api("/api/strengths", { body: { kind, text } }); setText(""); list.reload(); }}>Add to my Strength Archive</button></Card>
      {list.loading ? <Spinner /> : !list.data?.items.length ? <Empty>Your Strength Archive is empty. Start with something small. Anything counts.</Empty> : <ul className="space-y-2">{list.data.items.map((s) => <li key={s.id} className="card flex items-start justify-between gap-2 p-3"><span className="text-brown"><span className="block text-xs text-brown-soft">{lab[s.kind]} · {new Date(s.createdAt).toLocaleDateString()}</span>{s.text}</span><button className="text-xs text-brown-soft underline" onClick={async () => { await api(`/api/strengths/${s.id}`, { method: "DELETE" }); list.reload(); }}>Delete</button></li>)}</ul>}
    </div>
  );
}

/* ───────── Growth Map ───────── */
interface GM { map: { id: string; label: string; explored: number; practised: number; independent: number; reflections: number }[]; dimensions: { id: string; label: string; latest: number | null; first: number | null }[]; independentDays: number }
function Growth() {
  const { me } = useApp(); const g = useAsync(() => api<GM>("/api/growth"), []);
  if (g.loading || !g.data) return <Spinner />;
  const max = Math.max(1, ...g.data.map.map((d) => d.explored + d.practised + d.independent));
  const rate = async (dimension: string, value: number) => { await api("/api/growth", { body: { dimension, value } }); g.reload(); };
  return (
    <div className="space-y-6">
      <Notice>These are illustrative and optional. They aren't scores, rankings or a diagnosis, and you can ignore them.</Notice>
      <Section title="Growth Map" hint="Where you've been exploring and practising, over the last 90 days.">
        <div className="space-y-2">{g.data.map.map((d) => { const n = d.explored + d.practised + d.independent; return (
          <div key={d.id}><div className="flex justify-between text-sm text-brown"><span>{d.label}</span><span className="text-brown-soft">{d.explored} explored · {d.practised} practised · {d.independent} on my own</span></div>
            <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-peach" role="img" aria-label={`${d.label}: ${n} activities`}><span className="bg-mauve" style={{ width: `${(d.explored / max) * 100}%` }} /><span className="bg-amber" style={{ width: `${(d.practised / max) * 100}%` }} /><span className="bg-sage" style={{ width: `${(d.independent / max) * 100}%` }} /></div></div>); })}</div>
      </Section>
      <Section title="Doing it on my own" hint="Rate yourself, honestly and privately. Shown separately, never combined into one number. Growth is you needing UDAAN less for these.">
        <div className="space-y-3">{g.data.dimensions.map((d) => (
          <Card key={d.id} className="space-y-2"><div className="flex justify-between text-brown"><span className="font-semibold">{d.label}</span>{d.latest && d.first && d.latest !== d.first && <span className="text-xs text-sage">{d.latest > d.first ? "↑ growing" : "↓ harder lately"}</span>}</div>
            <Scale label={d.label} value={d.latest} onChange={(n) => rate(d.id, n)} labels={["need lots of support", "can do it myself"]} /></Card>))}</div>
      </Section>
      {me?.profile?.independentDays && <Section title="Independent days" hint="Days you chose to handle things on your own. Optional.">
        <Card className="space-y-2"><p className="text-brown">{g.data.independentDays} {g.data.independentDays === 1 ? "day" : "days"} in the last 90.</p><button className="btn btn-soft" onClick={async () => { await api("/api/growth", { body: { domain: "growth", kind: "independent", note: "Independent day" } }); g.reload(); }}>I handled today on my own</button></Card></Section>}
    </div>
  );
}

/* ───────── More: goals, journeys, Clear Path log ───────── */
function More() {
  const goals = useAsync(() => api<{ items: { id: string; title: string; steps: string | null; status: string }[] }>("/api/goals"), []);
  const sub = useAsync(() => api<{ items: { id: string; at: string; kind: string; intensity: number | null }[]; summary: { daysWithoutLast30: number; resisted: number; urges: number } | null }>("/api/substance"), []);
  const [g, setG] = useState(""); const [kind, setKind] = useState("urge"); const [int, setInt] = useState<number | null>(null);
  const kinds: Record<string, string> = { urge: "I had an urge", resisted: "I rode it out", used: "I slipped" };
  return (
    <div className="space-y-6">
      <Section title="Goals" hint="Small and yours. No streaks, no guilt.">
        <Card className="space-y-2"><div className="flex gap-2"><input className="field" placeholder="A goal I care about" value={g} onChange={(e) => setG(e.target.value)} aria-label="Goal" /><button className="btn btn-soft" disabled={!g.trim()} onClick={async () => { await api("/api/goals", { body: { title: g, status: "active" } }); setG(""); goals.reload(); }}>Add</button></div>
          <ul className="space-y-1">{goals.data?.items.map((x) => <li key={x.id} className="flex items-center justify-between rounded-xl bg-peach px-3 py-2 text-brown"><span className={cx(x.status === "done" && "line-through opacity-60")}>{x.title}</span><span className="flex gap-1">{x.status !== "done" && <button className="btn btn-ghost !min-h-8 text-sm" onClick={async () => { await api(`/api/goals/${x.id}`, { method: "PATCH", body: { status: "done" } }); await api("/api/strengths", { body: { kind: "milestone", text: `Reached a goal: ${x.title}` } }); goals.reload(); }}>Done</button>}<button className="btn btn-ghost !min-h-8 text-sm" onClick={async () => { await api(`/api/goals/${x.id}`, { method: "DELETE" }); goals.reload(); }}>✕</button></span></li>)}</ul></Card>
      </Section>
      <Section title="Clear Path log" hint="Private, optional, and never shared. A slip is information, not failure."
        action={<Link href="/grow/cp_talk" className="text-sm text-amber-deep underline">Talk about it</Link>}>
        <Card className="space-y-3"><div className="flex flex-wrap gap-2">{Object.entries(kinds).map(([k, l]) => <button key={k} className={cx("chip", kind === k && "on")} onClick={() => setKind(k)}>{l}</button>)}</div>
          <div><p className="mb-1 text-sm text-brown-soft">How strong? (optional)</p><Scale label="Intensity" value={int} onChange={setInt} min={0} max={10} /></div>
          <button className="btn btn-soft w-full" onClick={async () => { await api("/api/substance", { body: { kind, intensity: int } }); setInt(null); sub.reload(); }}>Log it</button>
          {sub.data?.summary && <p className="rounded-xl bg-[#eef4ea] p-3 text-sm text-brown">Last 30 days: {sub.data.summary.daysWithoutLast30} days without, {sub.data.summary.resisted} urges ridden out. A slip never resets this to zero.</p>}
          <p className="text-xs text-brown-soft">Tip: you can turn the day view on or off in Settings.</p></Card>
      </Section>
    </div>
  );
}
