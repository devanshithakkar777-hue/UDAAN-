import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError, hashPassword, verifyPassword } from "@/lib/auth";

/** App-lock PIN. Verified server-side so it cannot be brute-forced from the client without rate limits. */
const Set = z.object({ pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4 to 8 digits") });
const Check = z.object({ pin: z.string().regex(/^\d{4,8}$/) });

export const PUT = route({ limit: { key: "pin-set", max: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Set);
  await db.update(schema.users).set({ pinHash: await hashPassword(b.pin) }).where(eq(schema.users.id, user.id));
  return { ok: true };
});
export const DELETE = route({}, async ({ user }) => {
  await db.update(schema.users).set({ pinHash: null }).where(eq(schema.users.id, user.id));
  return { ok: true };
});
export const POST = route({ limit: { key: "pin-check", max: 10, windowSec: 600 } }, async ({ req, user }) => {
  const b = await body(req, Check);
  const [u] = await db.select({ h: schema.users.pinHash }).from(schema.users).where(eq(schema.users.id, user.id));
  if (!u?.h) return { ok: true, hasPin: false };
  if (!(await verifyPassword(b.pin, u.h))) throw new HttpError(401, "That PIN isn't right");
  return { ok: true, hasPin: true };
});
export const GET = route({}, async ({ user }) => {
  const [u] = await db.select({ h: schema.users.pinHash }).from(schema.users).where(eq(schema.users.id, user.id));
  return { hasPin: !!u?.h };
});
