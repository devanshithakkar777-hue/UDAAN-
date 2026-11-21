import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { decSafe } from "@/lib/crypto";
import { HttpError } from "@/lib/auth";

export const GET = route<{ id: string }>({}, async ({ user, params }) => {
  const [c] = await db.select().from(schema.conversations).where(and(eq(schema.conversations.id, params.id), eq(schema.conversations.userId, user.id)));
  if (!c) throw new HttpError(404, "Not found");
  const rows = await db.select().from(schema.messages).where(eq(schema.messages.conversationId, c.id)).orderBy(asc(schema.messages.createdAt));
  return {
    conversation: { id: c.id, mode: c.mode, title: decSafe(user.id, c.titleEnc) },
    messages: rows.filter((m) => m.role !== "event").map((m) => ({ id: m.id, role: m.role, text: decSafe(user.id, m.contentEnc) ?? "", level: m.safetyLevel, at: m.createdAt })),
  };
});

export const DELETE = route<{ id: string }>({}, async ({ user, params }) => {
  await db.delete(schema.conversations).where(and(eq(schema.conversations.id, params.id), eq(schema.conversations.userId, user.id)));
  return { ok: true };
});
