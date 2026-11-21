import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { password } from "@/lib/schemas";
import { HttpError, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

const Body = z.object({ current: z.string().min(1), next: password });
export const POST = route({ limit: { key: "pw-change", max: 8, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Body);
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!(await verifyPassword(b.current, u.passwordHash))) throw new HttpError(401, "Current password is not right");
  await db.update(schema.users).set({ passwordHash: await hashPassword(b.next) }).where(eq(schema.users.id, user.id));
  await audit(user.id, "auth.password_changed");
  return { ok: true };
});
