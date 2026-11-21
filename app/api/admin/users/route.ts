import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { audit } from "@/lib/audit";

/** No message content is ever available here. Admins see account metadata only. */
export const GET = route({ auth: ["admin"] }, async () => {
  const rows = await db.select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, createdAt: schema.users.createdAt, lastSeenAt: schema.users.lastSeenAt, disabledAt: schema.users.disabledAt }).from(schema.users).orderBy(desc(schema.users.createdAt)).limit(300);
  return { items: rows };
});
export const PATCH = route({ auth: ["admin"] }, async ({ req, user }) => {
  const b = await body(req, z.object({ userId: z.string().uuid(), role: z.enum(["user", "professional", "moderator", "admin", "institution_admin"]).optional(), disabled: z.boolean().optional() }));
  if (b.userId === user.id && (b.disabled || (b.role && b.role !== "admin"))) return { ok: false, error: "You can't lock yourself out" };
  const set: Record<string, unknown> = {};
  if (b.role) set.role = b.role;
  if (b.disabled !== undefined) set.disabledAt = b.disabled ? new Date() : null;
  await db.update(schema.users).set(set).where(eq(schema.users.id, b.userId));
  await audit(user.id, "admin.user_updated", null, { target: b.userId, ...set });
  return { ok: true };
});
