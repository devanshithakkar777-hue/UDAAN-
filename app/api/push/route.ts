import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { env } from "@/lib/env";

const Sub = z.object({ endpoint: z.string().url().max(800), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }) });

export const GET = route({ auth: false }, async () => ({ publicKey: env.vapid.pub || null }));
export const POST = route({}, async ({ req, user }) => {
  const s = await body(req, Sub);
  await db.insert(schema.pushSubscriptions).values({ userId: user.id, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth }).onConflictDoNothing();
  return { ok: true };
});
export const DELETE = route({}, async ({ req, user }) => {
  const { endpoint } = await body(req, z.object({ endpoint: z.string() }));
  await db.delete(schema.pushSubscriptions).where(and(eq(schema.pushSubscriptions.userId, user.id), eq(schema.pushSubscriptions.endpoint, endpoint)));
  return { ok: true };
});
