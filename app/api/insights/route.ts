import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

/**
 * Patterns from the person's own check-ins, offered as observations and hypotheses.
 * Never diagnoses; never infers anxiety or depression from sleep or activity data.
 */
export const GET = route({}, async ({ user }) => {
  const since = new Date(Date.now() - 90 * 864e5);
  const moods = await db.select().from(schema.moodEntries).where(and(eq(schema.moodEntries.userId, user.id), gte(schema.moodEntries.at, since)));
  const sleeps = await db.select().from(schema.sleepEntries).where(eq(schema.sleepEntries.userId, user.id));
  const obs: string[] = [];

  if (moods.length >= 10) {
    const by = WD.map((_, i) => moods.filter((m) => m.at.getDay() === i).map((m) => m.valence));
    const overall = avg(moods.map((m) => m.valence))!;
    const lows = by.map((v, i) => ({ i, a: avg(v), n: v.length })).filter((x) => x.a != null && x.n >= 3).sort((a, b) => a.a! - b.a!);
    if (lows[0] && overall - lows[0].a! >= 0.6) obs.push(`Your check-ins tend to be lower on ${WD[lows[0].i]}s. That's a pattern worth being gentle with that day. It's only an observation from what you've logged.`);
    const evening = moods.filter((m) => m.at.getHours() >= 21).map((m) => m.valence), day = moods.filter((m) => m.at.getHours() < 18).map((m) => m.valence);
    if (evening.length >= 4 && day.length >= 4 && avg(day)! - avg(evening)! >= 0.7) obs.push("Late evenings seem heavier than daytime in your check-ins. Winding down earlier might be worth trying, if it feels right.");
    const recent = moods.filter((m) => m.at > new Date(Date.now() - 14 * 864e5)).map((m) => m.valence);
    const prior = moods.filter((m) => m.at <= new Date(Date.now() - 14 * 864e5) && m.at > new Date(Date.now() - 28 * 864e5)).map((m) => m.valence);
    if (recent.length >= 4 && prior.length >= 4) {
      const d = avg(recent)! - avg(prior)!;
      if (d >= 0.5) obs.push("The last two weeks look a little lighter than the two before. Worth noticing what has helped.");
      if (d <= -0.5) obs.push("The last two weeks look heavier than the two before. If that matches how it feels, it might be a good time to lean on your Low-Day Kit or reach out to someone.");
    }
  }
  if (sleeps.length >= 6 && moods.length >= 6) {
    const dayMood = new Map<string, number[]>();
    for (const m of moods) { const k = m.at.toISOString().slice(0, 10); dayMood.set(k, [...(dayMood.get(k) ?? []), m.valence]); }
    const hrs = (s: { bedtime: string | null; wake: string | null }) => {
      if (!s.bedtime || !s.wake) return null;
      const [bh, bm] = s.bedtime.split(":").map(Number), [wh, wm] = s.wake.split(":").map(Number);
      let d = wh * 60 + wm - (bh * 60 + bm); if (d <= 0) d += 1440; return d / 60;
    };
    const short: number[] = [], ok: number[] = [];
    for (const s of sleeps) { const h = hrs(s), v = dayMood.get(String(s.day)); if (h == null || !v) continue; (h < 6 ? short : ok).push(avg(v)!); }
    if (short.length >= 3 && ok.length >= 3 && avg(ok)! - avg(short)! >= 0.6) obs.push("On days after shorter sleep, your mood check-ins tend to be lower. It's a link in your own numbers, not a cause we can be sure of.");
  }

  const week = moods.filter((m) => m.at > new Date(Date.now() - 7 * 864e5));
  const lowDays = new Set(week.filter((m) => m.valence <= 2).map((m) => m.at.toISOString().slice(0, 10))).size;
  return { observations: obs, gentleCheckIn: lowDays >= 5, checkIns: moods.length };
});
