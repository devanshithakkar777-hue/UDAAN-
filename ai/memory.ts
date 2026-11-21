import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decSafe, encrypt } from "@/lib/crypto";
import { getProvider } from "./provider";
import { assessByRules } from "@/safety/rules";

const STOP = new Set("the a an and or but of to in on at for with is are was were be been it this that i you he she they we my your his her their our me us them not no do does did have has had so if as by from about just very really".split(" "));
const tokens = (s: string) => s.toLowerCase().normalize("NFKC").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w));

/** Memory content is encrypted at rest, so ranking happens in-process over the user's own (small) active set. */
export async function relevantMemories(userId: string, query: string, limit = 6, allowSensitive = false): Promise<string[]> {
  const rows = await db.select().from(schema.memories)
    .where(and(eq(schema.memories.userId, userId), eq(schema.memories.status, "active")))
    .orderBy(desc(schema.memories.createdAt)).limit(300);
  const q = new Set(tokens(query));
  const scored = rows
    .filter((r) => allowSensitive || !r.sensitive)
    .map((r) => {
      const text = decSafe(userId, r.contentEnc) ?? "";
      const overlap = tokens(text).filter((t) => q.has(t)).length;
      return { id: r.id, text, score: (r.pinned ? 100 : 0) + overlap * 3 + (r.kind === "value" || r.kind === "goal" ? 0.5 : 0) };
    })
    .filter((r) => r.text && (r.score >= 3 || r.score >= 100))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  if (scored.length) {
    void db.update(schema.memories).set({ lastUsedAt: new Date() }).where(and(eq(schema.memories.userId, userId))).catch(() => {});
  }
  return scored.map((s) => s.text);
}

const EXTRACT_SYSTEM = `From the person's message, extract at most 2 durable facts worth remembering to support them later (people in their life, goals, recurring triggers, what helps them, values, upcoming events). Only things they stated. No inferences, no diagnoses, no speculation about their mental state. Output ONLY JSON: {"items":[{"kind":"fact|person|trigger|goal|coping|value|event|preference","text":"short third-person statement","sensitive":true|false}]}. sensitive=true for health, mental health, sexuality, religion, finances, family conflict details. If nothing durable, {"items":[]}.`;

/** Proposes memories as "proposed"; the person approves or dismisses them. Nothing is saved silently. */
export async function proposeMemories(userId: string, message: string, enabled: boolean, allowSensitive: boolean) {
  if (!enabled || message.length < 25) return;
  if (assessByRules(message).level >= 2) return; // never mine crisis messages
  try {
    const out = await getProvider().complete({ system: EXTRACT_SYSTEM, model: "fast", maxTokens: 300, json: true, messages: [{ role: "user", content: message.slice(0, 1500) }] });
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) return;
    const items = (JSON.parse(m[0]).items ?? []) as { kind: string; text: string; sensitive?: boolean }[];
    for (const it of items.slice(0, 2)) {
      if (!it.text || it.text.length > 240) continue;
      if (it.sensitive && !allowSensitive) continue;
      await db.insert(schema.memories).values({
        userId, kind: ["fact", "person", "trigger", "goal", "coping", "value", "event", "preference"].includes(it.kind) ? it.kind : "fact",
        contentEnc: encrypt(userId, it.text), sensitive: !!it.sensitive, status: "proposed", source: "companion",
      });
    }
  } catch { /* best effort */ }
}
