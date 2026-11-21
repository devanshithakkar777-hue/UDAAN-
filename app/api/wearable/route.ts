import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { day } from "@/lib/schemas";

/** Manual import of the user's own numbers (typed or pasted from a health app export). Never used to infer anxiety or depression. */
const Row = z.object({ day, sleepMinutes: z.number().int().min(0).max(1440).optional().nullable(), steps: z.number().int().min(0).max(200000).optional().nullable(), restingHr: z.number().int().min(25).max(220).optional().nullable(), activeMinutes: z.number().int().min(0).max(1440).optional().nullable() });
const Body = z.object({ rows: z.array(Row).min(1).max(400) });

export const GET = route({}, async ({ user }) => {
  const since = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
  const items = await db.select().from(schema.wearableEntries).where(and(eq(schema.wearableEntries.userId, user.id), gte(schema.wearableEntries.day, since))).orderBy(desc(schema.wearableEntries.day));
  return { items };
});
export const PUT = route({ limit: { key: "wearable", max: 20, windowSec: 3600 } }, async ({ req, user }) => {
  const { rows } = await body(req, Body);
  for (const r of rows) {
    const v = { userId: user.id, day: r.day, sleepMinutes: r.sleepMinutes ?? null, steps: r.steps ?? null, restingHr: r.restingHr ?? null, activeMinutes: r.activeMinutes ?? null, source: "manual" };
    await db.insert(schema.wearableEntries).values(v).onConflictDoUpdate({ target: [schema.wearableEntries.userId, schema.wearableEntries.day], set: v });
  }
  return { ok: true, count: rows.length };
});
