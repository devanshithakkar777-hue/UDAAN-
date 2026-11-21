import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { encOpt } from "@/lib/crypto";

export const PATCH = route<{ id: string }>({}, async ({ req, user, params }) => {
  const b = await body(req, z.object({ done: z.boolean(), note: z.string().max(1500).optional() }));
  await db.update(schema.assignedExercises).set({ doneAt: b.done ? new Date() : null, userNoteEnc: encOpt(user.id, b.note) }).where(and(eq(schema.assignedExercises.id, params.id), eq(schema.assignedExercises.userId, user.id)));
  return { ok: true };
});
