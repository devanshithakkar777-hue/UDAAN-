import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import webpush from "web-push";
import { db, schema } from "@/db";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { decSafe } from "@/lib/crypto";

export const runtime = "nodejs";

const DEFAULTS: Record<string, string> = {
  check_in: "A gentle check-in. How are you doing today?",
  event_followup: "You wanted a check-in after your event. How did it go? Good or hard, I'd like to hear.",
  wind_down: "When you're ready, a slow wind-down is here for you.",
  morning: "Good morning. One small thing to start the day, if you like.",
  daily_reflection: "Your reflection question for today is ready, whenever you are.",
  seasonal: "A gentle note: some seasons are heavier. Your Low-Day Kit is here if you want it.",
};

/** Call every few minutes from a scheduler (Vercel Cron, Cloud Scheduler, or crontab). */
export async function POST(req: NextRequest) {
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!env.cronSecret || !safeEqual(given, env.cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const v = env.vapid;
  if (!v.pub || !v.priv) return NextResponse.json({ ok: true, skipped: "VAPID keys not configured" });
  webpush.setVapidDetails(v.subject, v.pub, v.priv);

  const due = await db.select().from(schema.reminders).where(and(lte(schema.reminders.dueAt, new Date()), isNull(schema.reminders.sentAt), isNull(schema.reminders.cancelledAt))).limit(200);
  let sent = 0;
  for (const r of due) {
    const subs = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, r.userId));
    const [p] = await db.select({ discreet: schema.profiles.discreetMode }).from(schema.profiles).where(eq(schema.profiles.userId, r.userId));
    // In discreet mode the notification reveals nothing about what the app is.
    const payload = JSON.stringify(p?.discreet ? { title: "Reminder", body: "You have a reminder.", url: "/" } : { title: "UDAAN", body: decSafe(r.userId, r.textEnc) || DEFAULTS[r.kind], url: "/" });
    const dead: string[] = [];
    for (const s of subs) {
      try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; }
      catch (e) { if ((e as { statusCode?: number }).statusCode === 404 || (e as { statusCode?: number }).statusCode === 410) dead.push(s.endpoint); }
    }
    if (dead.length) await db.delete(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.endpoint, dead));
    await db.update(schema.reminders).set({ sentAt: new Date() }).where(eq(schema.reminders.id, r.id));
  }
  return NextResponse.json({ ok: true, due: due.length, sent });
}
