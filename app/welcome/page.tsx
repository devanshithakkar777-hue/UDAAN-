"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { LANGS } from "@/lib/i18n";
import { Notice } from "@/components/ui";

export default function Welcome() {
  const { t, lang, setLang, refresh } = useApp(); const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("up"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [adult, setAdult] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [recovery, setRecovery] = useState(""); const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (mode === "in") { await api("/api/auth/login", { body: { email, password } }); await refresh(); router.replace("/talk"); }
      else { const r = await api<{ recoveryCode: string }>("/api/auth/signup", { body: { email, password, displayName: name || undefined, language: lang, isAdult: adult } }); setRecovery(r.recoveryCode); }
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (recovery) return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl text-brown">One important thing</h1>
      <p className="text-brown">This is your recovery code. If you ever forget your password, it's the only way back into your account, because we can't read your data or reset it for you. Save it somewhere safe.</p>
      <div className="card select-all p-5 text-center font-mono text-2xl tracking-widest text-brown" aria-label="Recovery code">{recovery}</div>
      <label className="flex items-center gap-3 text-brown"><input type="checkbox" className="h-5 w-5 accent-amber-deep" checked={saved} onChange={(e) => setSaved(e.target.checked)} />I've saved it</label>
      <button className="btn btn-primary" disabled={!saved} onClick={async () => { await refresh(); router.replace("/onboarding"); }}>{t("continue")}</button>
    </main>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
      <div className="text-center"><img src="/logo.png" alt="UDAAN — Find Your Wings" className="mx-auto h-56 w-56 rounded-3xl object-cover shadow-lg" />
        <p className="serif mt-4 text-xl text-brown">Comfort when needed. Challenge when necessary. Encourage always.</p></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && <input className="field" placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} aria-label={t("name")} autoComplete="given-name" />}
        <input className="field" type="email" required placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} aria-label={t("email")} autoComplete="email" />
        <input className="field" type="password" required minLength={mode === "up" ? 10 : 1} placeholder={`${t("password")}${mode === "up" ? " (10+ characters)" : ""}`} value={password} onChange={(e) => setPassword(e.target.value)} aria-label={t("password")} autoComplete={mode === "up" ? "new-password" : "current-password"} />
        {mode === "up" && <label className="flex items-start gap-3 text-sm text-brown"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-amber-deep" checked={adult} onChange={(e) => setAdult(e.target.checked)} required />I'm 18 or older. UDAAN is for adults.</label>}
        {err && <Notice tone="warn"><span role="alert">{err}</span></Notice>}
        <button className="btn btn-primary w-full" disabled={busy || (mode === "up" && !adult)}>{mode === "up" ? t("signup") : t("signin")}</button>
      </form>
      <button className="btn btn-ghost" onClick={() => { setMode(mode === "up" ? "in" : "up"); setErr(""); }}>{mode === "up" ? "I already have an account" : "Create a new account"}</button>
      {mode === "in" && <Link href="/recover" className="text-center text-sm text-brown-soft underline">Forgot your password? Use your recovery code</Link>}
      <div className="flex flex-wrap items-center justify-center gap-2">{LANGS.map((l) => <button key={l.id} className={`chip ${lang === l.id ? "on" : ""}`} onClick={() => setLang(l.id)}>{l.label}</button>)}</div>
      <p className="text-center text-xs text-brown-soft"><Link href="/safe" className="underline">Need help right now? No sign-in needed.</Link> · <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/transparency" className="underline">Safety</Link></p>
    </main>
  );
}
