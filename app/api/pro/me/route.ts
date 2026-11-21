import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
export const GET = route({}, async ({ user }) => {
  const [p] = await db.select().from(schema.professionals).where(eq(schema.professionals.userId, user.id));
  return { professional: p ?? null };
});
