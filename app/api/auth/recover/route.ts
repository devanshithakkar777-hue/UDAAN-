import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { email, password } from "@/lib/schemas";
import { HttpError, clientIp, createSession, hashPassword, makeRecoveryCode, normEmail } from "@/lib/auth";
import { hashIp, safeEqual, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

const Body = z.object({ email, recoveryCode: z.string().min(8).max(40), newPassword: password });

export const POST = route({ auth: false, limit: { key: "recover-ip", max: 10, windowSec: 3600 } }, async ({ req }) => {
  const b = await body(req, Body);
  const e = normEmail(b.email);
  const per = await rateLimit(`recover-email:${e}`, 5, 3600);
  if (!per.ok) throw new HttpError(429, "Too many attempts. Please try again later.", { retryAfter: per.retryAfter });
  const [u] = await db.select().from(schema.users).where(eq(schema.users.emailLower, e));
  const given = sha256(b.recoveryCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase());
  if (!u || !u.recoveryHash || !safeEqual(given, u.recoveryHash)) throw new HttpError(401, "That email and recovery code don't match");
  const fresh = makeRecoveryCode();
  await db.update(schema.users).set({ passwordHash: await hashPassword(b.newPassword), recoveryHash: sha256(fresh.replace(/-/g, "")), failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, u.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, u.id));
  await createSession(u.id);
  await audit(u.id, "auth.recovered", hashIp(await clientIp()));
  return { ok: true, recoveryCode: fresh };
});
