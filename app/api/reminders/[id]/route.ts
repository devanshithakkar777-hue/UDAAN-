import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
export const DELETE = route<{ id: string }>({}, async ({ user, params }) => {
  await db.update(schema.reminders).set({ cancelledAt: new Date() }).where(and(eq(schema.reminders.id, params.id), eq(schema.reminders.userId, user.id)));
  return { ok: true };
});
