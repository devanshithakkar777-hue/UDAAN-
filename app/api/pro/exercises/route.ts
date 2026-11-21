import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { encOpt, encrypt } from "@/lib/crypto";
import { uuid } from "@/lib/schemas";

/** Between-sessions companion: assigned only to clients who granted the assigned_exercises scope. No monitoring is implied. */
export const POST = route({ auth: ["professional", "admin"] }, async ({ req, user }) => {
  const b = await body(req, z.object({ grantId: uuid, title: z.string().trim().min(1).max(200), description: z.string().max(2000).optional(), dueAt: z.string().datetime().optional() }));
  const [pro] = await db.select().from(schema.professionals).where(and(eq(schema.professionals.userId, user.id), eq(schema.professionals.status, "verified")));
  if (!pro) throw new HttpError(403, "Not verified");
  const [g] = await db.select().from(schema.shareGrants).where(and(eq(schema.shareGrants.id, b.grantId), eq(schema.shareGrants.professionalId, pro.id), isNull(schema.shareGrants.revokedAt)));
  if (!g || !g.scope.includes("assigned_exercises")) throw new HttpError(403, "The client has not allowed assigned exercises");
  await db.insert(schema.assignedExercises).values({ professionalId: pro.id, userId: g.userId, titleEnc: encrypt(g.userId, b.title), descriptionEnc: encOpt(g.userId, b.description), dueAt: b.dueAt ? new Date(b.dueAt) : null });
  return { ok: true };
});
