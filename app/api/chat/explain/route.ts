import { z } from "zod";
import { and, asc, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { decSafe, encrypt } from "@/lib/crypto";
import { getProvider } from "@/ai/provider";
import { gate } from "@/safety/postgate";
import { uuid } from "@/lib/schemas";

/** "See the reasoning": a plain-words account of what the companion was doing and why, so the person can check it and disagree. */
const SYSTEM = `You are explaining your previous reply to the person, so they can check and challenge it. Be honest and plain, in first person, under 130 words. Cover briefly: (1) what feeling you acknowledged, (2) what you treated as fact versus as interpretation, (3) whether you offered an honest point about their part or a different view, and why, (4) anything you were unsure about or chose not to say. If you offered no honest point, say so. Invite them to tell you if you got it wrong. Do not defend yourself and do not add new advice.`;

export const POST = route({ limit: { key: "explain", max: 30, windowSec: 3600 } }, async ({ req, user }) => {
  const { messageId } = await body(req, z.object({ messageId: uuid }));
  const [m] = await db.select().from(schema.messages).where(and(eq(schema.messages.id, messageId), eq(schema.messages.userId, user.id), eq(schema.messages.role, "assistant")));
  if (!m) throw new HttpError(404, "Not found");
  if (m.reasoningEnc) return { text: decSafe(user.id, m.reasoningEnc) ?? "" };
  if (m.safetyLevel >= 2) return { text: "This reply was written for safety. It put your wellbeing first and pointed to people who can help right now. That is all it was trying to do." };
  const prior = await db.select().from(schema.messages).where(and(eq(schema.messages.conversationId, m.conversationId), lt(schema.messages.createdAt, m.createdAt))).orderBy(asc(schema.messages.createdAt));
  const last = prior.filter((p) => p.role === "user").at(-1);
  const ctx = prior.slice(-6).map((p) => `${p.role === "user" ? "Person" : "You"}: ${decSafe(user.id, p.contentEnc) ?? ""}`).join("\n");
  const reply = decSafe(user.id, m.contentEnc) ?? "";
  let text = await getProvider().complete({ system: SYSTEM, messages: [{ role: "user", content: `Recent conversation:\n${ctx}\n\nThe person's last message:\n${last ? decSafe(user.id, last.contentEnc) : ""}\n\nYour reply that you are explaining:\n${reply}` }], maxTokens: 400 });
  if (!gate(text).ok) text = "I was trying to listen first, then check what was fact and what was feeling before saying anything. If it didn't land right, tell me and I'll try again.";
  await db.update(schema.messages).set({ reasoningEnc: encrypt(user.id, text) }).where(eq(schema.messages.id, m.id));
  return { text };
});
