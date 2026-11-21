import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
/** Only reviewed content is exposed, with its source, scope and reviewer. */
export const GET = route({ auth: false }, async () => {
  const rows = await db.select().from(schema.contentItems).where(eq(schema.contentItems.status, "approved"));
  return { items: rows.map((c) => ({ slug: c.slug, type: c.type, title: c.title, bodyMd: c.bodyMd, topics: c.topics, source: c.source, audience: c.audience, limits: c.limits, reviewer: c.reviewer, reviewedAt: c.reviewedAt })) };
});
