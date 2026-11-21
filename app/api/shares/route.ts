import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { uuid } from "@/lib/schemas";

/** Consent-based sharing. Scopes are explicit and revocable. Journals, conversations and substance logs are never in scope by default. */
const Body = z.object({ professionalId: uuid, scope: z.array(z.enum(["mood_summary", "sleep_summary", "assigned_exercises", "prep_summary", "journal_excerpt"])).min(1), days: z.number().int().min(1).max(365).default(90) });

export const GET = route({}, async ({ user }) => {
  const rows = await db.select({ g: schema.shareGrants, name: schema.professionals.name }).from(schema.shareGrants).innerJoin(schema.professionals, eq(schema.professionals.id, schema.shareGrants.professionalId)).where(and(eq(schema.shareGrants.userId, user.id), isNull(schema.shareGrants.revokedAt)));
  return { items: rows.map(({ g, name }) => ({ id: g.id, professional: name, professionalId: g.professionalId, scope: g.scope, grantedAt: g.grantedAt, expiresAt: g.expiresAt })) };
});
export const POST = route({}, async ({ req, user }) => {
  const b = await body(req, Body);
  const [p] = await db.select().from(schema.professionals).where(and(eq(schema.professionals.id, b.professionalId), eq(schema.professionals.status, "verified")));
  if (!p) throw new HttpError(404, "Professional not found");
  const [g] = await db.insert(schema.shareGrants).values({ userId: user.id, professionalId: p.id, scope: b.scope, expiresAt: new Date(Date.now() + b.days * 864e5) }).returning({ id: schema.shareGrants.id });
  return { id: g.id };
});
