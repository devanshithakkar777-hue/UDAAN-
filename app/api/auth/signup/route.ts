import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { email, password, text, lang } from "@/lib/schemas";
import { clientIp, createSession, hashPassword, makeRecoveryCode, normEmail } from "@/lib/auth";
import { hashIp, sha256 } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { HttpError } from "@/lib/auth";

const Body = z.object({ email, password, displayName: text(60).optional(), language: lang.optional(), isAdult: z.literal(true, { message: "UDAAN is for people 18 and over" }) });

export const POST = route({ auth: false, limit: { key: "signup", max: 10, windowSec: 3600 } }, async ({ req }) => {
  const b = await body(req, Body);
  const emailLower = normEmail(b.email);
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.emailLower, emailLower));
  if (existing) throw new HttpError(409, "An account with this email already exists. Try signing in.");
  const recovery = makeRecoveryCode();
  const role = env.adminBootstrapEmail && emailLower === env.adminBootstrapEmail ? "admin" : "user";
  const [u] = await db.insert(schema.users).values({
    email: b.email, emailLower, passwordHash: await hashPassword(b.password), recoveryHash: sha256(recovery.replace(/-/g, "")),
    displayName: b.displayName ?? null, role,
  }).returning({ id: schema.users.id });
  await db.insert(schema.profiles).values({ userId: u.id, language: b.language ?? "en" });
  await createSession(u.id);
  await audit(u.id, "auth.signup", hashIp(await clientIp()));
  return { ok: true, recoveryCode: recovery };
});
