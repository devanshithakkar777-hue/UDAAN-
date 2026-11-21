import Link from "next/link";
export const metadata = { title: "Privacy · UDAAN" };

/** Plain-language summary. The final legal text must be reviewed by counsel in India before launch (DPDP Act 2023). */
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6 text-brown">
      <Link href="/welcome" className="text-sm text-brown-soft">← Back</Link>
      <h1 className="text-4xl">Privacy, in plain words</h1>
      <p className="text-sm text-brown-soft">UDAAN is for adults (18+). This is a summary written to be understood. The full legal notice is provided alongside it.</p>
      {[
        ["What we keep", "What you write and say in UDAAN (conversations, journal, check-ins, plans, memories) is encrypted with a key unique to you before it's stored. Nobody who works on UDAAN reads it, and we can't browse it."],
        ["What we don't do", "We don't sell your data. We don't show ads. We don't share anything about you with your family, employer, college or anyone else. If you join an organisation's programme, they only see combined, anonymous numbers for groups of 20 or more."],
        ["Who can see what", "A professional only sees what you explicitly choose to share with them, for the time you choose, and you can stop at any time. Journals, conversations and your private logs are never shared by default."],
        ["The AI", "Your messages are processed by an AI model to reply to you. They're sent securely to the AI provider to generate each reply. By default they are not used to train any model. You can opt in to help improve UDAAN with de-identified excerpts, and opt out again any time."],
        ["Safety", "To protect you, UDAAN checks messages for signs of crisis. When it finds one, it shows you help. It records only a content-free note (that a check fired, and how serious), never your words."],
        ["Your control", "Download everything we hold, change or delete any memory, delete a conversation, or delete your account. Deletion is permanent and real. If you forget both your password and your recovery code, we can't recover your data, by design."],
        ["Limits", "UDAAN is not a medical service. It can't diagnose or treat, and it can't respond to emergencies. In an emergency call 112."],
      ].map(([h, b]) => <section key={h}><h2 className="text-2xl">{h}</h2><p>{b}</p></section>)}
    </main>
  );
}
