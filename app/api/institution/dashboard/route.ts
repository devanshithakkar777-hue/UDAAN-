import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { HttpError } from "@/lib/auth";

/**
 * Aggregate-only. Rules enforced here:
 *  - nothing is returned unless the cohort has at least `minCohort` members (default 20)
 *  - every cell with fewer than 5 contributors is suppressed (k-anonymity)
 *  - no conversation content, no individual scores, no distress flags, no substance data
 */
const K = 5;
export const GET = route({ auth: ["institution_admin", "admin"] }, async ({ user }) => {
  const adm = await db.select().from(schema.institutionMembers).where(and(eq(schema.institutionMembers.userId, user.id), eq(schema.institutionMembers.role, "admin")));
  if (!adm.length && user.role !== "admin") throw new HttpError(403, "Not allowed");
  const instId = adm[0]?.institutionId;
  if (!instId) throw new HttpError(400, "No organisation");
  const [inst] = await db.select().from(schema.institutions).where(eq(schema.institutions.id, instId));
  const members = (await db.select({ u: schema.institutionMembers.userId }).from(schema.institutionMembers).where(eq(schema.institutionMembers.institutionId, instId))).map((m) => m.u);
  if (members.length < inst.minCohort) return { organisation: inst.name, suppressed: true, reason: `Reporting appears once at least ${inst.minCohort} people have joined, to protect privacy.`, members: undefined };
  const since = new Date(Date.now() - 90 * 864e5);
  const weekly = await db.execute<{ wk: string; n: number; contributors: number; avg: number }>(sql`
    SELECT to_char(date_trunc('week', at), 'YYYY-MM-DD') AS wk, count(*)::int AS n, count(distinct user_id)::int AS contributors, round(avg(valence)::numeric, 2)::float AS avg
    FROM mood_entries WHERE user_id IN (${sql.join(members.map((m) => sql`${m}`), sql`, `)}) AND at >= ${since.toISOString()}::timestamptz
    GROUP BY 1 ORDER BY 1`);
  const mods = await db.execute<{ category: string; contributors: number }>(sql`
    SELECT split_part(module_id, '_', 1) AS category, count(distinct user_id)::int AS contributors
    FROM module_runs WHERE user_id IN (${sql.join(members.map((m) => sql`${m}`), sql`, `)}) AND created_at >= ${since.toISOString()}::timestamptz GROUP BY 1`);
  const active = await db.select({ n: sql<number>`count(distinct ${schema.sessions.userId})::int` }).from(schema.sessions).where(and(inArray(schema.sessions.userId, members), gte(schema.sessions.lastUsedAt, since)));
  return {
    organisation: inst.name, suppressed: false, cohort: members.length, activeLast90Days: active[0]?.n ?? 0,
    weeklyCheckInAverage: (weekly as unknown as { wk: string; n: number; contributors: number; avg: number }[]).filter((w) => w.contributors >= K).map((w) => ({ week: w.wk, average: w.avg, contributors: w.contributors })),
    programmeUse: (mods as unknown as { category: string; contributors: number }[]).filter((m) => m.contributors >= K),
    note: "Aggregated and suppressed below small cell sizes. No individual data is available to organisations.",
  };
});
