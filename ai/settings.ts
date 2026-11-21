import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

let cache: { at: number; map: Map<string, string> } | null = null;

export async function getAiSetting(key: string): Promise<string | undefined> {
  if (!cache || Date.now() - cache.at > 30_000) {
    try {
      const rows = await db.select().from(schema.aiSettings);
      cache = { at: Date.now(), map: new Map(rows.map((r) => [r.key, r.value])) };
    } catch { return undefined; }
  }
  return cache.map.get(key);
}

export async function setAiSetting(key: string, value: string, by: string) {
  await db.insert(schema.aiSettings).values({ key, value, updatedBy: by })
    .onConflictDoUpdate({ target: schema.aiSettings.key, set: { value, updatedBy: by, updatedAt: new Date() } });
  cache = null;
}
export const ALLOWED_SETTINGS = ["main_model", "classifier_model", "persona_note"] as const;
