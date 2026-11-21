"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";
import { cx, Notice } from "@/components/ui";

const Opt = ({ on, onClick, title, body }: { on: boolean; onClick: () => void; title: string; body: string }) => (
  <button type="button" onClick={onClick} aria-pressed={on} className={cx("card w-full p-4 text-left", on && "!border-amber-deep !bg-peach")}><span className="block font-semibold text-brown">{title}</span><span className="text-sm text-brown-soft">{body}</span></button>
);

export default function Onboarding() {
  const { refresh, lang } = useApp(); const router = useRouter();
  const [step, setStep] = useState(0); const [agree, setAgree] = useState(false); const [training, setTraining] = useState(false); const [research, setResearch] = useState(false);
  const [tone, setTone] = useState("balanced"); const [style, setStyle] = useState("guide"); const [stage, setStage] = useState<string | null>(null);
  const [memory, setMemory] = useState(true); const [askLH, setAskLH] = useState(true); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const finish = async () => {
    setBusy(true); setErr("");
    try {
      await api("/api/consent", { body: { accepted: true, training, research } });
      await api("/api/profile", { method: "PATCH", body: { tone, style, stage, memoryEnabled: memory, askListenOrHelp: askLH, language: lang, onboarded: true } });
      await refresh(); router.replace("/talk");
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <p className="text-center text-sm text-brown-soft" aria-live="polite">Step {step + 1} of 4</p>
      {step === 0 && (<>
        <h1 className="text-3xl text-brown">Before we begin</h1>
        <p className="text-brown">UDAAN is an AI companion for support and growth. It is not a therapist or a doctor, it can't diagnose or treat, and it can't respond to emergencies. If you're in danger, call 112, or tap Safe at any time.</p>
        <div className="card space-y-2 p-4 text-sm text-brown">
          <p><b>Your conversations are private.</b> They're encrypted. Nobody at UDAAN reads them, and organisations, employers or family never see them.</p>
          <p><b>You can delete everything</b> or download it, any time, in Settings.</p>
          <p><b>We don't sell data or show ads</b> based on how you feel.</p>
          <p>UDAAN will sometimes tell you things you might not want to hear, kindly. It's here to help you grow, not just to agree.</p>
        </div>
        <label className="flex items-start gap-3 text-brown"><input type="checkbox" className="mt-1 h-5 w-5 accent-amber-deep" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I've read this and I accept the <a className="underline" href="/privacy" target="_blank">privacy notice</a>.</span></label>
        <button className="btn btn-primary" disabled={!agree} onClick={() => setStep(1)}>Continue</button>
      </>)}
      {step === 1 && (<>
        <h1 className="text-3xl text-brown">How should I be with you?</h1>
        <p className="text-sm text-brown-soft">You can change any of this later.</p>
        <div className="space-y-2"><p className="font-semibold text-brown">Tone</p>
          <Opt on={tone === "gentle"} onClick={() => setTone("gentle")} title="Gentle" body="Softer wording, small doses of honesty." />
          <Opt on={tone === "balanced"} onClick={() => setTone("balanced")} title="Balanced" body="Warm and clear." />
          <Opt on={tone === "direct"} onClick={() => setTone("direct")} title="Direct" body="Plain and brief. Still kind." /></div>
        <div className="space-y-2"><p className="font-semibold text-brown">Style</p>
          <Opt on={style === "listener"} onClick={() => setStyle("listener")} title="Listener" body="Mostly listens. Rarely advises." />
          <Opt on={style === "guide"} onClick={() => setStyle("guide")} title="Guide" body="Helps you think things through." />
          <Opt on={style === "coach"} onClick={() => setStyle("coach")} title="Coach" body="Action-oriented, with small steps." />
          <Opt on={style === "companion"} onClick={() => setStyle("companion")} title="Companion" body="Light and conversational." /></div>
        <label className="flex items-start gap-3 text-brown"><input type="checkbox" className="mt-1 h-5 w-5 accent-amber-deep" checked={askLH} onChange={(e) => setAskLH(e.target.checked)} />Ask me whether I want you to just listen or help me think</label>
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button><button className="btn btn-primary flex-1" onClick={() => setStep(2)}>Continue</button></div>
      </>)}
      {step === 2 && (<>
        <h1 className="text-3xl text-brown">Memory</h1>
        <p className="text-brown">I can remember things you choose, like people in your life or what helps you, so you don't have to repeat yourself. I'll always show you what I remember and you can change or delete it.</p>
        <Opt on={memory} onClick={() => setMemory(true)} title="Remember what I approve" body="I'll suggest things to remember. Nothing is saved without your OK." />
        <Opt on={!memory} onClick={() => setMemory(false)} title="Don't remember anything" body="Each conversation starts fresh." />
        <div className="space-y-2"><p className="font-semibold text-brown">If you like, tell me where you are in life</p><p className="text-sm text-brown-soft">It helps me pick better examples. Optional.</p>
          <div className="flex flex-wrap gap-2">{[["student", "Student"], ["early_career", "Early career"], ["parent", "Parent"], ["caregiver", "Caregiver"], ["older_adult", "Older adult"], ["other", "Something else"]].map(([k, l]) => <button key={k} className={cx("chip", stage === k && "on")} onClick={() => setStage(stage === k ? null : k)}>{l}</button>)}</div></div>
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary flex-1" onClick={() => setStep(3)}>Continue</button></div>
      </>)}
      {step === 3 && (<>
        <h1 className="text-3xl text-brown">Your choices about your data</h1>
        <Notice>Both are off by default. Saying no changes nothing about what you can do in UDAAN.</Notice>
        <label className="card flex items-start gap-3 p-4 text-brown"><input type="checkbox" className="mt-1 h-5 w-5 accent-amber-deep" checked={training} onChange={(e) => setTraining(e.target.checked)} /><span><b>Help improve UDAAN's AI.</b><br /><span className="text-sm text-brown-soft">Allow de-identified conversation excerpts to be used to improve safety and quality.</span></span></label>
        <label className="card flex items-start gap-3 p-4 text-brown"><input type="checkbox" className="mt-1 h-5 w-5 accent-amber-deep" checked={research} onChange={(e) => setResearch(e.target.checked)} /><span><b>Take part in research.</b><br /><span className="text-sm text-brown-soft">Allow aggregate, anonymous outcome data for studies on whether UDAAN helps people.</span></span></label>
        {err && <Notice tone="warn"><span role="alert">{err}</span></Notice>}
        <div className="flex gap-2"><button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button><button className="btn btn-primary flex-1" disabled={busy} onClick={finish}>Start</button></div>
      </>)}
    </main>
  );
}
