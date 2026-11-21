import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError, destroySession, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** Permanent deletion. Content tables cascade; safety events are retained only with the user reference removed. */
export const DELETE = route({ limit: { key: "acct-delete", max: 5, windowSec: 3600 } }, async ({ req, user }) => {
  const { password, confirm } = await body(req, z.object({ password: z.string().min(1), confirm: z.literal("DELETE") }));
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!(await verifyPassword(password, u.passwordHash))) throw new HttpError(401, "Password is not right");
  await audit(user.id, "account.deleted");
  await db.update(schema.auditLogs).set({ userId: null }).where(eq(schema.auditLogs.userId, user.id));
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  await destroySession();
  return { ok: true };
});
