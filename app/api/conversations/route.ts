import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { decSafe } from "@/lib/crypto";

export const GET = route({}, async ({ user }) => {
  const rows = await db.select().from(schema.conversations)
    .where(and(eq(schema.conversations.userId, user.id), isNull(schema.conversations.archivedAt)))
    .orderBy(desc(schema.conversations.updatedAt)).limit(60);
  return { conversations: rows.map((c) => ({ id: c.id, mode: c.mode, title: decSafe(user.id, c.titleEnc) ?? "Conversation", updatedAt: c.updatedAt })) };
});
