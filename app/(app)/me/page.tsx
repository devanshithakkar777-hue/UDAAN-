"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { LANGS } from "@/lib/i18n";
import { Card, Empty, Notice, Section, Spinner, cx, useAsync } from "@/components/ui";

const Toggle = ({ on, onChange, title, body }: { on: boolean; onChange: (b: boolean) => void; title: string; body?: string }) => (
  <label className="flex cursor-pointer items-start justify-between gap-3 py-2"><span className="text-brown"><span className="block font-semibold">{title}</span>{body && <span className="text-sm text-brown-soft">{body}</span>}</span>
    <input type="checkbox" role="switch" className="mt-1 h-6 w-11 shrink-0 accent-amber-deep" checked={on} onChange={(e) => onChange(e.target.checked)} /></label>
);

export default function Me() {
  const { me, refresh, lang, setLang, calm, setCalm, textScale, setTextScale, low, setLow } = useApp(); const router = useRouter();
  const p = me?.profile ?? {};
  const set = async (patch: Record<string, unknown>) => { await api("/api/profile", { method: "PATCH", body: patch }); await refresh(); };
  const [pin, setPin] = useState(""); const [hasPin, setHasPin] = useState<boolean | null>(null); const [msg, setMsg] = useState("");
  useAsync(() => api<{ hasPin: boolean }>("/api/auth/pin").then((r) => { setHasPin(r.hasPin); return r; }), []);
  const [pw, setPw] = useState({ current: "", next: "" }); const [del, setDel] = useState({ open: false, password: "", confirm: "" });
  const [dname, setDname] = useState<string | null>(null);
  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-3xl text-brown">Settings</h1>

      <Section title="How UDAAN talks with you">
        <Card className="space-y-3">
          <div><p className="mb-1 text-sm font-semibold text-brown">Tone</p><div className="flex gap-2">{["gentle", "balanced", "direct"].map((x) => <button key={x} className={cx("chip flex-1 justify-center", p.tone === x && "on")} onClick={() => set({ tone: x })}>{x}</button>)}</div></div>
          <div><p className="mb-1 text-sm font-semibold text-brown">Style</p><div className="flex flex-wrap gap-2">{["listener", "guide", "coach", "companion"].map((x) => <button key={x} className={cx("chip", p.style === x && "on")} onClick={() => set({ style: x })}>{x}</button>)}</div></div>
          <Toggle on={!!p.askListenOrHelp} onChange={(b) => set({ askListenOrHelp: b })} title="Ask me: listen or help?" body="When I share something heavy, check which I want." />
          <div><p className="mb-1 text-sm font-semibold text-brown">Language</p><div className="flex flex-wrap gap-2">{LANGS.map((l) => <button key={l.id} className={cx("chip", lang === l.id && "on")} onClick={() => { setLang(l.id); void set({ language: l.id }); }}>{l.label}</button>)}</div>
            {lang !== "en" && <p className="mt-1 text-xs text-brown-soft">Parts of the app are still being translated and reviewed by native speakers.</p>}</div>
        </Card>
      </Section>

      <Section title="Growth and independence">
        <Card><Toggle on={!!p.independentDays} onChange={(b) => set({ independentDays: b })} title="Independent days" body="Lets you note days you handled things on your own." />
          <Toggle on={!!p.dailyReflection} onChange={(b) => set({ dailyReflection: b })} title="Daily reflection" body="An optional gentle prompt each day. Never a streak." />
          <Toggle on={!!p.seasonalSupport} onChange={(b) => set({ seasonalSupport: b })} title="Seasonal check-ins" body="Notes around exam season, festivals or winter, if you want them." />
          <Toggle on={!!p.showDayCounter} onChange={(b) => set({ showDayCounter: b })} title="Show days-without in Clear Path" body="Off by default. A slip never resets your story." /></Card>
      </Section>

      <Section title="Comfort and accessibility">
        <Card className="space-y-2"><Toggle on={low} onChange={setLow} title="Low-energy mode" body="Fewer choices, shorter text, bigger buttons." />
          <Toggle on={calm} onChange={setCalm} title="Calm mode" body="Stops animations and uses quieter colours." />
          <div><p className="mb-1 text-sm font-semibold text-brown">Text size</p><div className="flex gap-2">{[[1, "Normal"], [1.15, "Large"], [1.3, "Larger"]].map(([n, l]) => <button key={String(n)} className={cx("chip flex-1 justify-center", textScale === n && "on")} onClick={() => setTextScale(n as number)}>{l}</button>)}</div></div></Card>
      </Section>

      <Section title="Privacy and discretion">
        <Card className="space-y-2">
          <Toggle on={!!p.discreetMode} onChange={(b) => set({ discreetMode: b })} title="Discreet mode" body="The app shows as a neutral name, and notifications say nothing about wellbeing." />
          {p.discreetMode && <div className="flex gap-2"><input className="field" placeholder="Name shown (e.g. Notes)" value={dname ?? p.discreetName ?? ""} onChange={(e) => setDname(e.target.value)} aria-label="Discreet name" /><button className="btn btn-soft" onClick={() => set({ discreetName: dname || null })}>Save</button></div>}
          <div className="border-t border-line pt-2"><p className="font-semibold text-brown">App lock PIN {hasPin ? "(on)" : "(off)"}</p>
            <div className="mt-1 flex gap-2"><input className="field" inputMode="numeric" type="password" maxLength={8} placeholder="4 to 8 digits" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} aria-label="PIN" />
              <button className="btn btn-soft" disabled={pin.length < 4} onClick={async () => { await api("/api/auth/pin", { method: "PUT", body: { pin } }); setPin(""); setHasPin(true); setMsg("PIN set."); }}>Set</button>
              {hasPin && <button className="btn btn-ghost" onClick={async () => { await api("/api/auth/pin", { method: "DELETE" }); setHasPin(false); setMsg("PIN removed."); }}>Remove</button>}</div></div>
          <p className="text-xs text-brown-soft">Quick hide: press Esc twice, or tap Hide at the top, to switch to a plain notes page.</p>
          {msg && <p className="text-sm text-sage" aria-live="polite">{msg}</p>}
        </Card>
      </Section>

      <Section title="What UDAAN remembers" hint="You decide. Nothing sensitive is kept unless you allow it.">
        <Card className="mb-2"><Toggle on={!!p.memoryEnabled} onChange={(b) => set({ memoryEnabled: b })} title="Remember things between conversations" /><Toggle on={!!p.sensitiveMemoryEnabled} onChange={(b) => set({ sensitiveMemoryEnabled: b })} title="Allow sensitive memories" body="Such as health or family details you tell me. Off by default." /></Card>
        <Memories />
      </Section>

      <Section title="Reminders and notifications"><Reminders /></Section>

      <Section title="Your data">
        <Card className="space-y-2">
          <Toggle on={!!p.trainingConsent} onChange={(b) => set({ trainingConsent: b })} title="Help improve UDAAN's AI" body="De-identified excerpts only. Off by default." />
          <Toggle on={!!p.researchConsent} onChange={(b) => set({ researchConsent: b })} title="Take part in research" body="Anonymous, combined data only." />
          <a className="btn btn-soft w-full" href="/api/export" download="udaan-my-data.json">Download everything I've shared</a>
          <p className="text-xs text-brown-soft">Everything is encrypted. Read the <Link href="/privacy" className="underline">privacy notice</Link> and <Link href="/transparency" className="underline">how safety works</Link>.</p>
        </Card>
      </Section>

      <Section title="Account">
        <Card className="space-y-3">
          <p className="text-sm text-brown-soft">{me?.user?.email}</p>
          <div className="space-y-2"><p className="font-semibold text-brown">Change password</p><input className="field" type="password" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} aria-label="Current password" autoComplete="current-password" /><input className="field" type="password" placeholder="New password (10+ characters)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} aria-label="New password" autoComplete="new-password" />
            <button className="btn btn-soft" disabled={pw.next.length < 10 || !pw.current} onClick={async () => { try { await api("/api/auth/password", { body: pw }); setPw({ current: "", next: "" }); setMsg("Password changed."); } catch (e) { setMsg((e as Error).message); } }}>Change</button></div>
          <button className="btn btn-ghost w-full" onClick={async () => { await api("/api/auth/logout", { body: {} }); sessionStorage.removeItem("udaan_unlocked"); localStorage.removeItem("udaan_offline_kit"); await refresh(); router.replace("/welcome"); }}>Sign out</button>
          {me?.user?.role && me.user.role !== "user" && <Link href={me.user.role === "admin" ? "/admin" : "/pro"} className="btn btn-soft w-full">Open {me.user.role} console</Link>}
          <button className="text-sm text-danger underline" onClick={() => setDel({ ...del, open: !del.open })}>Delete my account</button>
          {del.open && <div className="space-y-2 rounded-xl bg-[#fdecec] p-3"><p className="text-sm text-brown">This permanently deletes everything: conversations, journal, memories, plans. It can't be undone.</p>
            <input className="field" type="password" placeholder="Your password" value={del.password} onChange={(e) => setDel({ ...del, password: e.target.value })} aria-label="Password" /><input className="field" placeholder='Type DELETE to confirm' value={del.confirm} onChange={(e) => setDel({ ...del, confirm: e.target.value })} aria-label="Confirm" />
            <button className="btn btn-primary !bg-danger w-full" disabled={del.confirm !== "DELETE" || !del.password} onClick={async () => { try { await api("/api/account", { method: "DELETE", body: { password: del.password, confirm: "DELETE" } }); localStorage.clear(); sessionStorage.clear(); location.href = "/welcome"; } catch (e) { setMsg((e as Error).message); } }}>Delete everything</button></div>}
        </Card>
      </Section>
    </div>
  );
}

function Memories() {
  const m = useAsync(() => api<{ memories: { id: string; kind: string; text: string; sensitive: boolean; pinned: boolean; status: string; source: string }[] }>("/api/memory"), []); const [t, setT] = useState("");
  if (m.loading) return <Spinner />;
  const pending = m.data?.memories.filter((x) => x.status === "pending") ?? []; const active = m.data?.memories.filter((x) => x.status === "active") ?? [];
  return (
    <div className="space-y-2">
      {pending.length > 0 && <Notice>UDAAN would like to remember these. Nothing is saved unless you approve.</Notice>}
      {pending.map((x) => <Card key={x.id} className="flex items-center justify-between gap-2"><span className="text-brown">{x.text}</span><span className="flex shrink-0 gap-1"><button className="btn btn-soft !min-h-9" onClick={async () => { await api(`/api/memory/${x.id}`, { method: "PATCH", body: { approve: true } }); m.reload(); }}>Keep</button><button className="btn btn-ghost !min-h-9" onClick={async () => { await api(`/api/memory/${x.id}`, { method: "DELETE" }); m.reload(); }}>No</button></span></Card>)}
      {!active.length && !pending.length && <Empty>Nothing remembered yet.</Empty>}
      {active.map((x) => <Card key={x.id} className="flex items-center justify-between gap-2"><span className="text-brown"><span className="block text-xs text-brown-soft">{x.kind}{x.sensitive && " · sensitive"}</span>{x.text}</span><span className="flex shrink-0 gap-1"><button className="btn btn-ghost !min-h-9" aria-pressed={x.pinned} onClick={async () => { await api(`/api/memory/${x.id}`, { method: "PATCH", body: { pinned: !x.pinned } }); m.reload(); }}>{x.pinned ? "Pinned" : "Pin"}</button><button className="btn btn-ghost !min-h-9" onClick={async () => { await api(`/api/memory/${x.id}`, { method: "DELETE" }); m.reload(); }}>Forget</button></span></Card>)}
      <div className="flex gap-2"><input className="field" placeholder="Add something I should know" value={t} onChange={(e) => setT(e.target.value)} aria-label="Add memory" /><button className="btn btn-soft" disabled={!t.trim()} onClick={async () => { await api("/api/memory", { body: { text: t } }); setT(""); m.reload(); }}>Add</button></div>
      {active.length > 0 && <button className="text-sm text-danger underline" onClick={async () => { if (confirm("Forget everything UDAAN remembers about you?")) { for (const x of [...active, ...pending]) await api(`/api/memory/${x.id}`, { method: "DELETE" }); m.reload(); } }}>Forget everything</button>}
    </div>
  );
}

function Reminders() {
  const r = useAsync(() => api<{ items: { id: string; kind: string; text: string | null; dueAt: string }[] }>("/api/reminders"), []); const [kind, setKind] = useState("check_in"); const [when, setWhen] = useState(""); const [txt, setTxt] = useState(""); const [push, setPush] = useState("");
  const enablePush = async () => {
    try {
      const { publicKey } = await api<{ publicKey: string | null }>("/api/push");
      if (!publicKey) { setPush("Notifications aren't set up on this server yet."); return; }
      if ((await Notification.requestPermission()) !== "granted") { setPush("Notifications are blocked in your browser settings."); return; }
      const reg = await navigator.serviceWorker.ready; const pad = "=".repeat((4 - (publicKey.length % 4)) % 4); const raw = atob((publicKey + pad).replace(/-/g, "+").replace(/_/g, "/"));
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
      await api("/api/push", { body: sub.toJSON() }); setPush("Notifications are on for this device.");
    } catch (e) { setPush((e as Error).message); }
  };
  return (
    <Card className="space-y-3">
      <p className="text-sm text-brown-soft">Reminders are ones you set yourself. UDAAN never sends "you haven't checked in" messages.</p>
      <button className="btn btn-soft w-full" onClick={enablePush}>Turn on notifications on this device</button>{push && <p className="text-sm text-brown-soft" aria-live="polite">{push}</p>}
      <div className="flex flex-wrap gap-2">{[["check_in", "Check-in"], ["wind_down", "Wind down"], ["morning", "Morning"], ["daily_reflection", "Reflection"]].map(([k, l]) => <button key={k} className={cx("chip", kind === k && "on")} onClick={() => setKind(k)}>{l}</button>)}</div>
      <input className="field" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="When" /><input className="field" placeholder="Your own words (optional)" value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Reminder text" />
      <button className="btn btn-soft w-full" disabled={!when} onClick={async () => { await api("/api/reminders", { body: { kind, text: txt || null, dueAt: new Date(when).toISOString() } }); setWhen(""); setTxt(""); r.reload(); }}>Add reminder</button>
      <ul className="space-y-1">{r.data?.items.map((x) => <li key={x.id} className="flex items-center justify-between rounded-xl bg-peach px-3 py-2 text-sm text-brown"><span>{new Date(x.dueAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · {x.kind.replace("_", " ")}</span><button className="text-xs underline" onClick={async () => { await api(`/api/reminders/${x.id}`, { method: "DELETE" }); r.reload(); }}>Cancel</button></li>)}</ul>
    </Card>
  );
}
