import { z } from "zod";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { assess } from "@/safety/classifier";
import { appendResources } from "@/safety/crisis";

const CONTACT = /(\+?\d[\d\s-]{8,}\d)|([\w.+-]+@[\w-]+\.[\w.]+)|(https?:\/\/|www\.)|(@\w{3,})/i;

async function membership(groupId: string, userId: string) {
  const [m] = await db.select().from(schema.groupMembers).where(and(eq(schema.groupMembers.groupId, groupId), eq(schema.groupMembers.userId, userId)));
  if (!m) throw new HttpError(403, "Join the group to read and post");
  return m;
}

export const GET = route<{ groupId: string }>({}, async ({ user, params }) => {
  await membership(params.groupId, user.id);
  const rows = await db.select().from(schema.communityPosts).where(and(eq(schema.communityPosts.groupId, params.groupId), or(eq(schema.communityPosts.status, "visible"), and(eq(schema.communityPosts.authorId, user.id), eq(schema.communityPosts.status, "held"))))).orderBy(asc(schema.communityPosts.createdAt)).limit(300);
  return { items: rows.map((p) => ({ id: p.id, handle: p.handle, parentId: p.parentId, body: p.body, status: p.status, mine: p.authorId === user.id, at: p.createdAt })) };
});

export const POST = route<{ groupId: string }>({ limit: { key: "community-post", max: 20, windowSec: 3600 } }, async ({ req, user, params }) => {
  const m = await membership(params.groupId, user.id);
  if (m.mutedUntil && m.mutedUntil > new Date()) throw new HttpError(403, "Posting is paused for you for now");
  const b = await body(req, z.object({ body: z.string().trim().min(1).max(2000), parentId: z.string().uuid().optional() }));
  const a = await assess(b.body);
  const held = a.level >= 2 || CONTACT.test(b.body) || a.flags.some((f) => ["abuse_or_coercion", "harm_others", "eating_disorder"].includes(f));
  const [p] = await db.insert(schema.communityPosts).values({ groupId: params.groupId, authorId: user.id, handle: m.handle, parentId: b.parentId ?? null, body: b.body, status: held ? "held" : "visible", riskLevel: a.level }).returning({ id: schema.communityPosts.id });
  if (a.level >= 2) {
    await db.insert(schema.safetyEvents).values({ userId: user.id, level: a.level, signals: a.signals.slice(0, 6), stage: "pre", action: "community_post_held" });
    return { id: p.id, held: true, support: appendResources("I'm really glad you said something. Your post is being looked at by a person before it's shared, and I don't want you to wait alone for that.", a) };
  }
  return { id: p.id, held, note: held ? "Your post is being reviewed by a moderator before it appears. We hold posts that include contact details or sensitive topics to keep everyone safe." : undefined };
});
