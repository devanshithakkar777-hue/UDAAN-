import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
import { getUser } from "@/lib/auth";

export const GET = route({ auth: false }, async () => {
  const u = await getUser();
  if (!u) return { user: null };
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id));
  return {
    user: { id: u.id, email: u.email, role: u.role, displayName: u.displayName },
    profile: p ? { ...p, userId: undefined } : null,
  };
});
