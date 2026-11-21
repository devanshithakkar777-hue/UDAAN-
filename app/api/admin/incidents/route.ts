import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";

/** Content-free: level, signal codes, stage, action. Reviewers do not see conversations. */
export const GET = route({ auth: ["admin"] }, async () => {
  const rows = await db.select({ i: schema.incidents, e: schema.safetyEvents }).from(schema.incidents).leftJoin(schema.safetyEvents, eq(schema.safetyEvents.id, schema.incidents.safetyEventId)).orderBy(desc(schema.incidents.createdAt)).limit(200);
  return { items: rows.map(({ i, e }) => ({ id: i.id, status: i.status, notes: i.notes, createdAt: i.createdAt, level: e?.level, signals: e?.signals, stage: e?.stage, action: e?.action })) };
});
