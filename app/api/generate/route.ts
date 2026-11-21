import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { getProvider } from "@/ai/provider";
import { gate, SAFE_FALLBACK } from "@/safety/postgate";
import { assess } from "@/safety/classifier";
import { imminentResponse } from "@/safety/crisis";
import type { Lang } from "@/ai/persona";

const PROMPTS: Record<string, string> = {
  sleep_story: "Write a slow, soothing sleep story of about 350 words. Gentle imagery, no conflict, no cliffhangers, no mention of problems. Short sentences and softly repeating rhythms. End by drifting into rest. Plain text only.",
  visualisation: "Write a calming guided visualisation of about 300 words in second person. Begin with a slow breath cue. Use a safe, peaceful place the person chooses. Sensory and gentle. End by returning to the room slowly. Plain text only.",
  daily_reflection: "Write ONE reflective question for today (under 25 words) tied to the person's stated goals or values if given, otherwise to something small and kind. No streaks, no pressure, no generic affirmation. Then one short sentence of invitation. Plain text only.",
};
const Body = z.object({ kind: z.enum(["sleep_story", "visualisation", "daily_reflection"]), theme: z.string().max(200).optional() });

export const POST = route({ limit: { key: "generate", max: 20, windowSec: 3600 } }, async ({ req, user }) => {
  const b = await body(req, Body);
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const lang = (p?.language ?? "en") as Lang;
  if (b.theme) {
    const a = await assess(b.theme);
    if (a.level >= 2) return { text: imminentResponse(a, lang), crisis: true };
  }
  const langNote = lang === "en" ? "Write in English." : `Write in ${lang === "hi" ? "Hindi" : lang === "mr" ? "Marathi" : "Gujarati"}.`;
  let text = await getProvider().complete({ system: `${PROMPTS[b.kind]} ${langNote} Never include methods of self-harm, medical advice or promises.`, messages: [{ role: "user", content: b.theme ? `Theme or place: ${b.theme}` : "Choose a gentle theme." }], maxTokens: 900 });
  if (!gate(text).ok) text = SAFE_FALLBACK[lang];
  return { text, crisis: false };
});
