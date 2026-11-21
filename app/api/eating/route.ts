import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encOpt } from "@/lib/crypto";
import { day, rating } from "@/lib/schemas";

/** Counts and energy only. UDAAN never records calories, weight or body measurements. */
const Body = z.object({ day, meals: z.number().int().min(0).max(10).optional().nullable(), energy: rating.optional().nullable(), note: z.string().max(1000).optional().nullable() });

export const GET = route({}, async ({ user }) => {
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const rows = await db.select().from(schema.eatingNotes).where(and(eq(schema.eatingNotes.userId, user.id), gte(schema.eatingNotes.day, since))).orderBy(desc(schema.eatingNotes.day));
  return { items: rows.map((r) => ({ id: r.id, day: r.day, meals: r.meals, energy: r.energy, note: decSafe(user.id, r.noteEnc) })) };
});
export const PUT = route({}, async ({ req, user }) => {
  const b = await body(req, Body);
  const v = { userId: user.id, day: b.day, meals: b.meals ?? null, energy: b.energy ?? null, noteEnc: encOpt(user.id, b.note) };
  await db.insert(schema.eatingNotes).values(v).onConflictDoUpdate({ target: [schema.eatingNotes.userId, schema.eatingNotes.day], set: v });
  return { ok: true };
});
