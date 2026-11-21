import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { decSafe } from "@/lib/crypto";
import { getProvider } from "@/ai/provider";
import { assess } from "@/safety/classifier";
import { gate, SAFE_FALLBACK } from "@/safety/postgate";

/** Neutral common-ground summary built ONLY from statements each person chose to share. The AI does not judge and does not impersonate anyone. */
export const GET = route<{ id: string }>({ limit: { key: "bridge", max: 10, windowSec: 3600 } }, async ({ user, params }) => {
  const [me] = await db.select().from(schema.familyParticipants).where(and(eq(schema.familyParticipants.sessionId, params.id), eq(schema.familyParticipants.userId, user.id)));
  if (!me) throw new HttpError(404, "Not found");
  const shared = await db.select().from(schema.familyParticipants).where(and(eq(schema.familyParticipants.sessionId, params.id), isNotNull(schema.familyParticipants.sharedAt)));
  if (shared.length < 2) throw new HttpError(409, "Everyone needs to share their view before a summary can be made");
  const texts = shared.map((p, i) => ({ who: `Person ${i + 1}`, t: decSafe(p.userId, p.sharedStatementEnc) ?? "" }));
  const a = await assess(texts.map((x) => x.t).join("\n"));
  if (a.flags.includes("abuse_or_coercion") || a.level >= 2) throw new HttpError(409, "This conversation touches on safety. A shared summary isn't the right tool here. Please reach out to a counsellor or the Care tab for support.");
  const system = "You help two or more family members understand each other. Using ONLY the statements below, write a short, neutral summary: what each person says matters to them, where they seem to agree, where they differ, and two small things each person could try. Do not take sides, do not judge, do not guess what people think beyond what they wrote, do not impersonate anyone. Plain text, under 220 words.";
  let text = await getProvider().complete({ system, messages: [{ role: "user", content: texts.map((x) => `${x.who}: ${x.t}`).join("\n\n") }], maxTokens: 600 });
  if (!gate(text).ok) text = SAFE_FALLBACK.en;
  return { summary: text };
});
