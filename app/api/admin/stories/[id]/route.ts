import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
export const PATCH = route<{ id: string }>({ auth: ["admin", "moderator"] }, async ({ req, user, params }) => {
  const { status } = await body(req, z.object({ status: z.enum(["published", "rejected"]) }));
  await db.update(schema.stories).set({ status, reviewedBy: user.id }).where(eq(schema.stories.id, params.id));
  return { ok: true };
});
