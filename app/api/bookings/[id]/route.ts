import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";

const Body = z.object({ status: z.enum(["confirmed", "completed", "cancelled", "declined"]) });
export const PATCH = route<{ id: string }>({}, async ({ req, user, params }) => {
  const { status } = await body(req, Body);
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, params.id));
  if (!b) throw new HttpError(404, "Not found");
  const [pro] = await db.select().from(schema.professionals).where(and(eq(schema.professionals.id, b.professionalId), eq(schema.professionals.userId, user.id)));
  if (b.userId === user.id) { if (status !== "cancelled") throw new HttpError(403, "You can cancel a request"); }
  else if (!pro) throw new HttpError(403, "Not allowed");
  await db.update(schema.bookings).set({ status }).where(eq(schema.bookings.id, b.id));
  return { ok: true };
});
