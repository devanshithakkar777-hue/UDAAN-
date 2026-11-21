import { z } from "zod";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { encOpt } from "@/lib/crypto";
import { DOMAINS } from "@/modules/types";
import { DIMENSIONS } from "@/lib/dimensions";


/** Shown as separate illustrative indicators. Never combined into one number, never a diagnosis or ranking. */
export const GET = route({}, async ({ user }) => {
  const since = new Date(Date.now() - 90 * 864e5);
  const events = await db.select({ domain: schema.growthEvents.domain, kind: schema.growthEvents.kind, n: sql<number>`count(*)::int` }).from(schema.growthEvents)
    .where(and(eq(schema.growthEvents.userId, user.id), gte(schema.growthEvents.createdAt, since))).groupBy(schema.growthEvents.domain, schema.growthEvents.kind);
  const ratings = await db.select().from(schema.selfRatings).where(eq(schema.selfRatings.userId, user.id)).orderBy(asc(schema.selfRatings.createdAt));
  const indep = await db.select({ d: sql<string>`to_char(date_trunc('day', ${schema.growthEvents.createdAt}), 'YYYY-MM-DD')` }).from(schema.growthEvents)
    .where(and(eq(schema.growthEvents.userId, user.id), eq(schema.growthEvents.kind, "independent"), gte(schema.growthEvents.createdAt, since))).groupBy(sql`1`);
  const map = DOMAINS.map((d) => {
    const e = events.filter((x) => x.domain === d.id);
    return { ...d, explored: e.find((x) => x.kind === "explored")?.n ?? 0, practised: e.find((x) => x.kind === "practised")?.n ?? 0, independent: e.find((x) => x.kind === "independent")?.n ?? 0, reflections: e.find((x) => x.kind === "reflection")?.n ?? 0 };
  });
  const dims = DIMENSIONS.map((d) => {
    const s = ratings.filter((r) => r.dimension === d.id);
    return { ...d, latest: s.at(-1)?.value ?? null, first: s[0]?.value ?? null, series: s.map((r) => ({ at: r.createdAt, value: r.value })) };
  });
  return { map, dimensions: dims, independentDays: indep.length };
});

const Rate = z.object({ dimension: z.enum(["regulation", "self_awareness", "decision", "accountability", "perspective", "conflict", "connection", "coping"]), value: z.number().int().min(1).max(5) });
const Event = z.object({ domain: z.enum(["ei", "self_awareness", "accountability", "social", "resilience", "communication", "decision", "growth"]), kind: z.enum(["independent", "reflection"]), note: z.string().max(500).optional().nullable() });
export const POST = route({}, async ({ req, user }) => {
  const raw = await req.json();
  if ("dimension" in raw) { const b = Rate.parse(raw); await db.insert(schema.selfRatings).values({ userId: user.id, ...b }); }
  else { const b = Event.parse(raw); await db.insert(schema.growthEvents).values({ userId: user.id, domain: b.domain, kind: b.kind, noteEnc: encOpt(user.id, b.note) }); }
  return { ok: true };
});
