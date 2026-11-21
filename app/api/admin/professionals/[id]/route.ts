import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { audit } from "@/lib/audit";

/** A human checks the registration with the issuing body before setting verified. */
export const PATCH = route<{ id: string }>({ auth: ["admin"] }, async ({ req, user, params }) => {
  const { status } = await body(req, z.object({ status: z.enum(["verified", "rejected", "suspended", "pending"]) }));
  const [p] = await db.update(schema.professionals).set({ status, verifiedAt: status === "verified" ? new Date() : null, verifiedBy: status === "verified" ? user.id : null }).where(eq(schema.professionals.id, params.id)).returning();
  if (p?.userId) await db.update(schema.users).set({ role: status === "verified" ? "professional" : "user" }).where(eq(schema.users.id, p.userId));
  await audit(user.id, "admin.professional_status", null, { id: params.id, status });
  return { ok: true };
});
