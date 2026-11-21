import { db, schema } from "@/db";

export async function logFlowSafety(userId: string, level: number, action: string) {
  await db.insert(schema.safetyEvents).values({ userId, level, signals: ["flow"], stage: "pre", action });
}
