import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { decSafe, encOpt } from "@/lib/crypto";
import { uuid } from "@/lib/schemas";

/** Booking here is a request to the professional. Scheduling and payment are agreed directly with them. */
const Body = z.object({ professionalId: uuid, slot: z.string().datetime().optional(), mode: z.enum(["online", "in_person", "group", "family"]).default("online"), message: z.string().max(1500).optional(), prepSummary: z.string().max(4000).optional() });

export const GET = route({}, async ({ user }) => {
  const rows = await db.select({ b: schema.bookings, name: schema.professionals.name }).from(schema.bookings).innerJoin(schema.professionals, eq(schema.professionals.id, schema.bookings.professionalId)).where(eq(schema.bookings.userId, user.id)).orderBy(desc(schema.bookings.createdAt));
  return { items: rows.map(({ b, name }) => ({ id: b.id, professional: name, professionalId: b.professionalId, slot: b.slot, mode: b.mode, status: b.status, message: decSafe(user.id, b.messageEnc), prepSummary: decSafe(user.id, b.prepSummaryEnc) })) };
});
export const POST = route({ limit: { key: "booking", max: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Body);
  const [p] = await db.select().from(schema.professionals).where(eq(schema.professionals.id, b.professionalId));
  if (!p || p.status !== "verified") throw new HttpError(404, "Professional not found");
  const [r] = await db.insert(schema.bookings).values({ userId: user.id, professionalId: p.id, slot: b.slot ? new Date(b.slot) : null, mode: b.mode, messageEnc: encOpt(user.id, b.message), prepSummaryEnc: encOpt(user.id, b.prepSummary) }).returning({ id: schema.bookings.id });
  return { id: r.id };
});
