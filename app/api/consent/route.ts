import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";

import { CONSENT_VERSION } from "@/lib/plan";
const Body = z.object({
  accepted: z.literal(true),
  training: z.boolean().default(false),
  research: z.boolean().default(false),
});

export const POST = route({}, async ({ req, user }) => {
  const b = await body(req, Body);
  const now = new Date();
  await db.update(schema.profiles).set({ consentVersion: CONSENT_VERSION, consentedAt: now, trainingConsent: b.training, researchConsent: b.research, updatedAt: now }).where(eq(schema.profiles.userId, user.id));
  await db.insert(schema.consents).values([
    { userId: user.id, kind: "terms_privacy", granted: true, version: CONSENT_VERSION },
    { userId: user.id, kind: "training", granted: b.training, version: CONSENT_VERSION },
    { userId: user.id, kind: "research", granted: b.research, version: CONSENT_VERSION },
  ]);
  return { ok: true, version: CONSENT_VERSION };
});
