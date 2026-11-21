import { z } from "zod";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { decSafe, encrypt } from "@/lib/crypto";
import { text } from "@/lib/schemas";

export const GET = route({}, async ({ user }) => {
  const rows = await db.select().from(schema.memories).where(and(eq(schema.memories.userId, user.id), ne(schema.memories.status, "archived"))).orderBy(desc(schema.memories.createdAt)).limit(300);
  return { memories: rows.map((m) => ({ id: m.id, kind: m.kind, text: decSafe(user.id, m.contentEnc) ?? "", sensitive: m.sensitive, pinned: m.pinned, status: m.status, source: m.source, createdAt: m.createdAt })) };
});

const Add = z.object({ text: text(240), kind: z.enum(["fact", "person", "trigger", "goal", "coping", "value", "event", "preference"]).default("fact"), sensitive: z.boolean().default(false) });
export const POST = route({ limit: { key: "mem-add", max: 60, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Add);
  const [m] = await db.insert(schema.memories).values({ userId: user.id, kind: b.kind, contentEnc: encrypt(user.id, b.text), sensitive: b.sensitive, status: "active", source: "user" }).returning({ id: schema.memories.id });
  return { id: m.id };
});
