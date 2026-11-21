"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Card, Empty, Notice, Section, Spinner, cx, useAsync } from "@/components/ui";
import { SafeContent } from "@/components/safe";

const TABS = [["safety", "Safety"], ["kit", "Low-Day Kit"], ["pro", "Professionals"], ["community", "Community"], ["family", "Family"], ["org", "Organisation"]] as const;
type Tab = (typeof TABS)[number][0];

export default function Care() {
  const [tab, setTab] = useState<Tab>("safety");
  return (
    <div className="space-y-4">
      <h1 className="text-3xl text-brown">Care</h1>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={cx("chip shrink-0", tab === k && "on")} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "safety" && <Safety />}{tab === "kit" && <Kit />}{tab === "pro" && <Pro />}{tab === "community" && <Community />}{tab === "family" && <Family />}{tab === "org" && <Org />}
    </div>
  );
}

/* ───────── Safety plan, contacts, resources ───────── */
const PLAN: [string, string, string][] = [
  ["warningSigns", "My warning signs", "What I notice when things are getting hard"],
  ["copingSteps", "Things I can do on my own", "What helps, even a little"],
  ["peopleAndPlaces", "People and places that help me feel okay", "Company or somewhere calming"],
  ["peopleToAsk", "People I can ask for help", "Names and numbers"],
  ["professionals", "Professionals and services", "Therapist, doctor, helpline"],
  ["makingSafe", "Making my space safer", "Steps that put distance between me and anything I could use to hurt myself"],
  ["reasons", "My reasons to keep going", "Whatever they are, big or small"],
];
interface Contact { id: string; name: string; relation?: string; phone?: string; role: string; shareLevel: string }

function Safety() {
  const plan = useAsync(() => api<{ plan: Record<string, string[]> }>("/api/safety-plan"), []);
  const contacts = useAsync(() => api<{ items: Contact[] }>("/api/contacts"), []);
  const [edit, setEdit] = useState<Record<string, string[]> | null>(null); const [saved, setSaved] = useState(false);
  const [c, setC] = useState({ name: "", phone: "", relation: "", role: "friend", shareLevel: "none" });
  const p = edit ?? plan.data?.plan;
  const save = async () => { await api("/api/safety-plan", { method: "PUT", body: edit }); setEdit(null); setSaved(true); plan.reload(); };
  return (
    <div className="space-y-6">
      <Notice>Fill this in on a good day, so it's there on a hard one. It's saved on your device too, so it still opens when you're offline.</Notice>
      <Section title="My safety plan">
        {plan.loading || !p ? <Spinner /> : (
          <div className="space-y-3">{PLAN.map(([k, label, hint]) => (
            <Card key={k} className="space-y-2"><p className="font-semibold text-brown">{label}</p><p className="text-xs text-brown-soft">{hint}</p>
              <textarea className="field min-h-20" aria-label={label} value={(p[k] ?? []).join("\n")} placeholder="One per line" onChange={(e) => setEdit({ ...(edit ?? plan.data!.plan), [k]: e.target.value.split("\n") })} /></Card>))}
            <button className="btn btn-primary w-full" disabled={!edit} onClick={save}>Save my plan</button>{saved && !edit && <p className="text-center text-sm text-brown-soft">Saved.</p>}</div>)}
      </Section>
      <Section title="People I trust" hint="Only you can see this. Nobody is contacted unless you choose to call or message them.">
        <Card className="space-y-2">
          <div className="grid grid-cols-2 gap-2"><input className="field" placeholder="Name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} aria-label="Name" /><input className="field" type="tel" placeholder="Phone" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} aria-label="Phone" /></div>
          <div className="flex flex-wrap gap-2">{["friend", "family", "mentor", "therapist", "caregiver"].map((r) => <button key={r} className={cx("chip", c.role === r && "on")} onClick={() => setC({ ...c, role: r })}>{r}</button>)}</div>
          <label className="flex items-start gap-2 text-sm text-brown"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-amber-deep" checked={c.shareLevel === "rough_week_flag"} onChange={(e) => setC({ ...c, shareLevel: e.target.checked ? "rough_week_flag" : "none" })} />I'd be okay with UDAAN helping me write them a note on a rough week (I always send it myself)</label>
          <button className="btn btn-soft w-full" disabled={!c.name.trim()} onClick={async () => { await api("/api/contacts", { body: { name: c.name, phone: c.phone || undefined, relation: c.relation || undefined, role: c.role, shareLevel: c.shareLevel } }); setC({ name: "", phone: "", relation: "", role: "friend", shareLevel: "none" }); contacts.reload(); }}>Add</button></Card>
        <ul className="mt-2 space-y-2">{contacts.data?.items.map((x) => <li key={x.id} className="card flex items-center justify-between gap-2 p-3"><span className="text-brown"><b>{x.name}</b> <span className="text-xs text-brown-soft">{x.role}</span>{x.phone && <a className="block text-amber-deep underline" href={`tel:${x.phone.replace(/[^\d+]/g, "")}`}>{x.phone}</a>}</span><button className="text-xs text-brown-soft underline" onClick={async () => { await api(`/api/contacts/${x.id}`, { method: "DELETE" }); contacts.reload(); }}>Remove</button></li>)}</ul>
      </Section>
      <Section title="Crisis lines and emergency numbers"><SafeContent resources={[]} /></Section>
    </div>
  );
}

/* ───────── Low-Day Kit ───────── */
interface KitItem { id: string; section: string; text: string }
const KIT: [string, string, string][] = [["helps", "Things that help me", "e.g. a warm shower, a walk to the corner"], ["people", "People to reach", "A name is enough"], ["avoid", "Things to go easy on", "e.g. late-night scrolling, big decisions"], ["reminders", "Kind reminders to myself", "Written in your own words"], ["if_then", "If-then plans", "If I feel X, then I will Y"], ["reasons", "My reasons", "What matters to me"]];
function Kit() {
  const kit = useAsync(() => api<{ items: KitItem[] }>("/api/kit"), []); const [txt, setTxt] = useState<Record<string, string>>({});
  return (
    <div className="space-y-5">
      <Notice>Your own page for hard days, written when you're okay. UDAAN shows it back to you when things are low.</Notice>
      {KIT.map(([k, title, hint]) => (
        <Section key={k} title={title} hint={hint}>
          <ul className="mb-2 space-y-1">{kit.data?.items.filter((i) => i.section === k).map((i) => <li key={i.id} className="flex items-start justify-between gap-2 rounded-xl bg-peach px-3 py-2 text-brown"><span>{i.text}</span><button className="text-xs text-brown-soft underline" onClick={async () => { await api(`/api/kit/${i.id}`, { method: "DELETE" }); kit.reload(); }}>✕</button></li>)}</ul>
          <div className="flex gap-2"><input className="field" aria-label={title} value={txt[k] ?? ""} onChange={(e) => setTxt({ ...txt, [k]: e.target.value })} /><button className="btn btn-soft" disabled={!(txt[k] ?? "").trim()} onClick={async () => { await api("/api/kit", { body: { section: k, text: txt[k] } }); setTxt({ ...txt, [k]: "" }); kit.reload(); }}>Add</button></div>
        </Section>))}
    </div>
  );
}

/* ───────── Professionals ───────── */
interface Pro { id: string; name: string; credentialType: string; registrationBody: string; qualifications: string; languages: string[]; modes: string[]; city: string | null; specialties: string[]; feeInr: number | null; bio: string | null; contactUrl: string | null }
const CRED: Record<string, string> = { counsellor: "Counsellor", clinical_psychologist: "Clinical psychologist", psychiatrist: "Psychiatrist", other: "Other" };
const SCOPES: [string, string][] = [["mood_summary", "A summary of my mood check-ins"], ["sleep_summary", "A summary of my sleep"], ["assigned_exercises", "My progress on exercises they assigned"], ["prep_summary", "My appointment prep notes"], ["journal_excerpt", "Journal excerpts I pick myself"]];

function Pro() {
  const [city, setCity] = useState(""); const [type, setType] = useState("");
  const list = useAsync(() => api<{ items: Pro[] }>(`/api/professionals?${new URLSearchParams({ ...(city && { city }), ...(type && { type }) })}`), [city, type]);
  const bookings = useAsync(() => api<{ items: { id: string; professional: string; status: string; mode: string; slot: string | null }[] }>("/api/bookings"), []);
  const shares = useAsync(() => api<{ items: { id: string; professional: string; scope: string[]; expiresAt: string }[] }>("/api/shares"), []);
  const ex = useAsync(() => api<{ items: { id: string; from: string; title: string; description: string; doneAt: string | null }[] }>("/api/exercises"), []);
  const [sel, setSel] = useState<Pro | null>(null); const [msg, setMsg] = useState(""); const [scope, setScope] = useState<string[]>([]); const [note, setNote] = useState("");
  return (
    <div className="space-y-6">
      <Notice>UDAAN is not therapy. Everyone listed here has had their credentials checked by a person. UDAAN doesn't earn commission and doesn't rank by who pays.</Notice>
      <Link href="/grow/care_prep" className="btn btn-soft w-full">Prepare for an appointment (a short guided prep)</Link>
      <Section title="Find someone">
        <div className="space-y-2"><input className="field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" />
          <div className="flex flex-wrap gap-2">{[["", "Any"], ["counsellor", "Counsellor"], ["clinical_psychologist", "Psychologist"], ["psychiatrist", "Psychiatrist"]].map(([k, l]) => <button key={k} className={cx("chip", type === k && "on")} onClick={() => setType(k)}>{l}</button>)}</div></div>
        <div className="mt-3 space-y-2">{list.loading ? <Spinner /> : !list.data?.items.length ? <Empty>No verified professionals match yet. Directories grow as people are verified. In the meantime, the Safety tab lists helplines you can call.</Empty> : list.data.items.map((p) => (
          <Card key={p.id} className="space-y-1"><p className="font-semibold text-brown">{p.name} <span className="text-sm font-normal text-brown-soft">· {CRED[p.credentialType]}</span></p>
            <p className="text-xs text-brown-soft">{p.qualifications} · Registered with {p.registrationBody}</p>
            <p className="text-sm text-brown">{p.city ?? "Online"} · {p.languages.join(", ")} · {p.modes.join(", ")}{p.feeInr != null && ` · ₹${p.feeInr}`}</p>
            {p.bio && <p className="text-sm text-brown-soft">{p.bio}</p>}
            <button className="btn btn-soft mt-1" onClick={() => { setSel(p); setMsg(""); setScope([]); }}>Request a session</button></Card>))}</div>
      </Section>
      {sel && <Card className="space-y-3 !border-amber-deep"><p className="font-semibold text-brown">Request to {sel.name}</p>
        <textarea className="field" placeholder="A few words about what you'd like help with (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Message" />
        <div><p className="mb-1 text-sm font-semibold text-brown">Share with them (optional, you choose, you can stop any time)</p>{SCOPES.map(([k, l]) => <label key={k} className="flex items-center gap-2 py-1 text-sm text-brown"><input type="checkbox" className="h-5 w-5 accent-amber-deep" checked={scope.includes(k)} onChange={(e) => setScope(e.target.checked ? [...scope, k] : scope.filter((x) => x !== k))} />{l}</label>)}<p className="text-xs text-brown-soft">Your conversations with UDAAN and your private logs are never shared.</p></div>
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={() => setSel(null)}>Cancel</button><button className="btn btn-primary flex-1" onClick={async () => { await api("/api/bookings", { body: { professionalId: sel.id, message: msg || undefined } }); if (scope.length) await api("/api/shares", { body: { professionalId: sel.id, scope, days: 90 } }); setSel(null); bookings.reload(); shares.reload(); }}>Send request</button></div>
        <p className="text-xs text-brown-soft">This sends a request. Times and fees are agreed with them directly.</p></Card>}
      <Section title="My requests">{!bookings.data?.items.length ? <Empty>None yet.</Empty> : <ul className="space-y-1">{bookings.data.items.map((b) => <li key={b.id} className="card flex justify-between p-3 text-brown"><span>{b.professional}</span><span className="text-sm text-brown-soft">{b.status}</span></li>)}</ul>}</Section>
      <Section title="What I'm sharing" hint="Stop any time. It takes effect immediately.">{!shares.data?.items.length ? <Empty>You're not sharing anything with anyone.</Empty> : <ul className="space-y-2">{shares.data.items.map((s) => <li key={s.id} className="card p-3 text-brown"><p className="font-semibold">{s.professional}</p><p className="text-sm text-brown-soft">{s.scope.join(", ").replaceAll("_", " ")} · until {new Date(s.expiresAt).toLocaleDateString()}</p><button className="mt-1 text-sm text-danger underline" onClick={async () => { await api(`/api/shares/${s.id}`, { method: "DELETE" }); shares.reload(); }}>Stop sharing</button></li>)}</ul>}</Section>
      {!!ex.data?.items.length && <Section title="Exercises from your professional">{ex.data.items.map((e) => <Card key={e.id} className="space-y-1"><p className="text-xs text-brown-soft">From {e.from}</p><p className="font-semibold text-brown">{e.title}</p><p className="text-sm text-brown">{e.description}</p>{!e.doneAt ? <><input className="field" placeholder="Notes (optional, private to you and them)" value={note} onChange={(x) => setNote(x.target.value)} aria-label="Note" /><button className="btn btn-soft" onClick={async () => { await api(`/api/exercises/${e.id}`, { method: "PATCH", body: { done: true, note: note || undefined } }); setNote(""); ex.reload(); }}>Mark done</button></> : <p className="text-sm text-sage">Done</p>}</Card>)}</Section>}
    </div>
  );
}

/* ───────── Community & stories ───────── */
function Community() {
  const groups = useAsync(() => api<{ items: { id: string; name: string; description: string; joined: boolean; handle: string | null }[] }>("/api/community"), []);
  const stories = useAsync(() => api<{ items: { id: string; title: string; body: string; topic: string | null }[] }>("/api/stories"), []);
  const [open, setOpen] = useState<string | null>(null); const [st, setSt] = useState({ title: "", body: "" }); const [msg, setMsg] = useState("");
  return (
    <div className="space-y-6">
      <Notice>Anonymous, moderated groups. You get a random name, there are no private messages, and posts with contact details are held back. These groups are peer support, not therapy.</Notice>
      <Section title="Groups">{groups.loading ? <Spinner /> : groups.data?.items.map((g) => (
        <Card key={g.id} className="mb-2 space-y-2"><p className="font-semibold text-brown">{g.name}</p><p className="text-sm text-brown-soft">{g.description}</p>
          {g.joined ? <><p className="text-xs text-brown-soft">You appear as <b>{g.handle}</b></p><div className="flex gap-2"><button className="btn btn-soft" onClick={() => setOpen(open === g.id ? null : g.id)}>{open === g.id ? "Close" : "Open"}</button><button className="btn btn-ghost" onClick={async () => { await api("/api/community", { body: { groupId: g.id, action: "leave" } }); groups.reload(); }}>Leave</button></div>{open === g.id && <Thread id={g.id} />}</>
            : <button className="btn btn-soft" onClick={async () => { await api("/api/community", { body: { groupId: g.id, action: "join" } }); groups.reload(); }}>Join</button>}</Card>))}</Section>
      <Section title="Stories" hint="Anonymous stories from people further along. Read-only, and every story is reviewed by a person first.">
        {stories.data?.items.length ? stories.data.items.map((s) => <Card key={s.id} className="mb-2"><p className="font-semibold text-brown">{s.title}</p><p className="prose-soft mt-1 text-brown"><span>{s.body}</span></p></Card>) : <Empty>No stories published yet.</Empty>}
        <Card className="mt-3 space-y-2"><p className="font-semibold text-brown">Share yours</p><input className="field" placeholder="Title" value={st.title} onChange={(e) => setSt({ ...st, title: e.target.value })} aria-label="Title" /><textarea className="field min-h-32" placeholder="At least a few sentences. Don't include names or details that could identify you." value={st.body} onChange={(e) => setSt({ ...st, body: e.target.value })} aria-label="Story" />
          <button className="btn btn-soft" disabled={!st.title.trim() || st.body.length < 50} onClick={async () => { const r = await api<{ support?: string }>("/api/stories", { body: st }); setMsg(r.support ?? "Thank you. A person will read it before anything is published."); setSt({ title: "", body: "" }); }}>Submit for review</button>{msg && <Notice tone="ok">{msg}</Notice>}</Card>
      </Section>
    </div>
  );
}
function Thread({ id }: { id: string }) {
  const posts = useAsync(() => api<{ items: { id: string; handle: string; body: string; status: string; mine: boolean; at: string }[] }>(`/api/community/${id}/posts`), [id]);
  const [t, setT] = useState(""); const [note, setNote] = useState("");
  return (
    <div className="space-y-2 border-t border-line pt-2">
      {posts.data?.items.map((p) => <div key={p.id} className={cx("rounded-xl p-2 text-sm", p.mine ? "bg-peach" : "bg-cream")}><span className="text-xs text-brown-soft">{p.handle}{p.status === "held" && " · awaiting review"}</span><p className="text-brown">{p.body}</p>{!p.mine && <button className="text-xs text-brown-soft underline" onClick={async () => { await api("/api/community/report", { body: { postId: p.id, reason: "concern" } }); setNote("Thank you. A moderator will look at it."); }}>Report</button>}</div>)}
      {note && <Notice tone="ok">{note}</Notice>}
      <textarea className="field" placeholder="Write something kind and honest" value={t} onChange={(e) => setT(e.target.value)} aria-label="Post" />
      <button className="btn btn-soft" disabled={!t.trim()} onClick={async () => { const r = await api<{ note?: string; support?: string }>(`/api/community/${id}/posts`, { body: { body: t } }); setNote(r.support ?? r.note ?? ""); setT(""); posts.reload(); }}>Post</button>
    </div>
  );
}

/* ───────── Family: Two Perspectives ───────── */
function Family() {
  const list = useAsync(() => api<{ items: { id: string; topic: string | null; status: string; inviteCode?: string; mine: boolean }[] }>("/api/family"), []);
  const [topic, setTopic] = useState(""); const [code, setCode] = useState(""); const [open, setOpen] = useState<string | null>(null); const [err, setErr] = useState("");
  return (
    <div className="space-y-5">
      <Notice>Two Perspectives helps two people in a disagreement each write their side, then see a neutral summary of what they share. It isn't a judge, and no one sees your private notes unless you choose to share. Not suitable if you feel unsafe with the other person. See <Link href="/safe" className="underline">Safe</Link>.</Notice>
      <Card className="space-y-2"><input className="field" placeholder="What's it about? (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic" /><button className="btn btn-soft w-full" onClick={async () => { await api("/api/family", { body: { topic } }); setTopic(""); list.reload(); }}>Start a session and invite someone</button></Card>
      <Card className="space-y-2"><input className="field" placeholder="Have an invite code?" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Invite code" /><button className="btn btn-soft w-full" disabled={code.length < 6} onClick={async () => { try { await api("/api/family", { body: { code } }); setCode(""); setErr(""); list.reload(); } catch (e) { setErr((e as Error).message); } }}>Join</button>{err && <p role="alert" className="text-sm text-danger">{err}</p>}</Card>
      {list.data?.items.map((s) => <Card key={s.id} className="space-y-2"><p className="font-semibold text-brown">{s.topic || "A conversation"} <span className="text-xs font-normal text-brown-soft">· {s.status}</span></p>{s.inviteCode && <p className="text-sm text-brown">Invite code: <b className="font-mono tracking-widest">{s.inviteCode}</b></p>}<button className="btn btn-soft" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Close" : "Open"}</button>{open === s.id && <Session id={s.id} />}</Card>)}
    </div>
  );
}
function Session({ id }: { id: string }) {
  const s = useAsync(() => api<{ participants: number; privateNotes: string | null; myStatement: string | null; shared: boolean; others: { label: string; statement: string }[] }>(`/api/family/${id}`), [id]);
  const [notes, setNotes] = useState<string | null>(null); const [stmt, setStmt] = useState<string | null>(null); const [sum, setSum] = useState(""); const [err, setErr] = useState("");
  if (!s.data) return <Spinner />;
  const d = s.data;
  return (
    <div className="space-y-3 border-t border-line pt-3">
      <div><p className="text-sm font-semibold text-brown">Private notes (only you)</p><textarea className="field min-h-24" value={notes ?? d.privateNotes ?? ""} onChange={(e) => setNotes(e.target.value)} aria-label="Private notes" /><button className="btn btn-ghost" onClick={async () => { await api(`/api/family/${id}`, { method: "PUT", body: { privateNotes: notes ?? "" } }); s.reload(); }}>Save notes</button></div>
      <div><p className="text-sm font-semibold text-brown">My view, to share</p><p className="text-xs text-brown-soft">Say what happened, how it felt, and what you'd like. Try "I felt…" more than "you always…".</p><textarea className="field min-h-28" value={stmt ?? d.myStatement ?? ""} onChange={(e) => setStmt(e.target.value)} aria-label="My statement" />
        <div className="flex gap-2"><button className="btn btn-soft" onClick={async () => { await api(`/api/family/${id}`, { method: "PUT", body: { statement: stmt ?? "" } }); s.reload(); }}>Save</button>{!d.shared ? <button className="btn btn-primary flex-1" onClick={async () => { await api(`/api/family/${id}`, { method: "PUT", body: { statement: stmt ?? d.myStatement ?? "", share: true } }); s.reload(); }}>Share my view</button> : <button className="btn btn-ghost" onClick={async () => { await api(`/api/family/${id}`, { method: "PUT", body: { share: false } }); s.reload(); }}>Unshare</button>}</div></div>
      {d.others.map((o) => <div key={o.label} className="rounded-xl bg-peach p-3 text-sm text-brown"><b>{o.label}</b><p>{o.statement}</p></div>)}
      <button className="btn btn-soft w-full" onClick={async () => { try { setSum((await api<{ summary: string }>(`/api/family/${id}/bridge`)).summary); setErr(""); } catch (e) { setErr((e as Error).message); } }}>Show a neutral summary</button>
      {sum && <Card className="prose-soft text-brown"><p>{sum}</p></Card>}{err && <Notice tone="warn"><span role="alert">{err}</span></Notice>}
    </div>
  );
}

/* ───────── Organisation ───────── */
function Org() {
  const list = useAsync(() => api<{ items: { id: string; name: string; kind: string }[] }>("/api/institution"), []); const [code, setCode] = useState(""); const [err, setErr] = useState("");
  return (
    <div className="space-y-4">
      <Notice>If your college, workplace or community has a UDAAN code, joining lets them see only anonymous, combined numbers, and only for groups of 20 or more. They can never see you, your chats or your check-ins.</Notice>
      <Card className="space-y-2"><input className="field" placeholder="Organisation code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Organisation code" /><button className="btn btn-soft w-full" disabled={code.length < 4} onClick={async () => { try { await api("/api/institution", { body: { code } }); setCode(""); setErr(""); list.reload(); } catch (e) { setErr((e as Error).message); } }}>Join</button>{err && <p role="alert" className="text-sm text-danger">{err}</p>}</Card>
      {list.data?.items.map((i) => <Card key={i.id} className="flex items-center justify-between"><span className="text-brown">{i.name}</span><button className="btn btn-ghost" onClick={async () => { await api("/api/institution", { method: "DELETE", body: { id: i.id } }); list.reload(); }}>Leave</button></Card>)}
    </div>
  );
}
