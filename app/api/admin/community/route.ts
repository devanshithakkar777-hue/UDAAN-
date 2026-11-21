import { z } from "zod";
import { asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";

export const GET = route({ auth: ["admin", "moderator"] }, async () => {
  const held = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.status, "held")).orderBy(asc(schema.communityPosts.createdAt)).limit(100);
  const reports = await db.select({ r: schema.communityReports, p: schema.communityPosts }).from(schema.communityReports).innerJoin(schema.communityPosts, eq(schema.communityPosts.id, schema.communityReports.postId)).where(isNull(schema.communityReports.resolvedAt)).limit(100);
  const stories = await db.select().from(schema.stories).where(eq(schema.stories.status, "pending")).limit(50);
  return { held: held.map((p) => ({ id: p.id, handle: p.handle, body: p.body, riskLevel: p.riskLevel, at: p.createdAt })), reports: (reports as { r: typeof schema.communityReports.$inferSelect; p: typeof schema.communityPosts.$inferSelect }[]).map(({ r, p }) => ({ id: r.id, postId: p.id, reason: r.reason, body: p.body, handle: p.handle })), stories: stories.map((s) => ({ id: s.id, title: s.title, body: s.body, topic: s.topic })) };
});
export const POST = route({ auth: ["admin"] }, async ({ req }) => {
  const b = await body(req, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(2).max(80), description: z.string().min(2).max(400), kind: z.enum(["peer", "student", "grief", "relationship", "caregiver", "workshop"]), language: z.enum(["en", "hi", "mr", "gu"]).default("en") }));
  await db.insert(schema.communityGroups).values(b).onConflictDoNothing();
  return { ok: true };
});
