"use client";

export class ApiError extends Error { constructor(public status: number, message: string, public data?: Record<string, unknown>) { super(message); } }

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(path, { method: opts.method ?? (opts.body ? "POST" : "GET"), headers: opts.body ? { "Content-Type": "application/json" } : undefined, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, (j as { error?: string }).error ?? "Something went wrong", j);
  return j as T;
}

export type SseEvent = { type: string; [k: string]: unknown };
export async function* chatStream(body: unknown, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal, credentials: "same-origin" });
  if (!r.ok || !r.body) { const j = await r.json().catch(() => ({})); throw new ApiError(r.status, (j as { error?: string }).error ?? "Couldn't reach UDAAN", j); }
  const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
      if (chunk.startsWith("data: ")) { try { yield JSON.parse(chunk.slice(6)); } catch { /* ignore */ } }
    }
  }
}

export const today = () => new Date().toISOString().slice(0, 10);
