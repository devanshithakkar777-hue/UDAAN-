import { and, count, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { env } from "@/lib/env";
import { RESOURCES } from "@/safety/resources";

export const GET = route({ auth: ["admin", "moderator"] }, async () => {
  const d7 = new Date(Date.now() - 7 * 864e5), d30 = new Date(Date.now() - 30 * 864e5);
  const [[users], [active], [open], [pending], [held], [reports], [l3], [l2]] = await Promise.all([
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.users).where(gte(schema.users.lastSeenAt, d7)),
    db.select({ n: count() }).from(schema.incidents).where(eq(schema.incidents.status, "open")),
    db.select({ n: count() }).from(schema.professionals).where(eq(schema.professionals.status, "pending")),
    db.select({ n: count() }).from(schema.communityPosts).where(eq(schema.communityPosts.status, "held")),
    db.select({ n: count() }).from(schema.communityReports).where(sql`resolved_at is null`),
    db.select({ n: count() }).from(schema.safetyEvents).where(and(eq(schema.safetyEvents.level, 3), gte(schema.safetyEvents.createdAt, d30))),
    db.select({ n: count() }).from(schema.safetyEvents).where(and(eq(schema.safetyEvents.level, 2), gte(schema.safetyEvents.createdAt, d30))),
  ]);
  return {
    users: users.n, activeLast7Days: active.n, openIncidents: open.n, pendingProfessionals: pending.n, heldPosts: held.n, openReports: reports.n,
    safetyLast30Days: { imminent: l3.n, elevated: l2.n },
    launchChecks: {
      aiProvider: env.aiProvider,
      crisisResourcesVerifiedFlag: env.crisisVerified,
      unverifiedResources: RESOURCES.filter((r) => !r.verified).map((r) => r.name),
      vapidConfigured: !!(env.vapid.pub && env.vapid.priv),
    },
  };
});
