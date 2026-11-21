import { getProvider } from "@/ai/provider";
import { buildSystem, type Lang } from "@/ai/persona";
import { assess } from "@/safety/classifier";
import { gate, SAFE_FALLBACK } from "@/safety/postgate";
import { appendResources, imminentResponse } from "@/safety/crisis";
import type { ModuleDef } from "./types";

export interface FlowResult { text: string; crisis: boolean; level: number }

/** Runs a flow module's synthesis step. Free-text answers pass through the same safety gate as chat. */
export async function runFlow(m: ModuleDef, answers: Record<string, string>, lang: Lang, style: "guide" | "listener" = "guide"): Promise<FlowResult> {
  const allText = Object.values(answers).join("\n");
  // The mood-check starter may legitimately contain "better off dead" as a menu answer; classify only free text for those.
  const freeText = m.id === "phq9_starter" ? "" : allText;
  const a = freeText ? await assess(freeText) : { level: 1 as const, flags: [], source: "rules" as const, signals: [] };
  const q9 = m.id === "phq9_starter" && answers.q9 && answers.q9 !== "Not at all";
  if (a.level === 3) return { text: imminentResponse(a, lang), crisis: true, level: 3 };

  const steps = m.steps ?? [];
  const body = steps.map((s) => `Q: ${s.prompt}\nA: ${answers[s.id] ?? "(skipped)"}`).join("\n\n");
  const system = `${buildSystem({ style, tone: "balanced", language: lang, askListenOrHelp: false, memories: [], turnCount: 5, assessment: a.level >= 2 ? a : undefined })}\n\nMODULE TASK: ${m.instructions}\nUse only what the person wrote. Plain text, no markdown headings.`;
  let text = await getProvider().complete({ system, messages: [{ role: "user", content: body }], maxTokens: 700 });
  if (!gate(text).ok) text = SAFE_FALLBACK[lang];
  if (a.level >= 2 || q9) {
    const elevated = a.level >= 2 ? a : { level: 2 as const, flags: ["suicide_ideation" as const], source: "rules" as const, signals: ["q9"] };
    return { text: appendResources(text, elevated, lang), crisis: true, level: 2 };
  }
  return { text, crisis: false, level: 1 };
}
