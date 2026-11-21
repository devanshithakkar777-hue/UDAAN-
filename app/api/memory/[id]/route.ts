import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { encrypt } from "@/lib/crypto";
import { text } from "@/lib/schemas";

const Patch = z.object({ text: text(240).optional(), pinned: z.boolean().optional(), approve: z.boolean().optional() });

export const PATCH = route<{ id: string }>({}, async ({ req, user, params }) => {
  const b = await body(req, Patch);
  const set: Record<string, unknown> = {};
  if (b.text) set.contentEnc = encrypt(user.id, b.text);
  if (b.pinned !== undefined) set.pinned = b.pinned;
  if (b.approve) set.status = "active";
  if (Object.keys(set).length) await db.update(schema.memories).set(set).where(and(eq(schema.memories.id, params.id), eq(schema.memories.userId, user.id)));
  return { ok: true };
});

/** Deletion is real deletion, not archiving. */
export const DELETE = route<{ id: string }>({}, async ({ user, params }) => {
  await db.delete(schema.memories).where(and(eq(schema.memories.id, params.id), eq(schema.memories.userId, user.id)));
  return { ok: true };
});
