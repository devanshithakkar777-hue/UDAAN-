"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import { tr, type Lang } from "@/lib/i18n";

export interface Me {
  user: { id: string; email: string; role: string; displayName: string | null } | null;
  profile: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
}
interface Ctx { me: Me | null; loading: boolean; refresh: () => Promise<void>; lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void; calm: boolean; setCalm: (b: boolean) => void; textScale: number; setTextScale: (n: number) => void; low: boolean; setLow: (b: boolean) => void }
const AppCtx = createContext<Ctx>(null as never);
export const useApp = () => useContext(AppCtx);

export function Providers({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Lang>("en");
  const [calm, setCalmState] = useState(false);
  const [textScale, setTextScaleState] = useState(1);
  const [lowLocal, setLowLocal] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try { setMe(await api<Me>("/api/auth/me")); } catch { setMe({ user: null, profile: null }); }
    setLoading(false);
  }, []);

  useEffect(() => {
    try {
      const l = localStorage.getItem("udaan_lang") as Lang | null; if (l) setLangState(l);
      setCalmState(localStorage.getItem("udaan_calm") === "1");
      setTextScaleState(Number(localStorage.getItem("udaan_scale") ?? 1) || 1);
    } catch {}
    void refresh();
    if ("serviceWorker" in navigator && location.protocol !== "http:" || location.hostname === "localhost") navigator.serviceWorker?.register("/sw.js").catch(() => {});
  }, [refresh]);

  useEffect(() => { const l = me?.profile?.language as Lang | undefined; if (l && !localStorage.getItem("udaan_lang")) setLangState(l); }, [me]);

  const low = lowLocal ?? !!me?.profile?.lowEnergyMode;
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang; el.dataset.low = low ? "1" : "0"; el.dataset.calm = calm ? "1" : "0";
    el.style.setProperty("--text-scale", String(textScale));
  }, [lang, low, calm, textScale]);
  useEffect(() => { document.title = me?.profile?.discreetMode ? (me.profile.discreetName || "Notes") : "UDAAN — Find Your Wings"; }, [me]);

  const value = useMemo<Ctx>(() => ({
    me, loading, refresh, lang, t: (k) => tr(lang, k),
    setLang: (l) => { setLangState(l); try { localStorage.setItem("udaan_lang", l); } catch {} void api("/api/profile", { method: "PATCH", body: { language: l } }).catch(() => {}); },
    calm, setCalm: (b) => { setCalmState(b); try { localStorage.setItem("udaan_calm", b ? "1" : "0"); } catch {} },
    textScale, setTextScale: (n) => { setTextScaleState(n); try { localStorage.setItem("udaan_scale", String(n)); } catch {} },
    low, setLow: (b) => { setLowLocal(b); void api("/api/profile", { method: "PATCH", body: { lowEnergyMode: b } }).then(refresh).catch(() => {}); },
  }), [me, loading, refresh, lang, calm, textScale, low]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
