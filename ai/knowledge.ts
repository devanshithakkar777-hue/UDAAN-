import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface KnowledgeHit { slug: string; title: string; type: string; body: string; source: string; limits: string | null }

/** Retrieval over clinician-approved content only. Uses Postgres full-text search; content is public so it is not encrypted. */
export async function knowledgeFor(query: string, limit = 2): Promise<KnowledgeHit[]> {
  const q = query.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().slice(0, 300);
  if (q.length < 8) return [];
  try {
    const rows = await db.execute(sql`
      SELECT slug, title, type, body_md AS body, source, limits,
             ts_rank(to_tsvector('english', title || ' ' || body_md || ' ' || array_to_string(topics, ' ')), websearch_to_tsquery('english', ${q})) AS rank
      FROM content_items
      WHERE status = 'approved'
        AND to_tsvector('english', title || ' ' || body_md || ' ' || array_to_string(topics, ' ')) @@ websearch_to_tsquery('english', ${q})
      ORDER BY rank DESC LIMIT ${limit}`);
    return (rows as unknown as (KnowledgeHit & { rank: number })[]).filter((r) => r.rank > 0.01);
  } catch { return []; }
}

export function knowledgeBlock(hits: KnowledgeHit[]): string {
  if (!hits.length) return "";
  return `REVIEWED KNOWLEDGE (clinician-approved). For questions about mental health topics, base facts ONLY on this and your general kind support; do not present other facts as clinical advice. If it does not cover the question, say you are not sure and suggest a professional. Never go beyond the stated limits.\n${hits.map((h) => `[${h.title} — source: ${h.source}${h.limits ? `; limits: ${h.limits}` : ""}]\n${h.body.slice(0, 1500)}`).join("\n\n")}`;
}

/** Heuristic: is this a health-information question (as opposed to personal support)? */
export const looksLikeHealthQuestion = (t: string) =>
  /\b(what\s*(is|are)|how\s*(do|does|can|to)|is\s*it\s*normal|symptoms?\s*of|causes?\s*of|difference\s*between|does\s*\w+\s*(help|work)|side\s*effects?)\b.{0,80}\b(depress\w*|anxi\w*|panic|adhd|ocd|ptsd|bipolar|therapy|therapist|medication|antidepress\w*|insomnia|burnout|grief|trauma|mental\s*health|cbt|meditation)/i.test(t);
