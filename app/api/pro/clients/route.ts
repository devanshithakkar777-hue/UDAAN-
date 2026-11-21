import { and, eq, gt, gte, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { decSafe } from "@/lib/crypto";

/** Professional dashboard: only what each client has explicitly consented to share, within the grant window. No conversations, ever. */
export const GET = route({ auth: ["professional", "admin"] }, async ({ user }) => {
  const [pro] = await db.select().from(schema.professionals).where(and(eq(schema.professionals.userId, user.id), eq(schema.professionals.status, "verified")));
  if (!pro) throw new HttpError(403, "Your professional profile is not verified yet");
  const grants = await db.select().from(schema.shareGrants).where(and(eq(schema.shareGrants.professionalId, pro.id), isNull(schema.shareGrants.revokedAt), or(isNull(schema.shareGrants.expiresAt), gt(schema.shareGrants.expiresAt, new Date()))));
  const clients = [];
  for (const g of grants) {
    const since = new Date(Date.now() - 30 * 864e5);
    const item: Record<string, unknown> = { grantId: g.id, clientRef: g.userId.slice(0, 8), scope: g.scope };
    const [u] = await db.select({ n: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, g.userId));
    item.name = u?.n ?? "Client";
    if (g.scope.includes("mood_summary")) {
      const m = await db.select().from(schema.moodEntries).where(and(eq(schema.moodEntries.userId, g.userId), gte(schema.moodEntries.at, since)));
      item.mood = { checkIns: m.length, average: m.length ? +(m.reduce((a, b) => a + b.valence, 0) / m.length).toFixed(2) : null, lowDays: new Set(m.filter((x) => x.valence <= 2).map((x) => x.at.toISOString().slice(0, 10))).size, note: "Self-reported check-ins, not an assessment." };
    }
    if (g.scope.includes("sleep_summary")) {
      const s = await db.select().from(schema.sleepEntries).where(and(eq(schema.sleepEntries.userId, g.userId), gte(schema.sleepEntries.day, since.toISOString().slice(0, 10))));
      item.sleep = { nights: s.length, avgQuality: s.length ? +(s.reduce((a, b) => a + (b.quality ?? 0), 0) / s.length).toFixed(2) : null };
    }
    if (g.scope.includes("assigned_exercises")) {
      const e = await db.select().from(schema.assignedExercises).where(and(eq(schema.assignedExercises.userId, g.userId), eq(schema.assignedExercises.professionalId, pro.id)));
      item.exercises = e.map((x) => ({ id: x.id, title: decSafe(g.userId, x.titleEnc), done: !!x.doneAt, note: decSafe(g.userId, x.userNoteEnc) }));
    }
    if (g.scope.includes("prep_summary")) {
      const b = await db.select().from(schema.bookings).where(and(eq(schema.bookings.userId, g.userId), eq(schema.bookings.professionalId, pro.id)));
      item.prep = b.map((x) => decSafe(g.userId, x.prepSummaryEnc)).filter(Boolean);
    }
    clients.push(item);
  }
  const reqs = await db.select().from(schema.bookings).where(eq(schema.bookings.professionalId, pro.id));
  return { professional: { name: pro.name }, clients, bookings: reqs.map((b) => ({ id: b.id, slot: b.slot, mode: b.mode, status: b.status, message: decSafe(b.userId, b.messageEnc), from: b.userId.slice(0, 8) })) };
});
