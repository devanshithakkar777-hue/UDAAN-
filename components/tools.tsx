"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { Card, Notice, Spinner, cx } from "./ui";
import type { ToolId } from "@/modules/types";

/* ───────── Shared bits ───────── */

function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text: string, lang = "en-IN") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = 0.85; u.onend = () => setSpeaking(false);
    setSpeaking(true); window.speechSynthesis.speak(u);
  }, []);
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  return { speak, stop, speaking };
}

function useTimer(seconds: number, onDone?: () => void) {
  const [left, setLeft] = useState(seconds); const [running, setRunning] = useState(false);
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(id); setRunning(false); done.current?.(); return 0; } return l - 1; }), 1000);
    return () => clearInterval(id);
  }, [running]);
  return { left, running, start: () => { setLeft(seconds); setRunning(true); }, stop: () => setRunning(false), reset: () => { setRunning(false); setLeft(seconds); } };
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Stepper({ steps, finish, onFinish }: { steps: { title: string; body: React.ReactNode }[]; finish?: React.ReactNode; onFinish?: () => void }) {
  const [i, setI] = useState(0);
  const last = i >= steps.length;
  if (last) return <Card className="fade-in space-y-3 text-center">{finish ?? <p className="serif text-xl text-brown">That's enough for now. Well done for staying with it.</p>}<button className="btn btn-soft" onClick={() => { setI(0); onFinish?.(); }}>Again</button></Card>;
  return (
    <Card className="fade-in space-y-4 text-center" aria-live="polite">
      <p className="text-xs uppercase tracking-wide text-brown-soft">{i + 1} of {steps.length}</p>
      <h3 className="serif text-2xl text-brown">{steps[i].title}</h3>
      <div className="text-brown">{steps[i].body}</div>
      <div className="flex justify-center gap-2">
        {i > 0 && <button className="btn btn-ghost" onClick={() => setI(i - 1)}>Back</button>}
        <button className="btn btn-primary" onClick={() => setI(i + 1)}>{i === steps.length - 1 ? "Done" : "Next"}</button>
      </div>
    </Card>
  );
}

/* ───────── Breathing ───────── */

type Phase = { label: string; secs: number; scale: number };
export function BreathingOrb({ phases = [{ label: "Breathe in", secs: 4, scale: 1 }, { label: "Breathe out slowly", secs: 6, scale: 0.6 }], rounds = 0 }: { phases?: Phase[]; rounds?: number }) {
  const [on, setOn] = useState(false); const [idx, setIdx] = useState(0); const [count, setCount] = useState(0);
  useEffect(() => {
    if (!on) return;
    const p = phases[idx % phases.length];
    const id = setTimeout(() => { setIdx((n) => n + 1); if ((idx + 1) % phases.length === 0) setCount((c) => c + 1); }, p.secs * 1000);
    return () => clearTimeout(id);
  }, [on, idx, phases]);
  useEffect(() => { if (rounds && count >= rounds) { setOn(false); setIdx(0); setCount(0); } }, [count, rounds]);
  const p = phases[idx % phases.length];
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative flex h-56 w-56 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber/50 to-peach-deep" style={{ transform: `scale(${on ? p.scale : 0.6})`, transition: `transform ${on ? p.secs : 0.5}s ease-in-out`, opacity: .9 }} />
        <div className="relative serif text-xl text-brown" aria-live="polite">{on ? p.label : "Ready when you are"}</div>
      </div>
      <button className="btn btn-primary" onClick={() => { setOn(!on); setIdx(0); setCount(0); }}>{on ? "Stop" : "Start"}</button>
      {on && <p className="text-xs text-brown-soft">Breathe only as much as feels comfortable. Stop any time.</p>}
    </div>
  );
}

const BOX: Phase[] = [{ label: "In", secs: 4, scale: 1 }, { label: "Hold", secs: 4, scale: 1 }, { label: "Out", secs: 4, scale: 0.6 }, { label: "Hold", secs: 4, scale: 0.6 }];
const PRANAYAMA = {
  "Calm breath (4 in, 6 out)": [{ label: "In", secs: 4, scale: 1 }, { label: "Out, slowly", secs: 6, scale: 0.6 }],
  "Equal breath (Sama Vritti)": [{ label: "In", secs: 4, scale: 1 }, { label: "Out", secs: 4, scale: 0.6 }],
  "Humming bee (Bhramari)": [{ label: "In through the nose", secs: 4, scale: 1 }, { label: "Out, humming softly 'mmm'", secs: 7, scale: 0.6 }],
} as Record<string, Phase[]>;

function Pranayama() {
  const [k, setK] = useState(Object.keys(PRANAYAMA)[0]);
  return (
    <div className="space-y-3">
      <Notice>Optional and cultural, never required. If you feel dizzy or uncomfortable, return to normal breathing. If you have a breathing or heart condition, please check with a doctor first.</Notice>
      <div className="flex flex-wrap gap-2">{Object.keys(PRANAYAMA).map((n) => <button key={n} className={cx("chip", k === n && "on")} onClick={() => setK(n)}>{n}</button>)}</div>
      <BreathingOrb key={k} phases={PRANAYAMA[k]} />
      <details className="card p-3 text-sm text-brown"><summary className="cursor-pointer font-semibold">Alternate-nostril breathing (Nadi Shodhana), step by step</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5"><li>Sit comfortably. Rest your left hand on your knee.</li><li>Close your right nostril gently with your right thumb. Breathe in slowly through the left.</li><li>Close the left with your ring finger, release the right, and breathe out through the right.</li><li>Breathe in through the right, close it, breathe out through the left.</li><li>That is one round. Do five to ten rounds, gently, with no strain and no holding.</li></ol></details>
    </div>
  );
}

/* ───────── Grounding, body scan ───────── */

const G = [["5", "things you can see", "Look slowly around. Name them out loud or in your head."], ["4", "things you can touch", "Feel the fabric, the chair, the floor under your feet."], ["3", "things you can hear", "Near sounds, far sounds, even the quiet."], ["2", "things you can smell", "Or remember a smell you like."], ["1", "thing you can taste", "Or take a sip of water and notice it."]];
function Grounding() {
  return <Stepper steps={G.map(([n, t, b]) => ({ title: `${n} ${t}`, body: <p>{b}</p> }))} finish={<><p className="serif text-xl text-brown">You're here. Your feet are on the ground.</p><p className="text-sm text-brown-soft">Take one slow breath. Notice if anything feels a little different.</p></>} />;
}

const SCAN = ["Feet and ankles. Let them be heavy.", "Legs. Let the muscles soften.", "Belly. Let it rise and fall without effort.", "Chest. Notice your breathing without changing it.", "Hands and arms. Unclench, let them rest.", "Shoulders. Let them drop away from your ears.", "Jaw and face. Unclench your teeth. Soften your forehead.", "Whole body. Rest here for a breath or two."];
function BodyScan() {
  const { speak, stop, speaking } = useSpeech();
  return (
    <div className="space-y-3">
      <Stepper steps={SCAN.map((s, i) => ({ title: `Step ${i + 1}`, body: <p>{s}</p> }))} />
      <button className="btn btn-soft w-full" onClick={() => (speaking ? stop() : speak(SCAN.join(" … ")))}>{speaking ? "Stop audio" : "🔊 Read it to me"}</button>
    </div>
  );
}

/* ───────── Urge surfing, body double, timer-based ───────── */

function UrgeSurf() {
  const t = useTimer(15 * 60); const [intensity, setIntensity] = useState<number | null>(null);
  const tips = ["Notice where you feel it in your body. Just watch it, like a wave.", "Drink a glass of water slowly.", "Change your place. Step outside or into another room.", "Name it: 'This is an urge. It will rise, peak and pass.'", "Message or call someone you trust.", "Do something absorbing with your hands for ten minutes."];
  const tip = tips[Math.floor((15 * 60 - t.left) / 150) % tips.length];
  return (
    <Card className="space-y-4 text-center">
      <p className="serif text-xl text-brown">Urges rise, peak, and pass. Let's ride this one.</p>
      <div className="serif text-6xl text-amber-deep" aria-live="off">{mmss(t.left)}</div>
      {t.running ? <p className="fade-in text-brown" aria-live="polite">{tip}</p> : t.left === 0 ? <p className="text-brown">You rode it out. That counts.</p> : <p className="text-sm text-brown-soft">Delay 15 minutes. You can decide after, and the urge is usually weaker.</p>}
      <div className="flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => (t.running ? t.reset() : t.start())}>{t.running ? "Stop" : "Start 15 minutes"}</button>
      </div>
      <div><p className="mb-1 text-sm text-brown-soft">How strong is it now? (0 to 10)</p>
        <div className="flex flex-wrap justify-center gap-1">{Array.from({ length: 11 }, (_, n) => <button key={n} className={cx("chip", intensity === n && "on")} onClick={() => setIntensity(n)}>{n}</button>)}</div></div>
      {t.left === 0 && <button className="btn btn-soft" onClick={() => api("/api/substance", { body: { kind: "resisted", intensity } })}>Log that I rode it out</button>}
      <p className="text-xs text-brown-soft">If you feel unwell, shaky or unsafe, call 112 or a doctor.</p>
    </Card>
  );
}

function BodyDouble() {
  const [mins, setMins] = useState(10); const t = useTimer(mins * 60);
  const [task, setTask] = useState("");
  const lines = ["I'm here with you.", "You started. That's the hardest part.", "Small and slow is fine.", "Still here. No rush.", "Nearly there, one more bit."];
  const line = lines[Math.min(lines.length - 1, Math.floor(((mins * 60 - t.left) / (mins * 60)) * lines.length))];
  return (
    <Card className="space-y-4 text-center">
      <p className="serif text-xl text-brown">Pick one small thing. I'll stay with you while you do it.</p>
      <input className="field" placeholder="e.g. reply to one message" value={task} onChange={(e) => setTask(e.target.value)} aria-label="Your small task" />
      <div className="flex justify-center gap-2">{[5, 10, 15].map((m) => <button key={m} className={cx("chip", mins === m && "on")} onClick={() => { setMins(m); t.reset(); }}>{m} min</button>)}</div>
      <div className="serif text-5xl text-amber-deep">{mmss(t.left === 0 && !t.running ? mins * 60 : t.left)}</div>
      {t.running && <p className="fade-in text-brown" aria-live="polite">{line}</p>}
      {!t.running && t.left === 0 && <p className="text-brown">Done. You did something. That's enough for now.</p>}
      <button className="btn btn-primary" onClick={() => (t.running ? t.reset() : t.start())}>{t.running ? "Stop" : "Begin together"}</button>
    </Card>
  );
}

/* ───────── Soundscape (generated in the browser; works offline) ───────── */

function Soundscape() {
  const [kind, setKind] = useState("rain"); const [vol, setVol] = useState(0.4); const [on, setOn] = useState(false); const [sleepMin, setSleepMin] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null); const gainRef = useRef<GainNode | null>(null); const srcRef = useRef<AudioBufferSourceNode | null>(null); const lfoRef = useRef<OscillatorNode | null>(null);

  const stop = useCallback(() => { try { srcRef.current?.stop(); lfoRef.current?.stop(); } catch {} srcRef.current = null; lfoRef.current = null; setOn(false); }, []);
  const start = useCallback(() => {
    stop();
    const ctx = (ctxRef.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
    void ctx.resume();
    const len = ctx.sampleRate * 4; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    let b0 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "brown" || kind === "ocean" || kind === "wind") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === "pink") { b0 = 0.98 * b0 + w * 0.2; d[i] = b0; }
      else if (kind === "white") d[i] = w * 0.5;
      else d[i] = w * 0.6 * (Math.random() < 0.02 ? 1.8 : 0.5); // rain: soft noise with droplets
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = kind === "rain" ? "highpass" : "lowpass"; filt.frequency.value = kind === "rain" ? 1200 : kind === "wind" ? 500 : kind === "ocean" ? 700 : 3000;
    const g = ctx.createGain(); g.gain.value = vol; gainRef.current = g;
    src.connect(filt).connect(g).connect(ctx.destination); src.start(); srcRef.current = src;
    if (kind === "ocean" || kind === "wind") { const lfo = ctx.createOscillator(); lfo.frequency.value = kind === "ocean" ? 0.1 : 0.05; const lg = ctx.createGain(); lg.gain.value = vol * 0.6; lfo.connect(lg).connect(g.gain); lfo.start(); lfoRef.current = lfo; }
    setOn(true);
  }, [kind, vol, stop]);

  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = vol; }, [vol]);
  useEffect(() => { if (!on || !sleepMin) return; const id = setTimeout(stop, sleepMin * 60000); return () => clearTimeout(id); }, [on, sleepMin, stop]);
  useEffect(() => () => { stop(); void ctxRef.current?.close(); }, [stop]);

  const kinds = [["rain", "🌧️ Rain"], ["ocean", "🌊 Ocean"], ["wind", "🍃 Wind"], ["brown", "🟤 Deep calm"], ["pink", "🌸 Soft noise"], ["white", "⚪ White noise"]];
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">{kinds.map(([k, l]) => <button key={k} className={cx("chip", kind === k && "on")} onClick={() => { setKind(k); if (on) setTimeout(start, 0); }}>{l}</button>)}</div>
      <label className="block text-sm text-brown-soft">Volume<input type="range" min="0.05" max="1" step="0.05" value={vol} onChange={(e) => setVol(+e.target.value)} className="mt-1 w-full accent-amber-deep" aria-label="Volume" /></label>
      <label className="block text-sm text-brown-soft">Sleep timer
        <select className="field mt-1" value={sleepMin} onChange={(e) => setSleepMin(+e.target.value)}><option value={0}>Off</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option></select></label>
      <button className="btn btn-primary w-full" onClick={() => (on ? stop() : start())}>{on ? "Stop" : "Play"}</button>
      <p className="text-xs text-brown-soft">Generated on your device, so it works offline and uses no data.</p>
    </Card>
  );
}

/* ───────── Write / reflect tools ───────── */

function WorryDump() {
  const [t, setT] = useState(""); const [done, setDone] = useState(false);
  if (done) return <Card className="fade-in space-y-3 text-center"><p className="serif text-xl text-brown">It's out of your head now. It can wait until morning.</p><button className="btn btn-soft" onClick={() => { setT(""); setDone(false); }}>Another one</button></Card>;
  return (
    <Card className="space-y-3">
      <p className="text-brown">Write every worry as fast as it comes. No one will read it, and it isn't saved unless you choose.</p>
      <textarea className="field min-h-48" value={t} onChange={(e) => setT(e.target.value)} placeholder="Everything on my mind…" aria-label="Worries" />
      <div className="flex gap-2"><button className="btn btn-primary flex-1" onClick={() => setDone(true)}>Put it away</button>
        <button className="btn btn-soft" disabled={!t.trim()} onClick={async () => { await api("/api/journal", { body: { kind: "safe_space", body: t } }); setDone(true); }}>Save privately</button></div>
    </Card>
  );
}

function PauseReflectRespond() {
  const [step, setStep] = useState(0); const [a, setA] = useState({ feel: "", want: "", say: "" });
  const steps = [["Pause", "Put your phone down. Take one slow breath out. Wait at least a minute before you reply or react.", null], ["Reflect", "What am I feeling, and what do I actually want here?", "feel"], ["Respond", "What is one calm thing I could say or do? Would I be okay with it tomorrow?", "say"]] as const;
  const [title, text, key] = steps[step] ?? [];
  if (step >= 3) return <Card className="fade-in space-y-3 text-center"><p className="serif text-xl text-brown">You chose before you reacted. That's the skill.</p>{a.say && <p className="rounded-xl bg-peach p-3 text-left text-brown">{a.say}</p>}<button className="btn btn-soft" onClick={() => { setStep(0); setA({ feel: "", want: "", say: "" }); }}>Again</button></Card>;
  return (
    <Card className="space-y-3 text-center">
      <h3 className="serif text-2xl text-brown">{title}</h3><p className="text-brown">{text}</p>
      {key && <textarea className="field" value={a[key]} onChange={(e) => setA({ ...a, [key]: e.target.value })} aria-label={title} />}
      <button className="btn btn-primary" onClick={() => setStep(step + 1)}>{step === 2 ? "Done" : "Next"}</button>
    </Card>
  );
}

function Courage() {
  const [fear, setFear] = useState(""); const [step, setStep] = useState("");
  return (
    <Stepper steps={[
      { title: "Steady first", body: <><p className="mb-2">Plant your feet. One slow breath in… and a longer breath out.</p><BreathingOrb rounds={3} /></> },
      { title: "Name the fear", body: <input className="field" placeholder="I'm afraid that…" value={fear} onChange={(e) => setFear(e.target.value)} aria-label="The fear" /> },
      { title: "Smallest next step", body: <><p className="mb-2 text-sm text-brown-soft">Not the whole thing. Just the first two minutes of it.</p><input className="field" placeholder="I could…" value={step} onChange={(e) => setStep(e.target.value)} aria-label="Next step" /></> },
      { title: "Remind yourself", body: <p>Feeling afraid doesn't mean you can't. You have faced hard things before. Courage is moving with the fear in the room.</p> },
    ]} finish={<><p className="serif text-xl text-brown">{step ? `Your step: ${step}` : "Go gently."}</p><p className="text-sm text-brown-soft">Do it now, while you're steady. You can come back after.</p></>} />
  );
}

function WindDown() {
  const all = ["Dim the lights", "Put the phone away", "Warm drink or water", "Wash face or shower", "Stretch gently", "Write tomorrow's one thing", "Slow breaths in bed", "Calm sounds"];
  const [mine, setMine] = useState<string[]>([]); const [doneI, setDoneI] = useState<string[]>([]);
  useEffect(() => { try { setMine(JSON.parse(localStorage.getItem("udaan_winddown") ?? "[]")); } catch {} }, []);
  const toggle = (x: string) => { const n = mine.includes(x) ? mine.filter((y) => y !== x) : [...mine, x]; setMine(n); localStorage.setItem("udaan_winddown", JSON.stringify(n)); };
  return (
    <Card className="space-y-3"><p className="text-brown">Pick what feels right. It's your routine, not a rule.</p>
      <div className="flex flex-wrap gap-2">{all.map((x) => <button key={x} className={cx("chip", mine.includes(x) && "on")} onClick={() => toggle(x)}>{x}</button>)}</div>
      {mine.length > 0 && <div className="space-y-2">{mine.map((x) => <label key={x} className="flex items-center gap-3 rounded-xl bg-peach p-3 text-brown"><input type="checkbox" className="h-5 w-5 accent-amber-deep" checked={doneI.includes(x)} onChange={() => setDoneI(doneI.includes(x) ? doneI.filter((y) => y !== x) : [...doneI, x])} />{x}</label>)}</div>}
      <p className="text-xs text-brown-soft">A bad night is not a failure. Resting counts.</p>
    </Card>
  );
}

const MOVES = [
  { t: "Shoulder rolls", s: ["Sit or stand tall.", "Roll shoulders back slowly, 5 times.", "Then forward, 5 times.", "Let your arms hang loose."] },
  { t: "Neck and chest stretch", s: ["Drop your right ear toward your right shoulder. Breathe 5 times.", "Switch sides.", "Clasp hands behind you and open your chest gently."] },
  { t: "Cat-cow (on hands and knees)", s: ["Hands under shoulders, knees under hips.", "Breathe in, let the belly drop and look up.", "Breathe out, round the back and tuck the chin.", "Repeat slowly 8 times."] },
  { t: "Child's pose", s: ["Kneel and sit back on your heels.", "Fold forward, arms long or by your sides.", "Rest your forehead down. Breathe for one minute."] },
  { t: "Legs up the wall", s: ["Lie on your back with your legs resting up a wall.", "Let your arms relax.", "Stay for 3 to 5 minutes, breathing slowly."] },
  { t: "A five-minute walk", s: ["Step outside if you can, or walk around your space.", "Notice three things you see.", "Walk at an easy pace. That's the whole task."] },
];
function Movement() {
  const [i, setI] = useState<number | null>(null);
  if (i != null) return <div className="space-y-3"><Stepper steps={MOVES[i].s.map((s, n) => ({ title: MOVES[i].t, body: <p>{s}</p> }))} /><button className="btn btn-ghost" onClick={() => setI(null)}>← All movements</button></div>;
  return <div className="space-y-2"><Notice>Gentle only. Stop if anything hurts. This isn't medical advice, and a general health check-up is a good idea too.</Notice>{MOVES.map((m, n) => <button key={m.t} onClick={() => setI(n)} className="card w-full p-4 text-left text-brown">{m.t}<span className="block text-sm text-brown-soft">{m.s.length} small steps</span></button>)}</div>;
}

/* ───────── Overload and Low-energy ───────── */

export function Overload() {
  const [i, setI] = useState(0);
  const steps = [
    { big: "You're okay. This will pass.", small: "You don't have to fix anything right now. Just the next minute." },
    { big: "Feel your feet on the floor.", small: "Press them down gently. Notice the ground holding you." },
    { big: "Breathe out slowly.", small: "In through the nose. A long, slow breath out. Once more." },
    { big: "Have a sip of water.", small: "Small sips. Notice how it feels." },
    { big: "Look at one thing in the room.", small: "Just one. Let your eyes rest on it." },
    { big: "Do you want company or quiet?", small: "Both are okay." },
  ];
  const s = steps[i];
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-cream p-8 text-center">
      <p className="serif text-3xl text-brown fade-in" key={i}>{s.big}</p>
      <p className="text-lg text-brown-soft">{s.small}</p>
      <div className="flex gap-3">
        {i < steps.length - 1 ? <button className="btn btn-primary !px-8 !py-4 text-lg" onClick={() => setI(i + 1)}>Next</button> : <><a className="btn btn-primary" href="/talk">Talk to UDAAN</a><a className="btn btn-soft" href="/safe">I need help now</a></>}
      </div>
      <a href="/talk" className="text-sm text-brown-soft underline">Leave this</a>
    </div>
  );
}

function LowEnergy() {
  const [anchors, setAnchors] = useState<Record<string, boolean>>({}); const [tiny, setTiny] = useState("");
  const key = `udaan_mvd_${new Date().toISOString().slice(0, 10)}`;
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(key) ?? "{}"); setAnchors(s.anchors ?? {}); setTiny(s.tiny ?? ""); } catch {} }, [key]);
  const save = (a: Record<string, boolean>, t: string) => { setAnchors(a); setTiny(t); localStorage.setItem(key, JSON.stringify({ anchors: a, tiny: t })); };
  const list = ["Drink some water", "Open a window or get light", "Message one person", "Eat something small"];
  const n = Object.values(anchors).filter(Boolean).length;
  return (
    <Card className="space-y-4">
      <p className="serif text-xl text-brown">A hard day. Two or three small anchors is a whole day.</p>
      <div className="space-y-2">{list.map((x) => <label key={x} className="flex items-center gap-3 rounded-xl bg-peach p-4 text-lg text-brown"><input type="checkbox" className="h-6 w-6 accent-amber-deep" checked={!!anchors[x]} onChange={(e) => save({ ...anchors, [x]: e.target.checked }, tiny)} />{x}</label>)}</div>
      <input className="field" placeholder="One tiny task (optional)" value={tiny} onChange={(e) => save(anchors, e.target.value)} aria-label="One tiny task" />
      {n >= 2 && <p className="fade-in rounded-xl bg-[#eef4ea] p-3 text-brown">That's a complete day. You did enough.</p>}
    </Card>
  );
}

/* ───────── AI-generated audio-style tools ───────── */

function Generated({ kind, label, placeholder }: { kind: "sleep_story" | "visualisation"; label: string; placeholder: string }) {
  const [theme, setTheme] = useState(""); const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const { speak, stop, speaking } = useSpeech();
  const go = async () => { setBusy(true); setErr(""); try { const r = await api<{ text: string }>("/api/generate", { body: { kind, theme: theme || undefined } }); setText(r.text); } catch (e) { setErr((e as Error).message); } setBusy(false); };
  return (
    <Card className="space-y-3">
      <input className="field" placeholder={placeholder} value={theme} onChange={(e) => setTheme(e.target.value)} aria-label={label} />
      <button className="btn btn-primary w-full" disabled={busy} onClick={go}>{busy ? "Writing…" : `Make my ${label}`}</button>
      {err && <Notice tone="warn">{err}</Notice>}
      {text && <><div className="prose-soft rounded-xl bg-peach p-4 text-brown"><p>{text}</p></div>
        <button className="btn btn-soft w-full" onClick={() => (speaking ? stop() : speak(text))}>{speaking ? "Stop" : "🔊 Read it aloud"}</button></>}
    </Card>
  );
}

function Ritual() {
  const [steps, setSteps] = useState<string[]>([]); const [n, setN] = useState("");
  useEffect(() => { try { setSteps(JSON.parse(localStorage.getItem("udaan_ritual") ?? "[]")); } catch {} }, []);
  const save = (s: string[]) => { setSteps(s); localStorage.setItem("udaan_ritual", JSON.stringify(s)); };
  return (
    <Card className="space-y-3">
      <p className="text-brown">Design a small ritual you can do anywhere, without this app: before an interview, after a hard day, at the start of a task.</p>
      <ol className="list-decimal space-y-2 pl-5 text-brown">{steps.map((s, i) => <li key={i} className="flex items-center justify-between gap-2"><span>{s}</span><button className="btn btn-ghost !min-h-8" onClick={() => save(steps.filter((_, j) => j !== i))} aria-label={`Remove ${s}`}>✕</button></li>)}</ol>
      <div className="flex gap-2"><input className="field" placeholder="e.g. three slow breaths" value={n} onChange={(e) => setN(e.target.value)} aria-label="Ritual step" /><button className="btn btn-soft" onClick={() => { if (n.trim()) { save([...steps, n.trim()]); setN(""); } }}>Add</button></div>
      <p className="text-xs text-brown-soft">Saved on this device. You can change it any time.</p>
    </Card>
  );
}

function DailyReflection() {
  const [q, setQ] = useState(""); const [a, setA] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  const load = async () => { setBusy(true); try { const r = await api<{ text: string }>("/api/generate", { body: { kind: "daily_reflection" } }); setQ(r.text); } catch {} setBusy(false); };
  useEffect(() => { void load(); }, []);
  if (busy && !q) return <Spinner />;
  return (
    <Card className="space-y-3"><p className="serif text-xl text-brown prose-soft"><span>{q}</span></p>
      <textarea className="field min-h-32" value={a} onChange={(e) => setA(e.target.value)} placeholder="Whatever comes…" aria-label="Your reflection" />
      <div className="flex gap-2"><button className="btn btn-primary flex-1" disabled={!a.trim() || saved} onClick={async () => { await api("/api/journal", { body: { kind: "reflection", title: q.split("\n")[0].slice(0, 100), body: a } }); setSaved(true); }}>{saved ? "Saved" : "Save reflection"}</button><button className="btn btn-soft" onClick={() => { setSaved(false); setA(""); void load(); }}>Another</button></div>
      <p className="text-xs text-brown-soft">No streaks. Skip as many days as you like.</p>
    </Card>
  );
}

function RuminationBreaker() {
  const t = useTimer(5 * 60);
  return (
    <Stepper steps={[
      { title: "Ground yourself first", body: <><p className="mb-2">Name five things you can see right now.</p><BreathingOrb rounds={2} /></> },
      { title: "Write it out, time-boxed", body: <div className="space-y-2"><p className="text-sm text-brown-soft">Five minutes, then you put it down.</p><div className="serif text-4xl text-amber-deep">{mmss(t.left)}</div><button className="btn btn-soft" onClick={() => (t.running ? t.reset() : t.start())}>{t.running ? "Stop" : "Start timer"}</button><textarea className="field min-h-40" placeholder="Everything about it…" aria-label="Write it out" /></div> },
      { title: "Don't send anything yet", body: <p>If you want to reply to the person, write it, but wait until tomorrow before sending. Hurt makes poor editors.</p> },
      { title: "Give your mind something to hold", body: <p>Pick something absorbing for the next 20 minutes: a walk, a show, cooking, a game, music, tidying one shelf. Choose it now.</p> },
    ]} finish={<p className="serif text-xl text-brown">The replay will quiet down. It always does, even when it doesn't feel like it.</p>} />
  );
}

/* ───────── Router ───────── */

export function Tool({ id }: { id: ToolId }) {
  switch (id) {
    case "breathing": return <BreathingOrb />;
    case "box_breathing": return <BreathingOrb phases={BOX} />;
    case "pranayama": return <Pranayama />;
    case "grounding": return <Grounding />;
    case "body_scan": return <BodyScan />;
    case "urge_surf": return <UrgeSurf />;
    case "body_double": return <BodyDouble />;
    case "soundscape": return <Soundscape />;
    case "wind_down": return <WindDown />;
    case "worry_dump": return <WorryDump />;
    case "movement": return <Movement />;
    case "overload": return <Overload />;
    case "low_energy": return <LowEnergy />;
    case "sleep_story": return <Generated kind="sleep_story" label="sleep story" placeholder="A place or theme (optional)" />;
    case "visualisation": return <Generated kind="visualisation" label="visualisation" placeholder="A peaceful place you like (optional)" />;
    case "pause_reflect_respond": return <PauseReflectRespond />;
    case "courage": return <Courage />;
    case "ritual": return <Ritual />;
    case "daily_reflection": return <DailyReflection />;
    case "rumination_breaker": return <RuminationBreaker />;
    default: return null;
  }
}
