import type { AiProvider, GenOpts } from "./provider";
import { assessByRules } from "@/safety/rules";

/** Development and test provider. It exercises the full pipeline without an API key. It is not a substitute for the real model. */
function lastUser(o: GenOpts) { return [...o.messages].reverse().find((m) => m.role === "user")?.content ?? ""; }

function reply(o: GenOpts): string {
  if (o.json) {
    const a = assessByRules(lastUser(o));
    return JSON.stringify({ level: a.level, flags: a.flags, signals: ["mock"] });
  }
  const u = lastUser(o);
  if (/\[\[MODULE_JSON\]\]/.test(o.system)) return JSON.stringify({ message: "Here is a gentle next step you can try.", suggestions: ["Take one slow breath", "Write one sentence about it"] });
  const short = u.length > 140 ? u.slice(0, 140) + "…" : u;
  return `That sounds like a lot to carry. I hear that "${short}" is on your mind. Would it help more if I just listened, or if we worked out a small next step together?`;
}

export const mockProvider: AiProvider = {
  name: "mock",
  async *stream(o) {
    const text = reply(o);
    for (const part of text.match(/.{1,24}(\s|$)/g) ?? [text]) { yield part; await new Promise((r) => setTimeout(r, 5)); }
  },
  async complete(o) { return reply(o); },
};
