"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Card, Empty, Notice, Section, Spinner, cx, useAsync } from "@/components/ui";

const TABS = ["Overview", "Content", "Professionals", "Moderation", "Incidents", "Organisations", "Controls", "Users", "Audit"] as const;
type Tab = (typeof TABS)[number];

export default function Admin() {
  const { me, loading } = useApp(); const [tab, setTab] = useState<Tab>("Overview");
  if (loading) return <Spinner />;
  const role = me?.user?.role;
  if (role !== "admin" && role !== "moderator") return <main className="p-6"><Notice tone="warn">You don't have access to this page.</Notice><Link href="/talk" className="btn btn-soft mt-3">Back</Link></main>;
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between"><h1 className="text-3xl text-brown">UDAAN console</h1><Link href="/talk" className="text-sm underline">Back to app</Link></div>
      <div className="flex flex-wrap gap-2" role="tablist">{TABS.filter((t) => role === "admin" || t === "Overview" || t === "Moderation").map((t) => <button key={t} role="tab" aria-selected={tab === t} className={cx("chip", tab === t && "on")} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "Overview" && <Overview />}{tab === "Content" && <Content />}{tab === "Professionals" && <Pros />}{tab === "Moderation" && <Moderation />}{tab === "Incidents" && <Incidents />}{tab === "Organisations" && <Orgs />}{tab === "Controls" && <Controls />}{tab === "Users" && <Users />}{tab === "Audit" && <Audit />}
    </main>
  );
}

function Overview() {
  const o = useAsync(() => api<{ users: number; activeLast7Days: number; openIncidents: number; pendingProfessionals: number; heldPosts: number; openReports: number; safetyLast30Days: { imminent: number; elevated: number }; launchChecks: { aiProvider: string; crisisResourcesVerifiedFlag: boolean; unverifiedResources: string[]; vapidConfigured: boolean } }>("/api/admin/overview"), []);
  if (!o.data) return <Spinner />; const d = o.data; const lc = d.launchChecks;
  const Stat = ({ l, v }: { l: string; v: number | string }) => <Card><p className="text-sm text-brown-soft">{l}</p><p className="serif text-3xl text-brown">{v}</p></Card>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat l="Users" v={d.users} /><Stat l="Active (7d)" v={d.activeLast7Days} /><Stat l="Open incidents" v={d.openIncidents} /><Stat l="Pending professionals" v={d.pendingProfessionals} /><Stat l="Held posts" v={d.heldPosts} /><Stat l="Open reports" v={d.openReports} /><Stat l="Imminent (30d)" v={d.safetyLast30Days.imminent} /><Stat l="Elevated (30d)" v={d.safetyLast30Days.elevated} /></div>
      <Section title="Launch readiness">
        <ul className="space-y-1 text-brown">
          {[[lc.aiProvider !== "mock", `AI provider: ${lc.aiProvider}`], [lc.crisisResourcesVerifiedFlag && !lc.unverifiedResources.length, lc.unverifiedResources.length ? `${lc.unverifiedResources.length} crisis resources not yet verified` : "Crisis resources verified"], [lc.vapidConfigured, "Push notifications configured"]].map(([ok, t], i) => <li key={i} className="card flex gap-2 p-3"><span aria-hidden>{ok ? "✅" : "⚠️"}</span>{String(t)}</li>)}
        </ul>
        {lc.unverifiedResources.length > 0 && <p className="mt-2 text-sm text-brown-soft">Unverified: {lc.unverifiedResources.join(", ")}. Call each number and set verified in code before launch.</p>}
      </Section>
    </div>
  );
}

interface CI { id: string; slug: string; type: string; title: string; bodyMd: string; status: string; source: string; reviewer: string | null }
function Content() {
  const c = useAsync(() => api<{ items: CI[] }>("/api/admin/content"), []); const [rev, setRev] = useState<Record<string, string>>({}); const [open, setOpen] = useState<string | null>(null); const [err, setErr] = useState("");
  const [n, setN] = useState({ slug: "", title: "", type: "general_education", bodyMd: "", source: "", topics: "" });
  const act = async (id: string, status: string) => { try { await api(`/api/admin/content/${id}`, { method: "PATCH", body: { status, reviewer: rev[id] || undefined } }); setErr(""); c.reload(); } catch (e) { setErr((e as Error).message); } };
  return (
    <div className="space-y-4"><Notice>The companion uses only <b>approved</b> items, and only after a named clinician has reviewed them. Drafts are never shown.</Notice>{err && <Notice tone="warn">{err}</Notice>}
      {c.data?.items.map((i) => <Card key={i.id} className="space-y-2"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-brown">{i.title}</p><p className="text-xs text-brown-soft">{i.type} · {i.source} · <b>{i.status}</b>{i.reviewer && ` · reviewed by ${i.reviewer}`}</p></div><button className="text-sm underline" onClick={() => setOpen(open === i.id ? null : i.id)}>{open === i.id ? "Hide" : "Read"}</button></div>
        {open === i.id && <p className="whitespace-pre-wrap text-sm text-brown">{i.bodyMd}</p>}
        <div className="flex flex-wrap gap-2"><input className="field !min-h-10 flex-1" placeholder="Reviewer name and credential" value={rev[i.id] ?? i.reviewer ?? ""} onChange={(e) => setRev({ ...rev, [i.id]: e.target.value })} aria-label="Reviewer" /><button className="btn btn-soft" onClick={() => act(i.id, "approved")}>Approve</button><button className="btn btn-ghost" onClick={() => act(i.id, "draft")}>Draft</button><button className="btn btn-ghost" onClick={() => act(i.id, "retired")}>Retire</button></div></Card>)}
      <Section title="Add content"><Card className="space-y-2"><div className="grid grid-cols-2 gap-2"><input className="field" placeholder="slug-like-this" value={n.slug} onChange={(e) => setN({ ...n, slug: e.target.value })} aria-label="Slug" /><input className="field" placeholder="Title" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} aria-label="Title" /></div>
        <select className="field" value={n.type} onChange={(e) => setN({ ...n, type: e.target.value })} aria-label="Type">{["general_education", "self_help", "professional_guidance", "emergency_protocol"].map((x) => <option key={x}>{x}</option>)}</select>
        <input className="field" placeholder="Source (e.g. WHO mhGAP)" value={n.source} onChange={(e) => setN({ ...n, source: e.target.value })} aria-label="Source" /><input className="field" placeholder="Topics, comma separated" value={n.topics} onChange={(e) => setN({ ...n, topics: e.target.value })} aria-label="Topics" />
        <textarea className="field min-h-32" placeholder="Body (markdown)" value={n.bodyMd} onChange={(e) => setN({ ...n, bodyMd: e.target.value })} aria-label="Body" />
        <button className="btn btn-primary" disabled={!n.slug || !n.title || !n.bodyMd || !n.source} onClick={async () => { await api("/api/admin/content", { body: { ...n, topics: n.topics.split(",").map((x) => x.trim()).filter(Boolean) } }); setN({ slug: "", title: "", type: "general_education", bodyMd: "", source: "", topics: "" }); c.reload(); }}>Save as draft</button></Card></Section></div>
  );
}

function Pros() {
  const p = useAsync(() => api<{ items: { id: string; name: string; credentialType: string; registrationBody: string; registrationNo: string; qualifications: string; status: string; city: string | null }[] }>("/api/admin/professionals"), []);
  return (
    <div className="space-y-3"><Notice>Verify the registration number with the issuing body (e.g. RCI, NMC, state council) yourself before marking verified.</Notice>
      {!p.data?.items.length ? <Empty>No applications.</Empty> : p.data.items.map((x) => <Card key={x.id} className="space-y-1"><p className="font-semibold text-brown">{x.name} <span className="text-xs font-normal text-brown-soft">· {x.credentialType} · {x.status}</span></p><p className="text-sm text-brown">{x.registrationBody} · No. {x.registrationNo}</p><p className="text-sm text-brown-soft">{x.qualifications}</p>
        <div className="flex gap-2">{["verified", "rejected", "suspended"].map((s) => <button key={s} className={cx("btn", s === "verified" ? "btn-primary" : "btn-ghost")} onClick={async () => { await api(`/api/admin/professionals/${x.id}`, { method: "PATCH", body: { status: s } }); p.reload(); }}>{s}</button>)}</div></Card>)}</div>
  );
}

function Moderation() {
  const m = useAsync(() => api<{ held: { id: string; handle: string; body: string; riskLevel: number }[]; reports: { id: string; postId: string; reason: string; body: string; handle: string }[]; stories: { id: string; title: string; body: string }[] }>("/api/admin/community"), []);
  const post = async (id: string, action: string, reportId?: string) => { await api(`/api/admin/reports/${id}`, { method: "PATCH", body: { action, reportId } }); m.reload(); };
  if (!m.data) return <Spinner />;
  return (
    <div className="space-y-5">
      <Section title={`Held posts (${m.data.held.length})`}>{m.data.held.map((p) => <Card key={p.id} className="mb-2 space-y-2"><p className="text-xs text-brown-soft">{p.handle} · risk {p.riskLevel}</p><p className="text-brown">{p.body}</p><div className="flex gap-2"><button className="btn btn-soft" onClick={() => post(p.id, "approve")}>Approve</button><button className="btn btn-ghost" onClick={() => post(p.id, "remove")}>Remove</button><button className="btn btn-ghost" onClick={() => post(p.id, "mute_author")}>Remove + mute 7d</button></div></Card>)}{!m.data.held.length && <Empty>Nothing waiting.</Empty>}</Section>
      <Section title={`Reports (${m.data.reports.length})`}>{m.data.reports.map((r) => <Card key={r.id} className="mb-2 space-y-2"><p className="text-xs text-brown-soft">{r.handle} · {r.reason}</p><p className="text-brown">{r.body}</p><div className="flex gap-2"><button className="btn btn-soft" onClick={() => post(r.postId, "approve", r.id)}>Dismiss</button><button className="btn btn-ghost" onClick={() => post(r.postId, "remove", r.id)}>Remove</button><button className="btn btn-ghost" onClick={() => post(r.postId, "mute_author", r.id)}>Remove + mute</button></div></Card>)}{!m.data.reports.length && <Empty>No open reports.</Empty>}</Section>
      <Section title={`Stories awaiting review (${m.data.stories.length})`}>{m.data.stories.map((s) => <Card key={s.id} className="mb-2 space-y-2"><p className="font-semibold text-brown">{s.title}</p><p className="whitespace-pre-wrap text-sm text-brown">{s.body}</p><div className="flex gap-2"><button className="btn btn-soft" onClick={async () => { await api(`/api/admin/stories/${s.id}`, { method: "PATCH", body: { status: "published" } }); m.reload(); }}>Publish</button><button className="btn btn-ghost" onClick={async () => { await api(`/api/admin/stories/${s.id}`, { method: "PATCH", body: { status: "rejected" } }); m.reload(); }}>Reject</button></div></Card>)}{!m.data.stories.length && <Empty>None.</Empty>}</Section>
    </div>
  );
}

function Incidents() {
  const i = useAsync(() => api<{ items: { id: string; status: string; level?: number; signals?: string[]; stage?: string; action?: string; notes: string | null; createdAt: string }[] }>("/api/admin/incidents"), []); const [notes, setNotes] = useState<Record<string, string>>({});
  return (
    <div className="space-y-3"><Notice>Content-free by design: level, signal codes and action taken. You will not see anyone's words.</Notice>
      {!i.data?.items.length ? <Empty>No incidents.</Empty> : i.data.items.map((x) => <Card key={x.id} className="space-y-2"><p className="text-sm text-brown"><b>Level {x.level ?? "?"}</b> · {x.stage} · {x.action} · {new Date(x.createdAt).toLocaleString()} · <b>{x.status}</b></p><p className="text-xs text-brown-soft">{x.signals?.join(", ")}</p>
        <input className="field !min-h-10" placeholder="Notes" value={notes[x.id] ?? x.notes ?? ""} onChange={(e) => setNotes({ ...notes, [x.id]: e.target.value })} aria-label="Notes" />
        <div className="flex gap-2">{["open", "reviewing", "closed"].map((s) => <button key={s} className={cx("chip", x.status === s && "on")} onClick={async () => { await api(`/api/admin/incidents/${x.id}`, { method: "PATCH", body: { status: s, notes: notes[x.id] } }); i.reload(); }}>{s}</button>)}</div></Card>)}</div>
  );
}

function Orgs() {
  const o = useAsync(() => api<{ items: { id: string; name: string; kind: string; joinCode: string; minCohort: number }[] }>("/api/admin/institutions"), []); const [n, setN] = useState({ name: "", kind: "university", minCohort: 20 });
  return (
    <div className="space-y-3">{o.data?.items.map((x) => <Card key={x.id} className="flex justify-between"><span className="text-brown">{x.name} <span className="text-xs text-brown-soft">· {x.kind} · min cohort {x.minCohort}</span></span><span className="font-mono tracking-widest text-brown">{x.joinCode}</span></Card>)}
      <Card className="space-y-2"><input className="field" placeholder="Organisation name" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} aria-label="Name" /><select className="field" value={n.kind} onChange={(e) => setN({ ...n, kind: e.target.value })} aria-label="Kind">{["university", "employer", "school", "ngo", "clinic"].map((k) => <option key={k}>{k}</option>)}</select>
        <button className="btn btn-primary" disabled={n.name.length < 2} onClick={async () => { await api("/api/admin/institutions", { body: n }); setN({ ...n, name: "" }); o.reload(); }}>Create and generate join code</button></Card></div>
  );
}

function Controls() {
  const s = useAsync(() => api<{ settings: { key: string; value: string }[]; modules: { id: string; title: string; gated: boolean }[] }>("/api/admin/settings"), []); const [v, setV] = useState<Record<string, string>>({});
  const get = (k: string) => s.data?.settings.find((x) => x.key === k)?.value ?? "";
  const put = async (key: string, value: string) => { await api("/api/admin/settings", { method: "PUT", body: { key, value } }); s.reload(); };
  const list = (k: string) => get(k).split(",").map((x) => x.trim()).filter(Boolean);
  if (!s.data) return <Spinner />;
  return (
    <div className="space-y-5"><Notice>Changes take effect within about 30 seconds, with no deploy. This is also the rollback lever: disable a module or switch the model instantly.</Notice>
      {[["main_model", "Main model"], ["classifier_model", "Classifier model"], ["persona_note", "Extra persona note (appended to the system prompt)"]].map(([k, l]) => <Card key={k} className="space-y-2"><p className="font-semibold text-brown">{l}</p><input className="field" value={v[k] ?? get(k)} onChange={(e) => setV({ ...v, [k]: e.target.value })} aria-label={l} /><button className="btn btn-soft" onClick={() => put(k, v[k] ?? get(k))}>Save</button></Card>)}
      <Section title="Modules" hint="Gated modules stay hidden until enabled. Enable only after clinician review.">
        <div className="space-y-1">{s.data.modules.map((m) => { const on = m.gated ? list("enabled_modules").includes(m.id) : !list("disabled_modules").includes(m.id); return (
          <label key={m.id} className="card flex items-center justify-between p-2 px-3 text-brown"><span>{m.title}{m.gated && <span className="ml-1 text-xs text-amber-deep">gated</span>}</span><input type="checkbox" className="h-5 w-5 accent-amber-deep" checked={on} onChange={() => { const k = m.gated ? "enabled_modules" : "disabled_modules"; const cur = list(k); put(k, (m.gated ? (on ? cur.filter((x) => x !== m.id) : [...cur, m.id]) : (on ? [...cur, m.id] : cur.filter((x) => x !== m.id))).join(",")); }} /></label>); })}</div></Section>
    </div>
  );
}

function Users() {
  const u = useAsync(() => api<{ items: { id: string; email: string; role: string; lastSeenAt: string | null; disabledAt: string | null }[] }>("/api/admin/users"), []);
  return (
    <div className="space-y-2"><Notice>Account metadata only. No content is ever available here.</Notice>
      {u.data?.items.map((x) => <Card key={x.id} className="flex flex-wrap items-center justify-between gap-2 p-3"><span className="text-sm text-brown">{x.email} {x.disabledAt && <b className="text-danger">· disabled</b>}</span>
        <span className="flex gap-2"><select className="field !min-h-9 !w-auto" value={x.role} aria-label="Role" onChange={async (e) => { await api("/api/admin/users", { method: "PATCH", body: { userId: x.id, role: e.target.value } }); u.reload(); }}>{["user", "professional", "moderator", "institution_admin", "admin"].map((r) => <option key={r}>{r}</option>)}</select>
          <button className="btn btn-ghost !min-h-9" onClick={async () => { await api("/api/admin/users", { method: "PATCH", body: { userId: x.id, disabled: !x.disabledAt } }); u.reload(); }}>{x.disabledAt ? "Enable" : "Disable"}</button></span></Card>)}</div>
  );
}

function Audit() {
  const a = useAsync(() => api<{ items: { id: string; action: string; createdAt: string; meta: unknown }[] }>("/api/admin/audit"), []);
  return <ul className="space-y-1 text-xs text-brown">{a.data?.items.map((x) => <li key={x.id} className="card p-2"><b>{x.action}</b> · {new Date(x.createdAt).toLocaleString()} <span className="text-brown-soft">{x.meta ? JSON.stringify(x.meta) : ""}</span></li>)}</ul>;
}
