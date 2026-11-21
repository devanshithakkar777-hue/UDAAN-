import { z } from "zod";
import { and, arrayContains, desc, eq, ilike } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { text } from "@/lib/schemas";

/** Only verified professionals are listed, with their actual credential type and scope displayed. UDAAN does not endorse unverified centres. */
export const GET = route({}, async ({ req }) => {
  const u = new URL(req.url);
  const conds = [eq(schema.professionals.status, "verified")];
  const city = u.searchParams.get("city"), lang = u.searchParams.get("language"), spec = u.searchParams.get("specialty"), mode = u.searchParams.get("mode"), type = u.searchParams.get("type");
  if (city) conds.push(ilike(schema.professionals.city, city));
  if (lang) conds.push(arrayContains(schema.professionals.languages, [lang]));
  if (spec) conds.push(arrayContains(schema.professionals.specialties, [spec]));
  if (mode) conds.push(arrayContains(schema.professionals.modes, [mode]));
  if (type) conds.push(eq(schema.professionals.credentialType, type));
  const rows = await db.select().from(schema.professionals).where(and(...conds)).orderBy(desc(schema.professionals.verifiedAt)).limit(100);
  return { items: rows.map((p) => ({ id: p.id, name: p.name, credentialType: p.credentialType, registrationBody: p.registrationBody, qualifications: p.qualifications, languages: p.languages, modes: p.modes, city: p.city, specialties: p.specialties, feeInr: p.feeInr, bio: p.bio, contactUrl: p.contactUrl, verifiedAt: p.verifiedAt })) };
});

const Apply = z.object({
  name: text(100), credentialType: z.enum(["counsellor", "clinical_psychologist", "psychiatrist", "other"]),
  registrationBody: text(120), registrationNo: text(60), qualifications: text(400),
  languages: z.array(z.string().max(20)).max(8), modes: z.array(z.enum(["online", "in_person", "group", "family"])).max(4),
  city: z.string().max(60).optional(), specialties: z.array(z.string().max(40)).max(10), feeInr: z.number().int().min(0).max(100000).optional(), bio: z.string().max(1500).optional(), contactUrl: z.string().url().max(300).optional(),
});
export const POST = route({ limit: { key: "pro-apply", max: 3, windowSec: 86400 } }, async ({ req, user }) => {
  const b = await body(req, Apply);
  const [p] = await db.insert(schema.professionals).values({ ...b, userId: user.id, status: "pending" }).returning({ id: schema.professionals.id });
  return { id: p.id, status: "pending" };
});
