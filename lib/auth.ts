import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashIp, randomToken, sha256 } from "./crypto";
import { env } from "./env";

export const SESSION_COOKIE = "udaan_session";
const SESSION_DAYS = 30;
const MAX_FAILS = 8;

export type SessionUser = { id: string; email: string; role: string; displayName: string | null };

export const normEmail = (e: string) => e.trim().toLowerCase();

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 12); }
export async function verifyPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

/** Recovery code: shown once, stored hashed. Lets a user reset their password without an email service. */
export function makeRecoveryCode() {
  const raw = randomToken(12).replace(/[-_]/g, "").toUpperCase().slice(0, 16);
  return raw.match(/.{4}/g)!.join("-");
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "0.0.0.0").trim();
}

export async function createSession(userId: string) {
  const token = randomToken(32);
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(schema.sessions).values({
    userId, tokenHash: sha256(token), expiresAt,
    ipHash: hashIp(await clientIp()), userAgent: (h.get("user-agent") ?? "").slice(0, 200),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (t) await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha256(t)));
  jar.delete(SESSION_COOKIE);
}

export async function getUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const t = jar.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const rows = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, displayName: schema.users.displayName, disabledAt: schema.users.disabledAt, sid: schema.sessions.id, lastUsed: schema.sessions.lastUsedAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.tokenHash, sha256(t)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  const r = rows[0];
  if (!r || r.disabledAt) return null;
  if (Date.now() - r.lastUsed.getTime() > 10 * 60_000) {
    void db.update(schema.sessions).set({ lastUsedAt: new Date() }).where(eq(schema.sessions.id, r.sid)).catch(() => {});
    void db.update(schema.users).set({ lastSeenAt: new Date() }).where(eq(schema.users.id, r.id)).catch(() => {});
  }
  return { id: r.id, email: r.email, role: r.role, displayName: r.displayName };
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) { super(message); }
}

export async function requireUser(roles?: string[]): Promise<SessionUser> {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Please sign in");
  if (roles && !roles.includes(u.role)) throw new HttpError(403, "Not allowed");
  return u;
}

export async function registerFailure(userId: string) {
  const [u] = await db.select({ f: schema.users.failedLogins }).from(schema.users).where(eq(schema.users.id, userId));
  const f = (u?.f ?? 0) + 1;
  await db.update(schema.users).set({ failedLogins: f, lockedUntil: f >= MAX_FAILS ? new Date(Date.now() + 15 * 60_000) : null }).where(eq(schema.users.id, userId));
}
export async function clearFailures(userId: string) {
  await db.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, userId));
}
