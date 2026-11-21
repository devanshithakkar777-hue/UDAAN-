import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";

/** Joining an institution shares nothing individual. Institutions only ever see aggregates above a minimum cohort size. */
export const GET = route({}, async ({ user }) => {
  const rows = await db.select({ i: schema.institutions, role: schema.institutionMembers.role }).from(schema.institutionMembers).innerJoin(schema.institutions, eq(schema.institutions.id, schema.institutionMembers.institutionId)).where(eq(schema.institutionMembers.userId, user.id));
  return { items: rows.map(({ i, role }) => ({ id: i.id, name: i.name, kind: i.kind, role })) };
});
export const POST = route({ limit: { key: "inst-join", max: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const { code } = await body(req, z.object({ code: z.string().trim().min(4).max(30) }));
  const [i] = await db.select().from(schema.institutions).where(eq(schema.institutions.joinCode, code.toUpperCase()));
  if (!i) throw new HttpError(404, "That code didn't match an organisation");
  await db.insert(schema.institutionMembers).values({ institutionId: i.id, userId: user.id }).onConflictDoNothing();
  return { name: i.name };
});
export const DELETE = route({}, async ({ req, user }) => {
  const { id } = await body(req, z.object({ id: z.string().uuid() }));
  await db.delete(schema.institutionMembers).where(and(eq(schema.institutionMembers.userId, user.id), eq(schema.institutionMembers.institutionId, id)));
  return { ok: true };
});
