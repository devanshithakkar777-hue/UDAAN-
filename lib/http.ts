import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { HttpError, requireUser, type SessionUser, clientIp } from "./auth";
import { env } from "./env";
import { hashIp } from "./crypto";
import { rateLimit } from "./ratelimit";

type Ctx<P> = { params: Promise<P> };

export function originOk(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return true;
  const origin = req.headers.get("origin");
  if (!origin) return !env.isProd; // browsers always send Origin on cross-site writes
  try { return new URL(origin).host === new URL(env.appUrl).host || new URL(origin).host === req.headers.get("host"); } catch { return false; }
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: "Invalid input", issues: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  console.error("API error", e);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

export interface RouteOpts { auth?: boolean | string[]; limit?: { key: string; max: number; windowSec: number } }

/** Wraps a route: CSRF origin check, optional auth, optional per-user/IP rate limit, uniform errors. */
export function route<P = Record<string, string>>(
  opts: RouteOpts,
  handler: (a: { req: NextRequest; user: SessionUser; params: P }) => Promise<Response | unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      if (!originOk(req)) throw new HttpError(403, "Cross-site request blocked");
      const user = opts.auth === false ? (null as unknown as SessionUser) : await requireUser(Array.isArray(opts.auth) ? opts.auth : undefined);
      if (opts.limit) {
        const who = user?.id ?? hashIp(await clientIp());
        const r = await rateLimit(`${opts.limit.key}:${who}`, opts.limit.max, opts.limit.windowSec);
        if (!r.ok) throw new HttpError(429, "Too many requests. Please slow down a little.", { retryAfter: r.retryAfter });
      }
      const params = (await ctx.params) as P;
      const out = await handler({ req, user, params });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function body<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw new HttpError(400, "Invalid JSON body"); }
  return schema.parse(raw);
}
