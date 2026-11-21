import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const GROUPS = [
  { slug: "everyday-peers", name: "Everyday peers", description: "A calm, moderated space to share a rough day and hear from others.", kind: "peer" },
  { slug: "student-circle", name: "Student circle", description: "Exam stress, homesickness, comparison and burnout, among students.", kind: "student" },
  { slug: "grief-and-loss", name: "Grief and loss", description: "For anyone carrying a loss. No fixing, just company.", kind: "grief" },
  { slug: "after-the-breakup", name: "After the breakup", description: "Healing from heartbreak at your own pace.", kind: "relationship" },
  { slug: "caregivers", name: "Caregivers", description: "For people looking after someone else. You matter too.", kind: "caregiver" },
  { slug: "clear-path-peers", name: "Clear Path peers", description: "Cutting down or stepping away from substances, without shame.", kind: "peer" },
  { slug: "hindi-saathi", name: "हिंदी साथी", description: "अपनी भाषा में बात करने की एक सुरक्षित जगह।", kind: "peer", language: "hi" },
];

/**
 * DRAFT content written as a starting point. Nothing here is shown to users or used by the companion
 * until a named clinician approves it in the admin console. Replace or extend with your reviewed material.
 */
const CONTENT = [
  { slug: "what-is-anxiety", type: "general_education", title: "What anxiety is, and what helps", topics: ["anxiety", "panic", "worry"], source: "Drafted for clinician review. Align with WHO mhGAP and your clinical adviser's material.", audience: "Adults", limits: "General education only; not a diagnosis. If anxiety is stopping daily life, speak to a professional.",
    bodyMd: "Anxiety is the body's alarm system. It prepares you for a threat by speeding the heart, tightening muscles and sharpening attention. It becomes hard when the alarm goes off too often or too strongly. Slow breathing with a longer out-breath, grounding through the senses, and writing down the worry can help calm the body. Talking to a counsellor or doctor is a good step if worry is constant, affects sleep or work, or feels unmanageable." },
  { slug: "low-mood-and-daily-life", type: "general_education", title: "Low mood and everyday life", topics: ["depression", "low mood", "sleep", "energy"], source: "Drafted for clinician review.", audience: "Adults", limits: "Not a diagnosis. Persistent low mood, hopelessness or thoughts of self-harm need professional support.",
    bodyMd: "Low mood often shows up in daily life first: sleep changes, appetite changes, low energy, and struggling to start tasks. Small, steady anchors can help: a fixed wake time, daylight in the morning, some food and water, one small task, and contact with one person. Being kind to yourself matters more than being productive. If this lasts more than two weeks or gets heavier, a doctor or counsellor can help, and that is a sign of taking yourself seriously, not of failing." },
  { slug: "when-someone-says-they-want-to-die", type: "emergency_protocol", title: "If someone says they want to die", topics: ["suicide", "crisis"], source: "Drafted for clinician review. Align with local crisis guidance.", audience: "Family and friends", limits: "Not a substitute for emergency services.",
    bodyMd: "Take it seriously. Stay calm, listen without judging, and ask directly whether they are thinking of ending their life. Asking does not plant the idea. If they are in immediate danger, stay with them and call 112. Encourage contacting Tele-MANAS 14416 or another helpline, and a trusted person or professional. Do not promise to keep it secret if their life is at risk." },
  { slug: "supporting-someone-with-low-mood", type: "self_help", title: "Supporting someone who is struggling", topics: ["family", "support", "depression"], source: "Drafted for clinician review.", audience: "Family and friends", limits: "General guidance.",
    bodyMd: "Listen before advising. Avoid scolding, comparing, or listing what they should do. Notice small efforts. Ask what would help instead of guessing. Offer to sit with them or help with one small task. Encourage professional help gently and offer to help find it. Look after your own wellbeing too." },
  { slug: "sleep-and-routine", type: "self_help", title: "Sleep and routine when everything is off", topics: ["sleep", "insomnia", "routine"], source: "Drafted for clinician review.", audience: "Adults", limits: "Not medical advice. If sleep problems are severe or long-lasting, speak to a doctor.",
    bodyMd: "If your sleep is reversed, anchor one fixed point: a regular wake time and morning light. Shift bedtime gradually, 15 to 30 minutes at a time, instead of all at once. Keep evenings dim and screens low if you can. A bad night does not mean failure. Writing worries down before bed can help the mind settle." },
  { slug: "alcohol-and-withdrawal-safety", type: "general_education", title: "Stopping alcohol safely", topics: ["alcohol", "withdrawal", "substance"], source: "Drafted for clinician review. Align with national guidance and a de-addiction specialist.", audience: "Adults", limits: "Not detox advice. Medical supervision is required for heavy or long-term use.",
    bodyMd: "For people who drink heavily or daily, stopping suddenly can be medically dangerous. Withdrawal can cause seizures and confusion. Please speak to a doctor before stopping, and seek urgent medical help for severe shaking, confusion, seeing things that are not there, or seizures." },
];

export async function seed(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });
  try {
    for (const g of GROUPS) await db.insert(schema.communityGroups).values(g).onConflictDoNothing();
    for (const c of CONTENT) await db.insert(schema.contentItems).values({ ...c, status: "draft" }).onConflictDoNothing();
    console.log(`seeded ${GROUPS.length} groups and ${CONTENT.length} draft content items`);
  } finally { await sql.end(); }
}
if (process.argv[1]?.endsWith("seed.ts")) seed().catch((e) => { console.error(e); process.exit(1); });
