import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { randomToken } from "@/lib/crypto";

/** Two Perspectives: voluntary, no judge role, no access to the other person's private notes without consent. */
export const GET = route({}, async ({ user }) => {
  const rows = await db.select({ s: schema.familySessions, joinedAt: schema.familyParticipants.joinedAt }).from(schema.familyParticipants).innerJoin(schema.familySessions, eq(schema.familySessions.id, schema.familyParticipants.sessionId)).where(eq(schema.familyParticipants.userId, user.id)).orderBy(desc(schema.familyParticipants.joinedAt));
  return { items: rows.map(({ s }) => ({ id: s.id, topic: s.topic, status: s.status, inviteCode: s.creatorId === user.id ? s.inviteCode : undefined, mine: s.creatorId === user.id })) };
});
const Create = z.object({ topic: z.string().trim().max(120).optional() });
const Join = z.object({ code: z.string().trim().min(6).max(20) });
export const POST = route({ limit: { key: "family", max: 10, windowSec: 3600 } }, async ({ req, user }) => {
  const raw = await req.json();
  if ("code" in raw) {
    const { code } = Join.parse(raw);
    const [s] = await db.select().from(schema.familySessions).where(eq(schema.familySessions.inviteCode, code.toUpperCase()));
    if (!s || s.status === "closed") throw new HttpError(404, "That invite code didn't work");
    await db.insert(schema.familyParticipants).values({ sessionId: s.id, userId: user.id }).onConflictDoNothing();
    await db.update(schema.familySessions).set({ status: "active" }).where(eq(schema.familySessions.id, s.id));
    return { id: s.id };
  }
  const b = Create.parse(raw);
  const [s] = await db.insert(schema.familySessions).values({ creatorId: user.id, inviteCode: randomToken(5).replace(/[-_]/g, "").toUpperCase().slice(0, 8), topic: b.topic ?? null }).returning();
  await db.insert(schema.familyParticipants).values({ sessionId: s.id, userId: user.id });
  return { id: s.id, inviteCode: s.inviteCode };
});
void body;
