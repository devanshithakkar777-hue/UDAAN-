import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { HttpError } from "@/lib/auth";
import { availability, getModule } from "@/modules/registry";
import { runFlow } from "@/modules/flow";
import { encrypt } from "@/lib/crypto";
import type { Lang } from "@/ai/persona";
import { recordGrowth } from "@/lib/growth";
import { logFlowSafety } from "@/lib/flowsafety";

const Body = z.object({ answers: z.record(z.string(), z.string().max(3000)) });

export const POST = route<{ id: string }>({ limit: { key: "flow", max: 30, windowSec: 3600 } }, async ({ req, user, params }) => {
  const m = getModule(params.id);
  const ok = await availability();
  if (!m || !ok(m) || m.kind !== "flow") throw new HttpError(404, "Module not found");
  const { answers } = await body(req, Body);
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const r = await runFlow(m, answers, (p?.language ?? "en") as Lang);
  if (r.crisis) await logFlowSafety(user.id, r.level, `flow:${m.id}`);
  await db.insert(schema.moduleRuns).values({ userId: user.id, moduleId: m.id, summaryEnc: encrypt(user.id, JSON.stringify({ answers: m.sensitive && m.category === "clear_path" ? {} : answers, result: r.text })), outcome: { crisis: r.crisis } });
  if (m.domain && !r.crisis) await recordGrowth(user.id, m.domain, "practised");
  return { text: r.text, crisis: r.crisis };
});
