import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";

/** An item is only ever shown or used by the companion once a named reviewer has approved it. */
export const PATCH = route<{ id: string }>({ auth: ["admin"] }, async ({ req, params }) => {
  const b = await body(req, z.object({ status: z.enum(["draft", "approved", "retired"]), reviewer: z.string().min(1).max(120).optional() }));
  const [c] = await db.select().from(schema.contentItems).where(eq(schema.contentItems.id, params.id));
  if (!c) throw new HttpError(404, "Not found");
  if (b.status === "approved" && !(b.reviewer ?? c.reviewer)) throw new HttpError(400, "A named reviewer is required to approve");
  await db.update(schema.contentItems).set({ status: b.status, reviewer: b.reviewer ?? c.reviewer, reviewedAt: b.status === "approved" ? new Date() : c.reviewedAt }).where(eq(schema.contentItems.id, params.id));
  return { ok: true };
});
