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

export function getProvider(): AiProvider {
  if (env.aiProvider === "anthropic") return anthropicProvider;
  // Lazy import keeps the mock out of production bundles' hot path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("./mock") as typeof import("./mock")).mockProvider;
}
