"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Card, Empty, Notice, Section, Spinner, useAsync } from "@/components/ui";

interface Client { grantId: string; clientRef: string; name: string; scope: string[]; mood?: { checkIns: number; average: number | null; lowDays: number; note: string }; sleep?: { nights: number; avgQuality: number | null }; exercises?: { id: string; title: string; done: boolean; note: string | null }[]; prep?: string[] }
export default function Pro() {
  const { me, loading } = useApp(); const ok = me?.user?.role === "professional" || me?.user?.role === "admin";
  const d = useAsync(() => (ok ? api<{ professional: { name: string }; clients: Client[]; bookings: { id: string; mode: string; status: string; message: string | null; from: string }[] }>("/api/pro/clients") : Promise.resolve(null)), [ok]);
  const [ex, setEx] = useState<Record<string, string>>({}); const [msg, setMsg] = useState("");
  if (loading) return <Spinner />;
  if (!ok) return <main className="p-6"><Notice tone="warn">This area is for verified professionals. Apply from the Care tab's professional directory flow once available, or ask an administrator.</Notice><Link href="/talk" className="btn btn-soft mt-3">Back</Link></main>;
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4">
      <div className="flex justify-between"><h1 className="text-3xl text-brown">Your clients</h1><Link href="/talk" className="text-sm underline">Back to app</Link></div>
      <Notice>You only see what each client has chosen to share with you, for the period they chose. You never see their conversations, journals or private logs. Self-reported check-ins are not a clinical measure.</Notice>
      {!d.data ? <Spinner /> : <>
        <Section title="Session requests">{!d.data.bookings.length ? <Empty>No requests.</Empty> : d.data.bookings.map((b) => <Card key={b.id} className="mb-2 text-brown"><p className="text-xs text-brown-soft">Client {b.from} · {b.mode} · {b.status}</p>{b.message && <p>{b.message}</p>}</Card>)}</Section>
        <Section title="Clients who've shared with you">{!d.data.clients.length ? <Empty>No one has shared anything with you yet.</Empty> : d.data.clients.map((c) => (
          <Card key={c.grantId} className="mb-3 space-y-2"><p className="font-semibold text-brown">{c.name} <span className="text-xs font-normal text-brown-soft">· sharing: {c.scope.join(", ").replaceAll("_", " ")}</span></p>
            {c.mood && <p className="text-sm text-brown">Mood (30 days): {c.mood.checkIns} check-ins, average {c.mood.average ?? "–"}/5, {c.mood.lowDays} low days.</p>}
            {c.sleep && <p className="text-sm text-brown">Sleep (30 days): {c.sleep.nights} nights logged, average quality {c.sleep.avgQuality ?? "–"}/5.</p>}
            {c.prep?.map((p, i) => <p key={i} className="whitespace-pre-wrap rounded-xl bg-peach p-2 text-sm text-brown">{p}</p>)}
            {c.exercises?.map((e) => <p key={e.id} className="text-sm text-brown">{e.done ? "✓" : "○"} {e.title}{e.note && <span className="text-brown-soft"> — {e.note}</span>}</p>)}
            {c.scope.includes("assigned_exercises") && <div className="flex gap-2"><input className="field !min-h-10" placeholder="Assign an exercise between sessions" value={ex[c.grantId] ?? ""} onChange={(e) => setEx({ ...ex, [c.grantId]: e.target.value })} aria-label="Exercise title" /><button className="btn btn-soft" disabled={!(ex[c.grantId] ?? "").trim()} onClick={async () => { await api("/api/pro/exercises", { body: { grantId: c.grantId, title: ex[c.grantId] } }); setEx({ ...ex, [c.grantId]: "" }); setMsg("Assigned."); d.reload(); }}>Assign</button></div>}</Card>))}{msg && <p className="text-sm text-sage">{msg}</p>}</Section></>}
    </main>
  );
}
