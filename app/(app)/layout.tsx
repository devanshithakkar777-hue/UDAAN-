"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { Sheet, Spinner, cx } from "@/components/ui";
import { SafeContent } from "@/components/safe";
import { api } from "@/lib/client";

const TABS = [["/talk", "nav.talk", "💬"], ["/grow", "nav.grow", "🌱"], ["/reflect", "nav.reflect", "📔"], ["/care", "nav.care", "🤝"]] as const;

function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const go = async (p: string) => { try { await api("/api/auth/pin", { body: { pin: p } }); sessionStorage.setItem("udaan_unlocked", "1"); onUnlock(); } catch (e) { setErr((e as Error).message); setPin(""); } };
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-cream p-8">
      <p className="serif text-3xl text-brown">Enter your PIN</p>
      <div className="flex gap-3" aria-hidden>{Array.from({ length: Math.max(4, pin.length) }, (_, i) => <span key={i} className={cx("h-4 w-4 rounded-full border border-brown", i < pin.length && "bg-brown")} />)}</div>
      {err && <p role="alert" className="text-danger">{err}</p>}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "✓"].map((k) => (
          <button key={k} className="btn btn-soft !h-16 !w-16 text-xl" onClick={() => { if (k === "⌫") setPin(pin.slice(0, -1)); else if (k === "✓") { if (pin.length >= 4) void go(pin); } else if (pin.length < 8) setPin(pin + k); }} aria-label={String(k)}>{k}</button>
        ))}
      </div>
      <Link href="/safe" className="text-sm text-brown-soft underline">I need help now</Link>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading, t, low } = useApp(); const path = usePathname(); const router = useRouter();
  const [safe, setSafe] = useState(false); const [locked, setLocked] = useState(false); const hiddenAt = useRef(0); const escs = useRef<number[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!me?.user) { router.replace("/welcome"); return; }
    if (!me.profile?.onboardedAt && !path.startsWith("/onboarding")) router.replace("/onboarding");
  }, [me, loading, router, path]);

  useEffect(() => {
    if (!me?.user) return;
    api<{ hasPin: boolean }>("/api/auth/pin").then((r) => setLocked(r.hasPin && sessionStorage.getItem("udaan_unlocked") !== "1")).catch(() => {});
  }, [me?.user]);

  // Cache the personal safety kit so the Safe screen works offline.
  useEffect(() => {
    if (!me?.user) return;
    Promise.all([api<{ items: { name: string; phone?: string }[] }>("/api/contacts"), api<{ plan: Record<string, string[]> }>("/api/safety-plan")])
      .then(([c, p]) => localStorage.setItem("udaan_offline_kit", JSON.stringify({ contacts: c.items.map((x) => ({ name: x.name, phone: x.phone ?? undefined })), plan: p.plan }))).catch(() => {});
  }, [me?.user, path]);

  useEffect(() => {
    const vis = () => { if (document.hidden) hiddenAt.current = Date.now(); else if (hiddenAt.current && Date.now() - hiddenAt.current > 120000) { api<{ hasPin: boolean }>("/api/auth/pin").then((r) => { if (r.hasPin) { sessionStorage.removeItem("udaan_unlocked"); setLocked(true); } }).catch(() => {}); } };
    const key = (e: KeyboardEvent) => { if (e.key !== "Escape") return; const n = Date.now(); escs.current = [...escs.current.filter((x) => n - x < 900), n]; if (escs.current.length >= 2 && !safe) router.push("/hide"); };
    document.addEventListener("visibilitychange", vis); window.addEventListener("keydown", key);
    return () => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("keydown", key); };
  }, [router, safe]);

  if (loading || !me?.user) return <Spinner />;
  if (locked) return <PinLock onUnlock={() => setLocked(false)} />;
  const chat = path.startsWith("/talk");
  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="safe-t flex items-center justify-between px-4 py-2">
        <Link href="/talk" className="serif flex items-center gap-2 text-xl text-brown"><img src="/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />{me.profile?.discreetMode ? (me.profile.discreetName || "Notes") : "UDAAN"}</Link>
        <div className="flex items-center gap-1">
          <Link href="/hide" className="btn btn-ghost !min-h-10 !px-3 text-sm" aria-label="Quick hide">{t("hide")}</Link>
          <Link href="/me" className="btn btn-ghost !min-h-10 !px-3" aria-label="Settings">⚙︎</Link>
          <button className="btn btn-primary !min-h-10 !bg-danger !px-4 text-sm" onClick={() => setSafe(true)}>{t("safe.short")}</button>
        </div>
      </header>
      {low && <div className="mx-4 mb-1 rounded-xl bg-peach px-3 py-1 text-center text-xs text-brown">{t("low.on")}</div>}
      <main className={cx("min-h-0 flex-1", chat ? "flex flex-col" : "overflow-y-auto px-4 pb-6 pt-2")}>{children}</main>
      <nav className="safe-b grid grid-cols-4 border-t border-line bg-cream" aria-label="Main">
        {TABS.map(([href, k, icon]) => { const on = path.startsWith(href); return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", on ? "font-semibold text-brown" : "text-brown-soft")}>
            <span className="text-xl" aria-hidden>{icon}</span>{t(k)}</Link>
        ); })}
      </nav>
      <Sheet open={safe} onClose={() => setSafe(false)} title={t("safe")}><SafeContent resources={[]} /></Sheet>
    </div>
  );
}
