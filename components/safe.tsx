"use client";
import { useEffect, useState } from "react";
import { useApp } from "./providers";
import { BreathingOrb } from "./tools";
import { Notice } from "./ui";

export interface Res { id: string; name: string; detail: string; phone?: string; hours: string; kind: string }

export function SafeContent({ resources, initial }: { resources: Res[]; initial?: boolean }) {
  const { t } = useApp();
  const [personal, setPersonal] = useState<{ contacts: { name: string; phone?: string }[]; plan: Record<string, string[]> } | null>(null);
  const [res, setRes] = useState(resources);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem("udaan_offline_kit"); if (raw) setPersonal(JSON.parse(raw)); } catch {}
    setOffline(!navigator.onLine);
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    if (!resources.length) fetch("/api/resources").then((r) => r.json()).then((j) => setRes(j.resources)).catch(() => {});
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [resources.length]);

  const emergency = res.filter((r) => r.kind === "emergency");
  const others = res.filter((r) => r.kind !== "emergency");
  return (
    <div className="space-y-5">
      {offline && <Notice tone="warn">{t("offline")}</Notice>}
      <p className="serif text-2xl text-brown">{t("crisis.title")}</p>
      <div className="space-y-2">
        {emergency.map((r) => (
          <a key={r.id} href={`tel:${r.phone}`} className="btn btn-primary w-full !justify-between !rounded-2xl !py-4 text-lg"><span>{r.name}</span><span>{t("call")} {r.phone}</span></a>
        ))}
        {others.map((r) => (
          <a key={r.id} href={`tel:${(r.phone ?? "").replace(/\s/g, "")}`} className="card flex items-center justify-between gap-3 p-3">
            <span><span className="block font-semibold text-brown">{r.name}</span><span className="block text-sm text-brown-soft">{r.detail} · {r.hours}</span></span>
            <span className="btn btn-soft shrink-0">{r.phone}</span>
          </a>
        ))}
      </div>
      <p className="text-xs text-brown-soft">{t("crisis.free")}</p>
      {personal && personal.contacts.length > 0 && (
        <div>
          <h3 className="mb-2 text-lg text-brown">People I chose</h3>
          <div className="space-y-2">{personal.contacts.map((c, i) => (
            c.phone ? <a key={i} className="card flex items-center justify-between p-3" href={`tel:${c.phone}`}><span className="font-semibold text-brown">{c.name}</span><span className="btn btn-soft">{t("call")}</span></a> : <div key={i} className="card p-3 font-semibold text-brown">{c.name}</div>
          ))}</div>
        </div>
      )}
      {personal?.plan && Object.values(personal.plan).some((v) => v.length) && (
        <div className="card p-4">
          <h3 className="mb-2 text-lg text-brown">My safety plan</h3>
          {([["copingSteps", "Things that help me"], ["peopleAndPlaces", "People and places that help"], ["makingSafe", "Making my space safer"], ["reasons", "My reasons"]] as const).map(([k, l]) => personal.plan[k]?.length ? (
            <div key={k} className="mb-2"><p className="text-sm font-semibold text-brown-soft">{l}</p><ul className="list-disc pl-5 text-brown">{personal.plan[k].map((x, i) => <li key={i}>{x}</li>)}</ul></div>
          ) : null)}
        </div>
      )}
      <div>
        <h3 className="mb-2 text-lg text-brown">Breathe with me</h3>
        <BreathingOrb />
      </div>
      {initial && <p className="text-center text-sm text-brown-soft">If you can, tell someone near you how you feel right now.</p>}
    </div>
  );
}
