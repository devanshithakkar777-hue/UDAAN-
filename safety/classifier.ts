import { getProvider } from "@/ai/provider";
import { assessByRules, mergeAssessments } from "./rules";
import type { Assessment, Flag, RiskLevel } from "./types";

const CLASSIFIER_SYSTEM = `You are a safety classifier for a mental wellness app used mainly in India. Messages may be English, Hindi, Hinglish, Marathi or Gujarati.
Read the person's latest message in the context of the recent conversation. Output ONLY JSON: {"level":1|2|3,"flags":[...],"signals":[short codes]}.
level 3 = imminent: a plan, means, a timeframe, intent to act, or self-harm/overdose already in progress.
level 2 = elevated: suicidal thoughts, wanting to die, self-harm urges or recent self-harm, feeling like a burden, deep hopelessness, intent to harm others.
level 1 = everything else, including ordinary sadness, stress, anger, and figures of speech ("this exam is killing me").
flags may include: self_harm, suicide_ideation, suicide_plan, hopeless, harm_others, abuse_or_coercion, substance, eating_disorder, minor_signal, medical_emergency.
Use abuse_or_coercion when someone describes being hit, threatened, controlled, confined, or forced (including forced marriage). Never treat that as an overreaction.
Be sensitive to indirect expressions such as giving away belongings, saying goodbye, "I won't be a problem much longer". When unsure between two levels, choose the higher.`;

function parse(text: string): Assessment | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const j = JSON.parse(m[0]) as { level?: number; flags?: string[]; signals?: string[] };
    const level = ([1, 2, 3].includes(Number(j.level)) ? Number(j.level) : 1) as RiskLevel;
    return { level, flags: (j.flags ?? []) as Flag[], source: "llm", signals: (j.signals ?? []).slice(0, 6).map(String) };
  } catch { return null; }
}

/**
 * Rules always run (instant, free, cannot fail). The model adds nuance when the message is not obviously benign.
 * If the model call fails, the rules result stands: the gate never fails open past what the rules caught.
 */
export async function assess(message: string, recent: string[] = []): Promise<Assessment> {
  const rules = assessByRules(message);
  if (rules.level === 3) return rules; // no need to wait for a model
  const trivial = message.trim().length < 12 && rules.level === 1 && rules.flags.length === 0;
  if (trivial) return rules;
  try {
    const ctx = recent.slice(-4).map((m) => `- ${m.slice(0, 300)}`).join("\n");
    const out = await Promise.race([
      getProvider().complete({ system: CLASSIFIER_SYSTEM, model: "fast", maxTokens: 150, json: true, messages: [{ role: "user", content: `Recent messages from the person:\n${ctx || "(none)"}\n\nLatest message:\n${message.slice(0, 1500)}` }] }),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error("classifier timeout")), 6000)),
    ]);
    return mergeAssessments(rules, parse(out));
  } catch {
    return rules;
  }
}

/** Trajectory: repeated level-2 signals across a conversation raise the floor even if the latest message is quiet. */
export function applyTrajectory(a: Assessment, priorMaxRisk: number, recentLevels: number[]): Assessment {
  const twos = recentLevels.filter((l) => l >= 2).length;
  if (a.level === 1 && twos >= 2) return { ...a, level: 2, signals: [...a.signals, "trajectory"] };
  if (a.level === 1 && priorMaxRisk >= 2 && recentLevels.slice(-2).some((l) => l >= 2)) return { ...a, level: 2, signals: [...a.signals, "recent_elevated"] };
  return a;
}
