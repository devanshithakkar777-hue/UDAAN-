import { z } from "zod";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";

const Item = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80), type: z.enum(["general_education", "self_help", "professional_guidance", "emergency_protocol"]),
  title: z.string().min(1).max(200), bodyMd: z.string().min(1).max(20000), topics: z.array(z.string().max(40)).max(12),
  source: z.string().min(1).max(300), audience: z.string().max(100).optional(), limits: z.string().max(500).optional(), reviewer: z.string().max(120).optional(),
});
export const GET = route({ auth: ["admin"] }, async () => ({ items: await db.select().from(schema.contentItems).orderBy(desc(schema.contentItems.createdAt)) }));
export const POST = route({ auth: ["admin"] }, async ({ req }) => {
  const b = await body(req, Item);
  const [c] = await db.insert(schema.contentItems).values({ ...b, status: "draft" }).onConflictDoUpdate({ target: schema.contentItems.slug, set: { ...b, status: "draft", reviewedAt: null } }).returning({ id: schema.contentItems.id });
  return { id: c.id };
});
