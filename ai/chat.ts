import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { decSafe, encrypt } from "@/lib/crypto";
import { HttpError } from "@/lib/auth";
import { getProvider, type ChatMsg } from "./provider";
import { buildSystem, detectLowState, type Lang, type Style, type Tone } from "./persona";
import { relevantMemories, proposeMemories } from "./memory";
import { getAiSetting } from "./settings";
import { knowledgeBlock, knowledgeFor, looksLikeHealthQuestion } from "./knowledge";
import { applyTrajectory, assess } from "@/safety/classifier";
import { appendResources, imminentResponse } from "@/safety/crisis";
import { gate, REGEN_NOTE, SAFE_FALLBACK } from "@/safety/postgate";
import type { Assessment } from "@/safety/types";
import { audit } from "@/lib/audit";

export type ChatEvent =
  | { type: "meta"; conversationId: string; level: number; flags: string[] }
  | { type: "delta"; text: string }
  | { type: "replace"; text: string }
  | { type: "final"; text: string; messageId: string; crisis: boolean }
  | { type: "error"; message: string };

export interface TurnInput {
  userId: string;
  displayName?: string | null;
  text: string;
  conversationId?: string;
  mode?: string;
  moduleName?: string;
  moduleInstructions?: string;
  styleOverride?: Style;
  signal?: AbortSignal;
}

const HISTORY_LIMIT = 24;

async function loadProfile(userId: string) {
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  return p;
}

export async function getOrCreateConversation(userId: string, id: string | undefined, mode: string) {
  if (id) {
    const [c] = await db.select().from(schema.conversations).where(and(eq(schema.conversations.id, id), eq(schema.conversations.userId, userId)));
    if (!c) throw new HttpError(404, "Conversation not found");
    return c;
  }
  const [c] = await db.insert(schema.conversations).values({ userId, mode }).returning();
  return c;
}

async function history(userId: string, conversationId: string): Promise<{ msgs: ChatMsg[]; levels: number[] }> {
  const rows = await db.select().from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(desc(schema.messages.createdAt)).limit(HISTORY_LIMIT);
  rows.reverse();
  const msgs: ChatMsg[] = [];
  for (const r of rows) {
    if (r.role === "event") continue;
    const t = decSafe(userId, r.contentEnc);
    if (t) msgs.push({ role: r.role as "user" | "assistant", content: t });
  }
  return { msgs, levels: rows.filter((r) => r.role === "user").map((r) => r.safetyLevel) };
}

async function logSafety(userId: string, conversationId: string, a: Assessment, stage: "pre" | "post" | "trajectory", action: string) {
  const [ev] = await db.insert(schema.safetyEvents).values({ userId, conversationId, level: a.level, signals: a.signals.slice(0, 8), stage, action }).returning({ id: schema.safetyEvents.id });
  if (a.level >= 3 && ev) await db.insert(schema.incidents).values({ safetyEventId: ev.id });
}

/** Collects a full model reply (used when it must be gated before the person sees any of it). */
async function collect(gen: AsyncGenerator<string>) { let s = ""; for await (const p of gen) s += p; return s; }

export async function* runTurn(inp: TurnInput): AsyncGenerator<ChatEvent> {
  const profile = await loadProfile(inp.userId);
  const lang = (profile?.language ?? "en") as Lang;
  const conv = await getOrCreateConversation(inp.userId, inp.conversationId, inp.mode ?? "talk");
  const { msgs: prior, levels } = await history(inp.userId, conv.id);

  // 1 ── Pre-generation gate
  let a = await assess(inp.text, prior.filter((m) => m.role === "user").map((m) => m.content));
  const before = a.level;
  a = applyTrajectory(a, conv.maxRisk, levels);
  if (a.level > before) await logSafety(inp.userId, conv.id, a, "trajectory", "raised_by_trajectory");

  const userMsgId = (await db.insert(schema.messages).values({
    conversationId: conv.id, userId: inp.userId, role: "user", contentEnc: encrypt(inp.userId, inp.text), safetyLevel: a.level,
  }).returning({ id: schema.messages.id }))[0].id;
  void userMsgId;

  if (conv.titleEnc == null) {
    await db.update(schema.conversations).set({ titleEnc: encrypt(inp.userId, inp.text.slice(0, 60)) }).where(eq(schema.conversations.id, conv.id));
  }
  if (a.level > conv.maxRisk) await db.update(schema.conversations).set({ maxRisk: a.level }).where(eq(schema.conversations.id, conv.id));
  if (a.level >= 2 || a.flags.some((f) => ["abuse_or_coercion", "harm_others", "medical_emergency"].includes(f))) {
    await logSafety(inp.userId, conv.id, a, "pre", a.level >= 3 ? "static_crisis_response" : a.level === 2 ? "crisis_mode_prompt" : "flag_only");
  }

  yield { type: "meta", conversationId: conv.id, level: a.level, flags: a.flags };

  const save = async (text: string, level: number) => {
    const [m] = await db.insert(schema.messages).values({ conversationId: conv.id, userId: inp.userId, role: "assistant", contentEnc: encrypt(inp.userId, text), safetyLevel: level }).returning({ id: schema.messages.id });
    await db.update(schema.conversations).set({ updatedAt: new Date() }).where(eq(schema.conversations.id, conv.id));
    return m.id;
  };

  // 2 ── Imminent: fully static, no model
  if (a.level === 3) {
    const text = imminentResponse(a, lang);
    const id = await save(text, 3);
    yield { type: "final", text, messageId: id, crisis: true };
    return;
  }

  const provider = getProvider();
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [{ n }] = await db.select({ n: sql<number>`count(distinct date_trunc('hour', ${schema.messages.createdAt}))::int` }).from(schema.messages)
    .where(and(eq(schema.messages.userId, inp.userId), eq(schema.messages.role, "user"), gte(schema.messages.createdAt, weekAgo)));
  const memories = a.level >= 2 || !profile?.memoryEnabled ? [] : await relevantMemories(inp.userId, inp.text, 6, !!profile?.sensitiveMemoryEnabled);

  const system = buildSystem({
    style: inp.styleOverride ?? ((profile?.style ?? "guide") as Style),
    tone: (profile?.tone ?? "balanced") as Tone,
    language: lang,
    displayName: inp.displayName,
    stage: profile?.stage,
    askListenOrHelp: profile?.askListenOrHelp ?? true,
    memories,
    moduleInstructions: inp.moduleInstructions,
    moduleName: inp.moduleName,
    assessment: a,
    lowState: detectLowState(inp.text),
    turnCount: prior.filter((m) => m.role === "user").length + 1,
    sessionsThisWeek: n,
    extraNote: await getAiSetting("persona_note"),
    knowledge: looksLikeHealthQuestion(inp.text) ? knowledgeBlock(await knowledgeFor(inp.text)) : undefined,
  });
  const messages: ChatMsg[] = [...prior, { role: "user", content: inp.text }];
  const maxTokens = a.level >= 2 ? 400 : 1000;

  try {
    // 3 ── Elevated: buffer, gate, always append resources in code
    if (a.level === 2) {
      let text = await collect(provider.stream({ system, messages, maxTokens }, inp.signal));
      let g = gate(text);
      if (!g.ok) {
        await logSafety(inp.userId, conv.id, a, "post", `blocked:${g.reasons.join(",")}`);
        text = await collect(provider.stream({ system: `${system}\n\n${REGEN_NOTE(g.reasons)}`, messages, maxTokens }, inp.signal));
        g = gate(text);
        if (!g.ok) text = SAFE_FALLBACK[lang];
      }
      text = appendResources(text, a, lang);
      const id = await save(text, 2);
      yield { type: "final", text, messageId: id, crisis: true };
      return;
    }

    // 4 ── Ordinary: stream live, gate at the end, replace if needed
    let text = "";
    for await (const part of provider.stream({ system, messages, maxTokens }, inp.signal)) {
      text += part;
      yield { type: "delta", text: part };
    }
    let g = gate(text);
    if (!g.ok) {
      await logSafety(inp.userId, conv.id, a, "post", `blocked:${g.reasons.join(",")}`);
      const retry = await collect(provider.stream({ system: `${system}\n\n${REGEN_NOTE(g.reasons)}`, messages, maxTokens }, inp.signal));
      g = gate(retry);
      text = g.ok ? retry : SAFE_FALLBACK[lang];
      yield { type: "replace", text };
    }
    if (!text.trim()) { text = SAFE_FALLBACK[lang]; yield { type: "replace", text }; }
    // Abuse/coercion or a medical emergency: resources are appended in code, never left to the model's judgement.
    const needsResources = a.flags.some((f) => f === "abuse_or_coercion" || f === "medical_emergency");
    if (needsResources) {
      const full = appendResources(text, a, lang);
      yield { type: "delta", text: full.slice(text.length) };
      text = full;
    }
    const id = await save(text, a.level || 1);
    yield { type: "final", text, messageId: id, crisis: needsResources };
    void proposeMemories(inp.userId, inp.text, !!profile?.memoryEnabled, !!profile?.sensitiveMemoryEnabled);
  } catch (e) {
    if (inp.signal?.aborted) return;
    console.error("chat turn failed", e instanceof Error ? e.message : e);
    await audit(inp.userId, "chat.error", null, { message: e instanceof Error ? e.message.slice(0, 200) : "unknown" });
    // Even when the model is unavailable, a person at elevated risk must still get resources.
    if (a.level >= 2) {
      const text = imminentResponse(a, lang);
      const id = await save(text, a.level);
      yield { type: "final", text, messageId: id, crisis: true };
    } else {
      yield { type: "error", message: "I couldn't reach my thinking just now. Your message is saved. Please try again in a moment." };
    }
  }
}

export { asc };
