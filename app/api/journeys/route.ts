import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encOpt } from "@/lib/crypto";

const Body = z.object({ journeyId: z.string().max(60), step: z.number().int().min(0).max(50), reflection: z.string().max(3000).optional().nullable(), complete: z.boolean().optional() });

export const GET = route({}, async ({ user }) => {
  const rows = await db.select().from(schema.userJourneys).where(eq(schema.userJourneys.userId, user.id));
  return { items: rows.map((r) => ({ journeyId: r.journeyId, step: r.step, startedAt: r.startedAt, completedAt: r.completedAt, reflection: decSafe(user.id, r.reflectionsEnc) })) };
});
export const PUT = route({}, async ({ req, user }) => {
  const b = await body(req, Body);
  const v = { userId: user.id, journeyId: b.journeyId, step: b.step, reflectionsEnc: encOpt(user.id, b.reflection), completedAt: b.complete ? new Date() : null };
  await db.insert(schema.userJourneys).values(v).onConflictDoUpdate({ target: [schema.userJourneys.userId, schema.userJourneys.journeyId], set: { step: v.step, reflectionsEnc: v.reflectionsEnc, completedAt: v.completedAt } });
  return { ok: true };
});
