import { CATEGORIES, CORE } from "./core";
import { ACADEMY_MODULES, AUDIENCES, CLEAR_PATH, JOURNEYS, LIFE_SKILLS, MOMENTS, STUDIO_MODULES, TRANSITIONS } from "./groups";
import type { ModuleDef } from "./types";
import { getAiSetting } from "@/ai/settings";

export { CATEGORIES };
export const ALL_MODULES: ModuleDef[] = [
  ...CORE, ...MOMENTS, ...JOURNEYS, ...STUDIO_MODULES, ...TRANSITIONS, ...ACADEMY_MODULES, ...LIFE_SKILLS, ...CLEAR_PATH, ...AUDIENCES,
];

const byId = new Map(ALL_MODULES.map((m) => [m.id, m]));
if (byId.size !== ALL_MODULES.length) throw new Error("Duplicate module id in registry");

export const getModule = (id: string) => byId.get(id);

/** Gated modules (those flagged for specialist review) stay hidden until an admin enables them. Any module can be disabled. */
export async function availability() {
  const disabled = new Set(((await getAiSetting("disabled_modules")) ?? "").split(",").filter(Boolean));
  const enabled = new Set(((await getAiSetting("enabled_modules")) ?? "").split(",").filter(Boolean));
  return (m: ModuleDef) => !disabled.has(m.id) && (!m.gated || enabled.has(m.id));
}

export async function listModules() {
  const ok = await availability();
  return ALL_MODULES.filter(ok).map(({ instructions: _i, ...pub }) => pub);
}
