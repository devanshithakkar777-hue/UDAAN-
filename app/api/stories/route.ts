import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { assess } from "@/safety/classifier";
import { appendResources } from "@/safety/crisis";

/** Anonymous stories are readable, never messageable. Every story is reviewed by a person before publishing. */
export const GET = route({}, async () => {
  const rows = await db.select({ id: schema.stories.id, title: schema.stories.title, body: schema.stories.body, topic: schema.stories.topic, at: schema.stories.createdAt }).from(schema.stories).where(eq(schema.stories.status, "published")).orderBy(desc(schema.stories.createdAt)).limit(100);
  return { items: rows };
});
export const POST = route({ limit: { key: "story", max: 3, windowSec: 86400 } }, async ({ req, user }) => {
  const b = await body(req, z.object({ title: z.string().trim().min(1).max(120), body: z.string().trim().min(50).max(6000), topic: z.string().max(40).optional() }));
  const a = await assess(`${b.title}\n${b.body}`);
  await db.insert(schema.stories).values({ authorId: user.id, title: b.title, body: b.body, topic: b.topic ?? null });
  if (a.level >= 2) return { ok: true, support: appendResources("Thank you for trusting us with your story. A person will read it before it's shared. I also want to make sure you're okay right now.", a) };
  return { ok: true };
});
