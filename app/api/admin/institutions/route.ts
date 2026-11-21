import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { randomToken } from "@/lib/crypto";

export const GET = route({ auth: ["admin"] }, async () => ({ items: await db.select().from(schema.institutions).orderBy(desc(schema.institutions.createdAt)) }));
export const POST = route({ auth: ["admin"] }, async ({ req }) => {
  const b = await body(req, z.object({ name: z.string().min(2).max(120), kind: z.enum(["university", "employer", "school", "ngo", "clinic"]), minCohort: z.number().int().min(10).max(1000).default(20) }));
  const joinCode = randomToken(5).replace(/[-_]/g, "").toUpperCase().slice(0, 8);
  const [i] = await db.insert(schema.institutions).values({ ...b, joinCode }).returning();
  return { id: i.id, joinCode };
});
