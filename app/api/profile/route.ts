import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { lang } from "@/lib/schemas";

const Body = z.object({
  tone: z.enum(["gentle", "balanced", "direct"]),
  style: z.enum(["listener", "guide", "coach", "companion"]),
  askListenOrHelp: z.boolean(),
  language: lang,
  stage: z.enum(["student", "early_career", "parent", "older_adult", "caregiver", "other"]).nullable(),
  memoryEnabled: z.boolean(),
  sensitiveMemoryEnabled: z.boolean(),
  discreetMode: z.boolean(),
  discreetName: z.string().trim().max(30).nullable(),
  lowEnergyMode: z.boolean(),
  dailyReflection: z.boolean(),
  seasonalSupport: z.boolean(),
  independentDays: z.boolean(),
  showDayCounter: z.boolean(),
  timezone: z.string().max(60),
  trainingConsent: z.boolean(),
  researchConsent: z.boolean(),
  onboarded: z.boolean(),
  displayName: z.string().trim().max(60).nullable(),
}).partial();

export const GET = route({}, async ({ user }) => {
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  return { profile: p };
});

export const PATCH = route({}, async ({ req, user }) => {
  const { onboarded, displayName, ...b } = await body(req, Body);
  const set: Record<string, unknown> = { ...b, updatedAt: new Date() };
  if (onboarded) set.onboardedAt = new Date();
  await db.update(schema.profiles).set(set).where(eq(schema.profiles.userId, user.id));
  if (displayName !== undefined) await db.update(schema.users).set({ displayName }).where(eq(schema.users.id, user.id));
  if (b.trainingConsent !== undefined) await db.insert(schema.consents).values({ userId: user.id, kind: "training", granted: b.trainingConsent });
  if (b.researchConsent !== undefined) await db.insert(schema.consents).values({ userId: user.id, kind: "research", granted: b.researchConsent });
  return { ok: true };
});
