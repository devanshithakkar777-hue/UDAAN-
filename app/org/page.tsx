"use client";
import Link from "next/link";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Card, Empty, Notice, Section, Spinner, useAsync } from "@/components/ui";

export default function Org() {
  const { me, loading } = useApp(); const ok = me?.user?.role === "institution_admin" || me?.user?.role === "admin";
  const d = useAsync(() => (ok ? api<{ organisation: string; suppressed: boolean; reason?: string; cohort?: number; activeLast90Days?: number; weeklyCheckInAverage?: { week: string; average: number; contributors: number }[]; programmeUse?: { category: string; contributors: number }[]; note?: string }>("/api/institution/dashboard") : Promise.resolve(null)), [ok]);
  if (loading) return <Spinner />;
  if (!ok) return <main className="p-6"><Notice tone="warn">You don't have access to this page.</Notice><Link href="/talk" className="btn btn-soft mt-3">Back</Link></main>;
  const x = d.data;
  return (
    <main className="mx-auto max-w-3xl space-y-5 p-4">
      <div className="flex justify-between"><h1 className="text-3xl text-brown">{x?.organisation ?? "Organisation"} wellbeing overview</h1><Link href="/talk" className="text-sm underline">Back to app</Link></div>
      <Notice>Combined and anonymous. Nothing here identifies anyone, and groups smaller than 5 are hidden. This is not a tool for monitoring individuals.</Notice>
      {!x ? <Spinner /> : x.suppressed ? <Empty>{x.reason}</Empty> : <>
        <div className="grid grid-cols-2 gap-3"><Card><p className="text-sm text-brown-soft">People joined</p><p className="serif text-3xl text-brown">{x.cohort}</p></Card><Card><p className="text-sm text-brown-soft">Active in last 90 days</p><p className="serif text-3xl text-brown">{x.activeLast90Days}</p></Card></div>
        <Section title="Weekly self-reported mood (1–5, average)">{x.weeklyCheckInAverage?.length ? <ul className="space-y-1">{x.weeklyCheckInAverage.map((w) => <li key={w.week} className="card flex justify-between p-2 px-3 text-brown"><span>Week of {w.week}</span><span>{w.average} <span className="text-xs text-brown-soft">({w.contributors} people)</span></span></li>)}</ul> : <Empty>Not enough data yet.</Empty>}</Section>
        <Section title="What people are using">{x.programmeUse?.length ? <ul className="space-y-1">{x.programmeUse.map((m) => <li key={m.category} className="card flex justify-between p-2 px-3 text-brown"><span>{m.category}</span><span>{m.contributors} people</span></li>)}</ul> : <Empty>Not enough data yet.</Empty>}</Section>
        <p className="text-xs text-brown-soft">{x.note}</p></>}
    </main>
  );
}
