import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { makeHandle } from "@/lib/handles";
import { uuid } from "@/lib/schemas";

/** Moderated, anonymous groups. There is no direct messaging between members. */
export const GET = route({}, async ({ user }) => {
  const groups = await db.select().from(schema.communityGroups).where(isNull(schema.communityGroups.archivedAt));
  const mine = await db.select().from(schema.groupMembers).where(eq(schema.groupMembers.userId, user.id));
  return { items: groups.map((g) => ({ id: g.id, slug: g.slug, name: g.name, description: g.description, kind: g.kind, language: g.language, joined: mine.some((m) => m.groupId === g.id), handle: mine.find((m) => m.groupId === g.id)?.handle ?? null })) };
});
export const POST = route({ limit: { key: "community-join", max: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, z.object({ groupId: uuid, action: z.enum(["join", "leave"]) }));
  const [g] = await db.select().from(schema.communityGroups).where(and(eq(schema.communityGroups.id, b.groupId), isNull(schema.communityGroups.archivedAt)));
  if (!g) throw new HttpError(404, "Group not found");
  if (b.action === "leave") { await db.delete(schema.groupMembers).where(and(eq(schema.groupMembers.groupId, g.id), eq(schema.groupMembers.userId, user.id))); return { ok: true }; }
  await db.insert(schema.groupMembers).values({ groupId: g.id, userId: user.id, handle: makeHandle() }).onConflictDoNothing();
  return { ok: true };
});
