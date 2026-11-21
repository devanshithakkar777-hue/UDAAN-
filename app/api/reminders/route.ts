import { z } from "zod";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encOpt } from "@/lib/crypto";

/** Every reminder is created by the person. No guilt, no streak, no "you didn't check in" messages. */
const Body = z.object({ kind: z.enum(["check_in", "event_followup", "wind_down", "morning", "daily_reflection", "seasonal"]), text: z.string().max(300).optional().nullable(), dueAt: z.string().datetime() });

export const GET = route({}, async ({ user }) => {
  const rows = await db.select().from(schema.reminders).where(and(eq(schema.reminders.userId, user.id), isNull(schema.reminders.cancelledAt), isNull(schema.reminders.sentAt))).orderBy(asc(schema.reminders.dueAt));
  return { items: rows.map((r) => ({ id: r.id, kind: r.kind, text: decSafe(user.id, r.textEnc), dueAt: r.dueAt })) };
});
export const POST = route({ limit: { key: "reminder", max: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Body);
  const [r] = await db.insert(schema.reminders).values({ userId: user.id, kind: b.kind, textEnc: encOpt(user.id, b.text), dueAt: new Date(b.dueAt) }).returning({ id: schema.reminders.id });
  return { id: r.id };
});
