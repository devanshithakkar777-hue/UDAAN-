import { db, schema } from "@/db";

/** Audit entries record that something happened, never message content. */
export async function audit(userId: string | null, action: string, ipHash?: string | null, meta: Record<string, unknown> = {}) {
  try {
    await db.insert(schema.auditLogs).values({ userId, action, ipHash: ipHash ?? null, meta });
  } catch (e) {
    console.error("audit failed", action, e instanceof Error ? e.message : e);
  }
}
