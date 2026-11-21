import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { decSafe, encOpt } from "@/lib/crypto";

async function mine(id: string, userId: string) {
  const [p] = await db.select().from(schema.familyParticipants).where(and(eq(schema.familyParticipants.sessionId, id), eq(schema.familyParticipants.userId, userId)));
  if (!p) throw new HttpError(404, "Not found");
  return p;
}

export const GET = route<{ id: string }>({}, async ({ user, params }) => {
  const me = await mine(params.id, user.id);
  const [s] = await db.select().from(schema.familySessions).where(eq(schema.familySessions.id, params.id));
  const all = await db.select().from(schema.familyParticipants).where(eq(schema.familyParticipants.sessionId, params.id));
  return {
    topic: s.topic, status: s.status, participants: all.length,
    privateNotes: decSafe(user.id, me.privateNotesEnc),
    myStatement: decSafe(user.id, me.sharedStatementEnc), shared: !!me.sharedAt,
    // Other people's statements are visible only if they chose to share them.
    others: all.filter((p) => p.userId !== user.id && p.sharedAt).map((p, i) => ({ label: `Person ${i + 2}`, statement: decSafe(p.userId, p.sharedStatementEnc) })),
  };
});
const Put = z.object({ privateNotes: z.string().max(4000).optional(), statement: z.string().max(3000).optional(), share: z.boolean().optional() });
export const PUT = route<{ id: string }>({}, async ({ req, user, params }) => {
  await mine(params.id, user.id);
  const b = await body(req, Put);
  const set: Record<string, unknown> = {};
  if (b.privateNotes !== undefined) set.privateNotesEnc = encOpt(user.id, b.privateNotes);
  if (b.statement !== undefined) set.sharedStatementEnc = encOpt(user.id, b.statement);
  if (b.share !== undefined) { set.sharedAt = b.share ? new Date() : null; if (b.share) set.consentedAt = new Date(); }
  await db.update(schema.familyParticipants).set(set).where(and(eq(schema.familyParticipants.sessionId, params.id), eq(schema.familyParticipants.userId, user.id)));
  return { ok: true };
});
