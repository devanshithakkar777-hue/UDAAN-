import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encOpt } from "@/lib/crypto";
import { day, rating } from "@/lib/schemas";

const Body = z.object({ day, bedtime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(), wake: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(), quality: rating.optional().nullable(), note: z.string().max(1000).optional().nullable() });

export const GET = route({}, async ({ user }) => {
  const since = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const rows = await db.select().from(schema.sleepEntries).where(and(eq(schema.sleepEntries.userId, user.id), gte(schema.sleepEntries.day, since))).orderBy(desc(schema.sleepEntries.day));
  return { items: rows.map((r) => ({ id: r.id, day: r.day, bedtime: r.bedtime, wake: r.wake, quality: r.quality, note: decSafe(user.id, r.noteEnc) })) };
});
export const PUT = route({}, async ({ req, user }) => {
  const b = await body(req, Body);
  const v = { userId: user.id, day: b.day, bedtime: b.bedtime ?? null, wake: b.wake ?? null, quality: b.quality ?? null, noteEnc: encOpt(user.id, b.note) };
  await db.insert(schema.sleepEntries).values(v).onConflictDoUpdate({ target: [schema.sleepEntries.userId, schema.sleepEntries.day], set: v });
  return { ok: true };
});
