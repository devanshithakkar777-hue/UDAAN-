import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
export const DELETE = route<{ id: string }>({}, async ({ user, params }) => {
  await db.update(schema.shareGrants).set({ revokedAt: new Date() }).where(and(eq(schema.shareGrants.id, params.id), eq(schema.shareGrants.userId, user.id)));
  return { ok: true };
});
