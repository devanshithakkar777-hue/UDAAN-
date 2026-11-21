import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { route } from "@/lib/http";
export const GET = route({ auth: ["admin"] }, async () => ({ items: await db.select().from(schema.professionals).orderBy(desc(schema.professionals.createdAt)).limit(200) }));
