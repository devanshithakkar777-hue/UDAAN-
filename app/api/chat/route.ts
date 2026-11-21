import { NextRequest } from "next/server";
import { z } from "zod";
import { runTurn } from "@/ai/chat";
import { requireUser } from "@/lib/auth";
import { body, errorResponse, originOk } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { HttpError } from "@/lib/auth";
import { availability, getModule } from "@/modules/registry";
import { uuid } from "@/lib/schemas";
import { env } from "@/lib/env";
import { recordGrowth } from "@/lib/growth";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  text: z.string().trim().min(1).max(4000),
  conversationId: uuid.optional(),
  moduleId: z.string().max(60).optional(),
  style: z.enum(["listener", "guide", "coach", "companion", "grounding"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!originOk(req)) throw new HttpError(403, "Cross-site request blocked");
    const user = await requireUser();
    const lim = await rateLimit(`chat:${user.id}`, 40, 600);
    if (!lim.ok) throw new HttpError(429, "You're sending messages quickly. Let's take a breath and try again in a moment.", { retryAfter: lim.retryAfter });
    const day = await rateLimit(`chat-day:${user.id}`, 400, 86400);
    if (!day.ok) throw new HttpError(429, "That's a lot of messages today. Rest a little, and come back tomorrow. Crisis help is always available on the Care tab.");
    const b = await body(req, Body);

    let moduleName: string | undefined, moduleInstructions: string | undefined;
    if (b.moduleId) {
      const m = getModule(b.moduleId);
      const ok = await availability();
      if (!m || !ok(m) || m.kind !== "chat") throw new HttpError(404, "Module not found");
      moduleName = m.title; moduleInstructions = m.instructions;
      if (m.domain && !b.conversationId) void recordGrowth(user.id, m.domain, "explored").catch(() => {});
    }

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (o: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
        try {
          for await (const ev of runTurn({ userId: user.id, displayName: user.displayName, text: b.text, conversationId: b.conversationId, mode: b.moduleId ?? "talk", moduleName, moduleInstructions, styleOverride: b.style, signal: req.signal })) send(ev);
        } catch (e) {
          console.error("stream error", e);
          send({ type: "error", message: "Something went wrong on our side. Please try again." });
        } finally {
          send({ type: "done" });
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no", Connection: "keep-alive" } });
  } catch (e) {
    return errorResponse(e);
  }
}
