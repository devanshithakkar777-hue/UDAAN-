import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { decSafe } from "@/lib/crypto";

export const GET = route({}, async ({ user }) => {
  const rows = await db.select({ e: schema.assignedExercises, pro: schema.professionals.name }).from(schema.assignedExercises).innerJoin(schema.professionals, eq(schema.professionals.id, schema.assignedExercises.professionalId)).where(eq(schema.assignedExercises.userId, user.id)).orderBy(desc(schema.assignedExercises.createdAt));
  return { items: rows.map(({ e, pro }) => ({ id: e.id, from: pro, title: decSafe(user.id, e.titleEnc), description: decSafe(user.id, e.descriptionEnc), dueAt: e.dueAt, doneAt: e.doneAt, note: decSafe(user.id, e.userNoteEnc) })) };
});
