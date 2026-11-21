import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decJson, encJson } from "@/lib/crypto";
import { PlanSchema, emptyPlan as empty } from "@/lib/plan";


export const GET = route({}, async ({ user }) => {
  const [p] = await db.select().from(schema.safetyPlans).where(eq(schema.safetyPlans.userId, user.id));
  return { plan: decJson(user.id, p?.dataEnc, empty) ?? empty, updatedAt: p?.updatedAt ?? null };
});
export const PUT = route({}, async ({ req, user }) => {
  const plan = await body(req, PlanSchema);
  const v = { userId: user.id, dataEnc: encJson(user.id, plan), updatedAt: new Date() };
  await db.insert(schema.safetyPlans).values(v).onConflictDoUpdate({ target: schema.safetyPlans.userId, set: v });
  return { ok: true };
});
