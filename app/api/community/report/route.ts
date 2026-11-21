import { z } from "zod";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { uuid } from "@/lib/schemas";
export const POST = route({ limit: { key: "report", max: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, z.object({ postId: uuid, reason: z.string().trim().min(1).max(400) }));
  await db.insert(schema.communityReports).values({ postId: b.postId, reporterId: user.id, reason: b.reason });
  return { ok: true };
});
