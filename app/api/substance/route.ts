import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encOpt } from "@/lib/crypto";

/** Strictest data tier: never shared with contacts, professionals (unless explicitly granted), institutions, or analytics. */
const Body = z.object({ kind: z.enum(["urge", "used", "resisted"]), intensity: z.number().int().min(0).max(10).optional().nullable(), trigger: z.string().max(300).optional().nullable(), note: z.string().max(1000).optional().nullable() });

export const GET = route({}, async ({ user }) => {
  const rows = await db.select().from(schema.substanceLogs).where(and(eq(schema.substanceLogs.userId, user.id), gte(schema.substanceLogs.at, new Date(Date.now() - 90 * 864e5)))).orderBy(desc(schema.substanceLogs.at)).limit(300);
  const [p] = await db.select({ show: schema.profiles.showDayCounter }).from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const recent = rows.filter((r) => r.at.getTime() > Date.now() - 30 * 864e5);
  const usedDays = new Set(recent.filter((r) => r.kind === "used").map((r) => r.at.toISOString().slice(0, 10)));
  return {
    items: rows.map((r) => ({ id: r.id, at: r.at, kind: r.kind, intensity: r.intensity, trigger: decSafe(user.id, r.triggerEnc), note: decSafe(user.id, r.noteEnc) })),
    // Opt-in only, and never a streak that resets to zero: progress is shown over the recent period.
    summary: p?.show ? { daysWithoutLast30: 30 - usedDays.size, resisted: recent.filter((r) => r.kind === "resisted").length, urges: recent.filter((r) => r.kind === "urge").length } : null,
  };
});
export const POST = route({ limit: { key: "substance", max: 60, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Body);
  await db.insert(schema.substanceLogs).values({ userId: user.id, kind: b.kind, intensity: b.intensity ?? null, triggerEnc: encOpt(user.id, b.trigger), noteEnc: encOpt(user.id, b.note) });
  return { ok: true };
});
