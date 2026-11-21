import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface RateResult { ok: boolean; remaining: number; retryAfter: number }

/** Postgres-backed fixed-window limiter: correct across multiple app instances, no Redis required. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateResult> {
  const now = Date.now();
  const start = new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000);
  const rows = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${start.toISOString()}::timestamptz, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`);
  const count = Number((rows as unknown as { count: number }[])[0].count);
  const retryAfter = Math.max(1, Math.ceil((start.getTime() + windowSec * 1000 - now) / 1000));
  if (Math.random() < 0.01) void db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`).catch(() => {});
  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter };
}
