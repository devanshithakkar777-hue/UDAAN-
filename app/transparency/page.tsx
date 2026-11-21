import Link from "next/link";
export const metadata = { title: "How UDAAN stays safe · UDAAN" };
export default function Transparency() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-brown">
      <Link href="/welcome" className="text-sm text-brown-soft">← Back</Link>
      <h1 className="text-4xl">How UDAAN stays safe</h1>
      {[
        ["It's an AI", "UDAAN is an AI. It can be wrong, and it isn't a replacement for people who know you or for professional care."],
        ["Honest, not just agreeable", "UDAAN aims to comfort first, then be honest, including about your own part in things. It won't flatter you. It will never tell you that you're overreacting about abuse or coercion."],
        ["Built to need you less", "The goal is for you to grow stronger on your own. UDAAN nudges you toward the people in your life and toward doing things yourself, and it tracks your independence, not your usage."],
        ["A safety layer that doesn't depend on the AI", "Rules and a separate checker look at every message. If there are signs of serious risk, UDAAN shows you crisis help in a fixed way, even if the AI itself is unavailable. The Safe button works without signing in and offline."],
        ["People review what matters", "Clinicians and trained reviewers approve the health guidance UDAAN draws on, community posts that are held for safety are reviewed by moderators, and professionals in the directory have their credentials checked."],
        ["What it won't do", "Diagnose, prescribe, give medication doses, coach substance use, promise outcomes, or help with harming yourself or others."],
      ].map(([h, b]) => <section key={h}><h2 className="text-2xl">{h}</h2><p>{b}</p></section>)}
      <Link href="/safe" className="btn btn-primary">I need help now</Link>
    </main>
  );
}
