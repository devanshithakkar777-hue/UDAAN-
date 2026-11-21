import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
export const PATCH = route<{ id: string }>({ auth: ["admin"] }, async ({ req, user, params }) => {
  const b = await body(req, z.object({ status: z.enum(["open", "reviewing", "closed"]), notes: z.string().max(4000).optional() }));
  await db.update(schema.incidents).set({ status: b.status, notes: b.notes ?? null, reviewerId: user.id, closedAt: b.status === "closed" ? new Date() : null }).where(eq(schema.incidents.id, params.id));
  return { ok: true };
});
