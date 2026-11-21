import { db, schema } from "@/db";
import type { Domain } from "@/modules/types";

export async function recordGrowth(userId: string, domain: Domain, kind: "explored" | "practised" | "independent" | "reflection") {
  await db.insert(schema.growthEvents).values({ userId, domain, kind });
}
