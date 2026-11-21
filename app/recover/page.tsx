"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Notice } from "@/components/ui";

export default function Recover() {
  const { refresh } = useApp(); const router = useRouter();
  const [email, setEmail] = useState(""), [code, setCode] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(""), [fresh, setFresh] = useState("");
  const go = async (e: React.FormEvent) => { e.preventDefault(); setErr(""); try { const r = await api<{ recoveryCode: string }>("/api/auth/recover", { body: { email, recoveryCode: code, newPassword: pw } }); setFresh(r.recoveryCode); } catch (e) { setErr((e as Error).message); } };
  if (fresh) return (<main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6"><h1 className="text-3xl text-brown">Password changed</h1><p className="text-brown">Your old recovery code no longer works. Here is your new one. Save it somewhere safe.</p><div className="card select-all p-5 text-center font-mono text-2xl tracking-widest">{fresh}</div><button className="btn btn-primary" onClick={async () => { await refresh(); router.replace("/talk"); }}>Continue</button></main>);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl text-brown">Reset with your recovery code</h1>
      <form onSubmit={go} className="space-y-3">
        <input className="field" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <input className="field font-mono" required placeholder="XXXX-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Recovery code" />
        <input className="field" type="password" required minLength={10} placeholder="New password (10+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" autoComplete="new-password" />
        {err && <Notice tone="warn"><span role="alert">{err}</span></Notice>}
        <button className="btn btn-primary w-full">Reset password</button>
      </form>
      <Notice>If you've lost both your password and your recovery code, your encrypted data can't be recovered, by design. You can create a new account.</Notice>
      <Link href="/welcome" className="text-center text-sm text-brown-soft underline">Back</Link>
    </main>
  );
}
