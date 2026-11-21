import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { getAiSetting } from "./settings";

export interface ChatMsg { role: "user" | "assistant"; content: string }
export interface GenOpts { system: string; messages: ChatMsg[]; maxTokens?: number; model?: "main" | "fast"; json?: boolean }

export interface AiProvider {
  name: string;
  stream(o: GenOpts, signal?: AbortSignal): AsyncGenerator<string, void, void>;
  complete(o: GenOpts, signal?: AbortSignal): Promise<string>;
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: env.anthropicKey, maxRetries: 2, timeout: 60_000 }));

async function pickModel(kind: "main" | "fast" | undefined) {
  if (kind === "fast") return (await getAiSetting("classifier_model")) ?? env.classifierModel;
  return (await getAiSetting("main_model")) ?? env.model;
}

const anthropicProvider: AiProvider = {
  name: "anthropic",
  async *stream(o, signal) {
    const stream = getClient().messages.stream(
      { model: await pickModel(o.model), max_tokens: o.maxTokens ?? 1200, system: o.system, messages: o.messages },
      { signal },
    );
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
    }
  },
  async complete(o, signal) {
    const r = await getClient().messages.create(
      { model: await pickModel(o.model), max_tokens: o.maxTokens ?? 800, system: o.system, messages: o.messages },
      { signal },
    );
    return r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  },
};

/** Groq (OpenAI-compatible chat completions). No SDK needed. Free tier is rate limited, so 429s are retried once and then surface as an error that the chat layer handles safely. */
async function groqRequest(o: GenOpts, stream: boolean, signal?: AbortSignal): Promise<Response> {
  const model = await pickModel(o.model);
  const reasoning = model.startsWith("openai/gpt-oss");
  const body = {
    model, stream,
    // gpt-oss models reason before answering, and reasoning tokens count against max_tokens. Low effort keeps replies fast, and the caller's cap
    // (sized for the visible answer) gets reasoning headroom on top; otherwise short caps like the classifier's would be spent before any answer.
    max_tokens: (o.maxTokens ?? (stream ? 1200 : 800)) + (reasoning ? 1000 : 0),
    ...(reasoning ? { reasoning_effort: "low" } : {}),
    messages: [{ role: "system", content: o.system }, ...o.messages],
    ...(o.json ? { response_format: { type: "json_object" } } : {}),
  };
  for (let attempt = 0; ; attempt++) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", signal, body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.groqKey}` },
    });
    if (r.status === 429 && attempt === 0) {
      const wait = Math.min(3, Number(r.headers.get("retry-after")) || 1);
      await new Promise((res) => setTimeout(res, wait * 1000));
      continue;
    }
    if (!r.ok) {
      // Provider error bodies describe the failure (bad model, bad key, quota) and never echo user content, so they are safe to log.
      const detail = (await r.text().catch(() => "")).slice(0, 300).replace(/\s+/g, " ");
      throw new Error(`groq ${r.status} model=${body.model} ${detail}`);
    }
    return r;
  }
}

const groqProvider: AiProvider = {
  name: "groq",
  async *stream(o, signal) {
    const r = await groqRequest(o, true, signal);
    const reader = r.body!.getReader(); const dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim(); if (data === "[DONE]") return;
        try { const t = JSON.parse(data).choices?.[0]?.delta?.content; if (t) yield t as string; } catch { /* partial frame */ }
      }
    }
  },
  async complete(o, signal) {
    const r = await groqRequest(o, false, signal);
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return j.choices?.[0]?.message?.content ?? "";
  },
};

export function getProvider(): AiProvider {
  if (env.aiProvider === "anthropic") return anthropicProvider;
  if (env.aiProvider === "groq") return groqProvider;
  // Lazy import keeps the mock out of production bundles' hot path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("./mock") as typeof import("./mock")).mockProvider;
}
