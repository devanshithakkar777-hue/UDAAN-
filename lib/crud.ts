/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, type ZodType } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { route, body } from "./http";
import { decSafe, encrypt } from "./crypto";
import { HttpError } from "./auth";

export interface Field { key: string; col: string; schema: ZodType<any>; enc?: boolean; optional?: boolean }
export interface CrudCfg {
  table: any; fields: Field[]; orderCol?: string; sinceCol?: string; limit?: number;
  /** Extra non-user-supplied values on insert. */
  rateKey: string;
  /** Allow list filter by a plain column via ?key=value */
  filterKey?: string;
}

const shape = (fields: Field[]) =>
  z.object(Object.fromEntries(fields.map((f) => [f.key, f.optional ? f.schema.optional().nullable() : f.schema])) as any);

function out(userId: string, row: any, fields: Field[]) {
  const o: Record<string, unknown> = { id: row.id, createdAt: row.createdAt ?? row.at ?? null };
  for (const f of fields) o[f.key] = f.enc ? decSafe(userId, row[f.col]) : row[f.col];
  return o;
}

function toRow(userId: string, data: any, fields: Field[]) {
  const r: Record<string, unknown> = {};
  for (const f of fields) {
    if (!(f.key in data)) continue;
    const v = data[f.key];
    r[f.col] = f.enc ? (v == null || v === "" ? null : encrypt(userId, String(v))) : v ?? null;
  }
  return r;
}

export function listCreate(cfg: CrudCfg) {
  const T = cfg.table;
  const Body = shape(cfg.fields);
  const GET = route({}, async ({ req, user }) => {
    const url = new URL(req.url);
    const conds: any[] = [eq(T.userId, user.id)];
    const days = Number(url.searchParams.get("days") ?? 0);
    if (days > 0 && cfg.sinceCol) conds.push(gte(T[cfg.sinceCol], new Date(Date.now() - days * 864e5)));
    if (cfg.filterKey && url.searchParams.get(cfg.filterKey)) conds.push(eq(T[cfg.filterKey], url.searchParams.get(cfg.filterKey)));
    const rows = await db.select().from(T).where(and(...conds)).orderBy(desc(T[cfg.orderCol ?? "createdAt"])).limit(cfg.limit ?? 500);
    return { items: rows.map((r: any) => out(user.id, r, cfg.fields)) };
  });
  const POST = route({ limit: { key: cfg.rateKey, max: 120, windowSec: 3600 } }, async ({ req, user }) => {
    const data = await body(req, Body as any);
    const [r] = await db.insert(T).values({ userId: user.id, ...toRow(user.id, data, cfg.fields) }).returning();
    return { item: out(user.id, r, cfg.fields) };
  });
  return { GET, POST };
}

export function patchDelete(cfg: CrudCfg) {
  const T = cfg.table;
  const Patch = (shape(cfg.fields) as any).partial();
  const PATCH = route<{ id: string }>({}, async ({ req, user, params }) => {
    const data = await body(req, Patch as any);
    const r = toRow(user.id, data, cfg.fields);
    if (!Object.keys(r).length) return { ok: true };
    const res = await db.update(T).set(r).where(and(eq(T.id, params.id), eq(T.userId, user.id))).returning();
    if (!res.length) throw new HttpError(404, "Not found");
    return { item: out(user.id, res[0], cfg.fields) };
  });
  const DELETE = route<{ id: string }>({}, async ({ user, params }) => {
    await db.delete(T).where(and(eq(T.id, params.id), eq(T.userId, user.id)));
    return { ok: true };
  });
  return { PATCH, DELETE };
}
