import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";

/** Moderate a held or reported post: approve (visible), remove, or mute the author. */
export const PATCH = route<{ id: string }>({ auth: ["admin", "moderator"] }, async ({ req, user, params }) => {
  const b = await body(req, z.object({ action: z.enum(["approve", "remove", "mute_author"]), reportId: z.string().uuid().optional() }));
  const [p] = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, params.id));
  if (!p) return { ok: false };
  if (b.action === "approve") await db.update(schema.communityPosts).set({ status: "visible" }).where(eq(schema.communityPosts.id, p.id));
  else await db.update(schema.communityPosts).set({ status: "removed" }).where(eq(schema.communityPosts.id, p.id));
  if (b.action === "mute_author" && p.authorId) await db.update(schema.groupMembers).set({ mutedUntil: new Date(Date.now() + 7 * 864e5) }).where(eq(schema.groupMembers.userId, p.authorId));
  if (b.reportId) await db.update(schema.communityReports).set({ resolvedAt: new Date(), resolvedBy: user.id, resolution: b.action }).where(eq(schema.communityReports.id, b.reportId));
  return { ok: true };
});
