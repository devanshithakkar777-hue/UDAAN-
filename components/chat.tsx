"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, chatStream, ApiError } from "@/lib/client";
import { useApp } from "./providers";
import { cx, Notice, Spinner } from "./ui";

interface Msg { id: string; role: "user" | "assistant"; text: string; level?: number; crisis?: boolean; why?: string | null; whyOpen?: boolean }
const STYLES: [string, string][] = [["listener", "Listener"], ["guide", "Guide"], ["coach", "Coach"], ["companion", "Companion"], ["grounding", "Grounding"]];

/** Turns phone numbers in crisis text into tap-to-call links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(\b1800[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{4}\s\d{3}\s\d{3}\b|\b\d{10}\b|\b14416\b|\b112\b|\b181\b|\b1098\b)/g);
  return <>{parts.map((p, i) => (i % 2 ? <a key={i} href={`tel:${p.replace(/[\s-]/g, "")}`} className="font-semibold underline">{p}</a> : <span key={i}>{p}</span>))}</>;
}

declare global { interface Window { webkitSpeechRecognition?: new () => SpeechRec; SpeechRecognition?: new () => SpeechRec } }
interface SpeechRec { lang: string; interimResults: boolean; continuous: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; start(): void; stop(): void }

export function Chat({ moduleId, conversationId, opener, starters, title }: { moduleId?: string; conversationId?: string; opener?: string; starters?: string[]; title?: string }) {
  const { me, lang, t, low } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const [convId, setConvId] = useState<string | undefined>(conversationId); const [loading, setLoading] = useState(!!conversationId);
  const [error, setError] = useState(""); const [style, setStyle] = useState<string | undefined>(undefined); const [listenOnly, setListenOnly] = useState(false);
  const [listening, setListening] = useState(false); const [showStyle, setShowStyle] = useState(false);
  const end = useRef<HTMLDivElement>(null); const abort = useRef<AbortController | null>(null); const rec = useRef<SpeechRec | null>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);
  useEffect(() => {
    if (!conversationId) return;
    api<{ messages: { id: string; role: "user" | "assistant"; text: string; level: number }[] }>(`/api/conversations/${conversationId}`)
      .then((r) => setMsgs(r.messages.map((m) => ({ id: m.id, role: m.role, text: m.text, level: m.level, crisis: m.role === "assistant" && m.level >= 2 })))).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [conversationId]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim(); if (!text || busy) return;
    setInput(""); setError(""); setBusy(true);
    const uid = `u${Date.now()}`, aid = `a${Date.now()}`;
    setMsgs((m) => [...m, { id: uid, role: "user", text }, { id: aid, role: "assistant", text: "" }]);
    abort.current = new AbortController();
    try {
      for await (const ev of chatStream({ text, conversationId: convId, moduleId, style: listenOnly ? "listener" : style }, abort.current.signal)) {
        if (ev.type === "meta") { setConvId(ev.conversationId as string); }
        else if (ev.type === "delta") setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text: x.text + (ev.text as string) } : x)));
        else if (ev.type === "replace") setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, text: ev.text as string } : x)));
        else if (ev.type === "final") setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, id: ev.messageId as string, text: ev.text as string, crisis: !!ev.crisis } : x)));
        else if (ev.type === "error") { setError(ev.message as string); setMsgs((m) => m.filter((x) => x.id !== aid || x.text)); }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setError(e instanceof ApiError ? e.message : "I couldn't reach UDAAN. Your message wasn't sent. Please try again."); setMsgs((m) => m.filter((x) => x.id !== aid)); setInput(text); }
    }
    setBusy(false);
  }, [busy, convId, moduleId, style, listenOnly]);

  const why = async (m: Msg) => {
    if (m.why) { setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, whyOpen: !x.whyOpen } : x))); return; }
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, whyOpen: true, why: "…" } : x)));
    try { const r = await api<{ text: string }>("/api/chat/explain", { body: { messageId: m.id } }); setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, why: r.text } : x))); }
    catch { setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, why: "I couldn't explain that just now." } : x))); }
  };

  const mic = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setError("Voice typing isn't supported in this browser."); return; }
    if (listening) { rec.current?.stop(); return; }
    const r = new SR(); r.lang = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", gu: "gu-IN" }[lang]; r.interimResults = false; r.continuous = false;
    r.onresult = (e) => { const tx = Array.from(e.results).map((x) => x[0].transcript).join(" "); setInput((v) => (v ? v + " " : "") + tx); };
    r.onend = () => setListening(false); rec.current = r; setListening(true); r.start();
  };

  const empty = !loading && msgs.length === 0;
  return (
    <div className="flex h-full min-h-0 flex-col">
      {title && <h1 className="px-4 pt-2 text-2xl text-brown">{title}</h1>}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" role="log" aria-live="polite" aria-label="Conversation">
        {loading && <Spinner />}
        {empty && (
          <div className="fade-in space-y-4 pt-6 text-center">
            <p className="serif text-3xl text-brown">{me?.user?.displayName ? `${me.user.displayName}, ` : ""}{opener ?? t("talk.greeting")}</p>
            {!moduleId && <div className="mx-auto flex max-w-sm flex-col gap-2">
              {(starters ?? ["I had a rough day", "I'm anxious about something tomorrow", "I'm not sure what I'm feeling", "Something someone said is bothering me"]).map((s) => <button key={s} className="btn btn-soft" onClick={() => send(s)}>{s}</button>)}
            </div>}
            {moduleId && starters && <div className="mx-auto flex max-w-sm flex-col gap-2">{starters.map((s) => <button key={s} className="btn btn-soft" onClick={() => send(s)}>{s}</button>)}</div>}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={cx("fade-in flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cx("max-w-[88%] rounded-3xl px-4 py-3", m.role === "user" ? "rounded-br-lg bg-brown text-cream" : m.crisis ? "card rounded-bl-lg border-amber bg-[#fff1df]" : "card rounded-bl-lg")}>
              <div className={cx("prose-soft", m.role === "assistant" && "text-ink")}>{m.text ? <p><Linkified text={m.text} /></p> : <span className="dot-pulse text-brown-soft" aria-label="UDAAN is thinking">● ● ●</span>}</div>
              {m.crisis && <Link href="/safe" className="btn btn-primary mt-2 w-full">{t("safe")}</Link>}
              {m.role === "assistant" && m.text && !m.crisis && m.id.length > 20 && (
                <div className="mt-1"><button className="text-xs text-brown-soft underline" onClick={() => why(m)}>{t("talk.why")}</button>
                  {m.whyOpen && <p className="fade-in mt-2 rounded-xl bg-peach p-3 text-sm text-brown">{m.why}</p>}</div>
              )}
            </div>
          </div>
        ))}
        {error && <Notice tone="warn">{error}</Notice>}
        <div ref={end} />
      </div>

      <div className="border-t border-line bg-cream/95 px-3 pb-2 pt-2 backdrop-blur">
        <div className="mb-2 flex flex-wrap items-center gap-2 hide-low">
          <button className="chip" aria-pressed={listenOnly} onClick={() => setListenOnly(!listenOnly)}>{listenOnly ? t("talk.listen") + " ✓" : t("talk.listen")}</button>
          <button className="chip" onClick={() => setShowStyle(!showStyle)} aria-expanded={showStyle}>Style{style ? `: ${style}` : ""}</button>
          <Link className="chip" href="/grow/overload">{t("overload.title")}</Link>
        </div>
        {showStyle && <div className="mb-2 flex flex-wrap gap-2 hide-low">{STYLES.map(([k, l]) => <button key={k} className={cx("chip", style === k && "on")} onClick={() => { setStyle(style === k ? undefined : k); setListenOnly(false); }}>{l}</button>)}</div>}
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <textarea className="field max-h-40 min-h-12 flex-1 resize-none" rows={1} value={input} placeholder={t("talk.placeholder")} aria-label="Message" onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(input); } }} />
          <button type="button" className={cx("btn btn-soft !px-3", listening && "!bg-amber")} onClick={mic} aria-label={listening ? "Stop voice typing" : "Voice typing"}>🎙️</button>
          <button className="btn btn-primary" disabled={busy || !input.trim()}>{t("send")}</button>
        </form>
        {!low && <p className="mt-1 text-center text-[11px] text-brown-soft">{t("talk.disclaimer")}</p>}
      </div>
    </div>
  );
}
