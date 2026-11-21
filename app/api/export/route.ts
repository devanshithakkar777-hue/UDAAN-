import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { decJson, decSafe } from "@/lib/crypto";
import { audit } from "@/lib/audit";

/** Everything UDAAN holds about the person, decrypted, in one file. */
export const GET = route({ limit: { key: "export", max: 5, windowSec: 3600 } }, async ({ user }) => {
  const u = user.id;
  const d = <T extends { userId?: unknown }>(rows: T[]) => rows;
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, u));
  const convs = await db.select().from(schema.conversations).where(eq(schema.conversations.userId, u));
  const msgs = await db.select().from(schema.messages).where(eq(schema.messages.userId, u));
  const data = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, displayName: user.displayName },
    profile,
    conversations: convs.map((c) => ({ id: c.id, mode: c.mode, title: decSafe(u, c.titleEnc), createdAt: c.createdAt, messages: msgs.filter((m) => m.conversationId === c.id).map((m) => ({ role: m.role, text: decSafe(u, m.contentEnc), at: m.createdAt })) })),
    memories: (await db.select().from(schema.memories).where(eq(schema.memories.userId, u))).map((m) => ({ kind: m.kind, text: decSafe(u, m.contentEnc), sensitive: m.sensitive, status: m.status })),
    mood: (await db.select().from(schema.moodEntries).where(eq(schema.moodEntries.userId, u))).map((m) => ({ at: m.at, valence: m.valence, energy: m.energy, anxiety: m.anxiety, intensity: m.intensity, emotions: decSafe(u, m.emotionsEnc), triggers: decSafe(u, m.triggersEnc), note: decSafe(u, m.noteEnc) })),
    journal: (await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.userId, u))).map((j) => ({ kind: j.kind, title: decSafe(u, j.titleEnc), body: decSafe(u, j.bodyEnc), at: j.createdAt })),
    sleep: (await db.select().from(schema.sleepEntries).where(eq(schema.sleepEntries.userId, u))).map((s) => ({ day: s.day, bedtime: s.bedtime, wake: s.wake, quality: s.quality, note: decSafe(u, s.noteEnc) })),
    eating: (await db.select().from(schema.eatingNotes).where(eq(schema.eatingNotes.userId, u))).map((s) => ({ day: s.day, meals: s.meals, energy: s.energy, note: decSafe(u, s.noteEnc) })),
    strengths: (await db.select().from(schema.strengths).where(eq(schema.strengths.userId, u))).map((s) => ({ kind: s.kind, text: decSafe(u, s.textEnc), at: s.createdAt })),
    lowDayKit: (await db.select().from(schema.kitItems).where(eq(schema.kitItems.userId, u))).map((k) => ({ section: k.section, text: decSafe(u, k.textEnc) })),
    safetyPlan: decJson(u, (await db.select().from(schema.safetyPlans).where(eq(schema.safetyPlans.userId, u)))[0]?.dataEnc),
    contacts: (await db.select().from(schema.trustedContacts).where(eq(schema.trustedContacts.userId, u))).map((c) => ({ name: decSafe(u, c.nameEnc), relation: decSafe(u, c.relationEnc), phone: decSafe(u, c.phoneEnc), role: c.role })),
    goals: (await db.select().from(schema.goals).where(eq(schema.goals.userId, u))).map((g) => ({ title: decSafe(u, g.titleEnc), steps: decSafe(u, g.stepsEnc), status: g.status })),
    substanceLog: (await db.select().from(schema.substanceLogs).where(eq(schema.substanceLogs.userId, u))).map((s) => ({ at: s.at, kind: s.kind, intensity: s.intensity, trigger: decSafe(u, s.triggerEnc), note: decSafe(u, s.noteEnc) })),
    moduleRuns: (await db.select().from(schema.moduleRuns).where(eq(schema.moduleRuns.userId, u))).map((r) => ({ module: r.moduleId, at: r.createdAt, summary: decSafe(u, r.summaryEnc) })),
    consents: await db.select().from(schema.consents).where(eq(schema.consents.userId, u)),
  };
  void d;
  await audit(u, "data.export");
  return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="udaan-export-${new Date().toISOString().slice(0, 10)}.json"` } });
});
