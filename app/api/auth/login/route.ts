import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { email } from "@/lib/schemas";
import { HttpError, clearFailures, clientIp, createSession, normEmail, registerFailure, verifyPassword } from "@/lib/auth";
import { hashIp } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/ratelimit";

const DUMMY = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5b3sH7Xo0sZ5xX9a6S5r3m3n1v1xYqS";
const Body = z.object({ email, password: z.string().min(1).max(200) });

export const POST = route({ auth: false, limit: { key: "login-ip", max: 30, windowSec: 600 } }, async ({ req }) => {
  const b = await body(req, Body);
  const e = normEmail(b.email);
  const per = await rateLimit(`login-email:${e}`, 12, 900);
  if (!per.ok) throw new HttpError(429, "Too many attempts. Please wait a few minutes.", { retryAfter: per.retryAfter });
  const [u] = await db.select().from(schema.users).where(eq(schema.users.emailLower, e));
  const ok = await verifyPassword(b.password, u?.passwordHash ?? DUMMY);
  const ip = hashIp(await clientIp());
  if (!u || u.disabledAt) { await audit(null, "auth.login_failed", ip); throw new HttpError(401, "Email or password is not right"); }
  if (u.lockedUntil && u.lockedUntil > new Date()) throw new HttpError(429, "This account is paused for a few minutes after several wrong attempts. Please try again shortly.");
  if (!ok) { await registerFailure(u.id); await audit(u.id, "auth.login_failed", ip); throw new HttpError(401, "Email or password is not right"); }
  await clearFailures(u.id);
  await createSession(u.id);
  await audit(u.id, "auth.login", ip);
  return { ok: true };
});
