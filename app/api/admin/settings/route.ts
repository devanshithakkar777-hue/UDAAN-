import { z } from "zod";
import { db, schema } from "@/db";
import { route, body } from "@/lib/http";
import { setAiSetting } from "@/ai/settings";
import { audit } from "@/lib/audit";
import { ALL_MODULES } from "@/modules/registry";

/** Runtime controls: swap models, add a persona note, disable or enable modules. Takes effect within about 30 seconds, with no deploy. This is also the rollback lever. */
const Body = z.object({ key: z.enum(["main_model", "classifier_model", "persona_note", "disabled_modules", "enabled_modules"]), value: z.string().max(2000) });
export const GET = route({ auth: ["admin"] }, async () => ({ settings: await db.select().from(schema.aiSettings), modules: ALL_MODULES.map((m) => ({ id: m.id, title: m.title, gated: !!m.gated, category: m.category })) }));
export const PUT = route({ auth: ["admin"] }, async ({ req, user }) => {
  const b = await body(req, Body);
  await setAiSetting(b.key, b.value, user.id);
  await audit(user.id, "admin.setting", null, { key: b.key });
  return { ok: true };
});
