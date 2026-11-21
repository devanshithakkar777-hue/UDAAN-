import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

const keyCache = new Map<string, Buffer>();

/** Per-user data key derived from the master key. Compromise of one user's derived key does not expose others. */
function userKey(userId: string): Buffer {
  let k = keyCache.get(userId);
  if (!k) {
    k = Buffer.from(hkdfSync("sha256", env.encKey, Buffer.from("udaan-v1"), Buffer.from(`user:${userId}`), 32));
    if (keyCache.size > 500) keyCache.clear();
    keyCache.set(userId, k);
  }
  return k;
}

/** AES-256-GCM. Format: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encrypt(userId: string, plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", userKey(userId), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

export function decrypt(userId: string, blob: string): string {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Malformed ciphertext");
  const d = createDecipheriv("aes-256-gcm", userKey(userId), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}

export const encOpt = (userId: string, s?: string | null) => (s ? encrypt(userId, s) : null);
export function decSafe(userId: string, blob?: string | null): string | null {
  if (!blob) return null;
  try { return decrypt(userId, blob); } catch { return null; }
}
export const encJson = (userId: string, v: unknown) => encrypt(userId, JSON.stringify(v));
export function decJson<T>(userId: string, blob?: string | null, fallback?: T): T | undefined {
  const s = decSafe(userId, blob);
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const hashIp = (ip: string) => sha256(env.ipSalt + ip).slice(0, 32);
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
