import { z } from "zod";
import { schema } from "@/db";
import type { CrudCfg } from "./crud";
import { day, rating } from "./schemas";

const s = (max = 4000) => z.string().trim().max(max);
const rs = (max = 4000) => z.string().trim().min(1).max(max);

export const moodCfg: CrudCfg = {
  table: schema.moodEntries, rateKey: "mood", orderCol: "at", sinceCol: "at",
  fields: [
    { key: "valence", col: "valence", schema: rating },
    { key: "energy", col: "energy", schema: rating, optional: true },
    { key: "anxiety", col: "anxiety", schema: z.number().int().min(0).max(10), optional: true },
    { key: "intensity", col: "intensity", schema: z.number().int().min(0).max(10), optional: true },
    { key: "emotions", col: "emotionsEnc", schema: s(300), enc: true, optional: true },
    { key: "triggers", col: "triggersEnc", schema: s(300), enc: true, optional: true },
    { key: "note", col: "noteEnc", schema: s(2000), enc: true, optional: true },
  ],
};
export const journalCfg: CrudCfg = {
  table: schema.journalEntries, rateKey: "journal", filterKey: "kind",
  fields: [
    { key: "kind", col: "kind", schema: z.enum(["journal", "safe_space", "unsent", "gratitude", "reflection", "wisdom", "timeline"]).default("journal") },
    { key: "title", col: "titleEnc", schema: s(120), enc: true, optional: true },
    { key: "body", col: "bodyEnc", schema: rs(20000), enc: true },
  ],
};
export const strengthCfg: CrudCfg = {
  table: schema.strengths, rateKey: "strength",
  fields: [
    { key: "kind", col: "kind", schema: z.enum(["small_win", "receipt", "milestone", "feedback", "lesson"]).default("small_win") },
    { key: "text", col: "textEnc", schema: rs(500), enc: true },
    { key: "domain", col: "domain", schema: s(30), optional: true },
  ],
};
export const kitCfg: CrudCfg = {
  table: schema.kitItems, rateKey: "kit", orderCol: "createdAt", filterKey: "section",
  fields: [
    { key: "section", col: "section", schema: z.enum(["helps", "people", "avoid", "reminders", "if_then", "reasons"]) },
    { key: "text", col: "textEnc", schema: rs(500), enc: true },
  ],
};
export const contactCfg: CrudCfg = {
  table: schema.trustedContacts, rateKey: "contact",
  fields: [
    { key: "name", col: "nameEnc", schema: rs(80), enc: true },
    { key: "relation", col: "relationEnc", schema: s(60), enc: true, optional: true },
    { key: "phone", col: "phoneEnc", schema: s(30), enc: true, optional: true },
    { key: "role", col: "role", schema: z.enum(["friend", "family", "mentor", "therapist", "caregiver"]).default("friend") },
    { key: "shareLevel", col: "shareLevel", schema: z.enum(["none", "rough_week_flag"]).default("none") },
  ],
};
export const goalCfg: CrudCfg = {
  table: schema.goals, rateKey: "goal",
  fields: [
    { key: "title", col: "titleEnc", schema: rs(200), enc: true },
    { key: "steps", col: "stepsEnc", schema: s(2000), enc: true, optional: true },
    { key: "status", col: "status", schema: z.enum(["active", "paused", "done"]).default("active") },
  ],
};
export const sleepFields = [
  { key: "day", col: "day", schema: day },
  { key: "bedtime", col: "bedtime", schema: z.string().regex(/^\d{2}:\d{2}$/), optional: true },
  { key: "wake", col: "wake", schema: z.string().regex(/^\d{2}:\d{2}$/), optional: true },
  { key: "quality", col: "quality", schema: rating, optional: true },
  { key: "note", col: "noteEnc", schema: s(1000), enc: true, optional: true },
];
export const eatingFields = [
  { key: "day", col: "day", schema: day },
  { key: "meals", col: "meals", schema: z.number().int().min(0).max(10), optional: true },
  { key: "energy", col: "energy", schema: rating, optional: true },
  { key: "note", col: "noteEnc", schema: s(1000), enc: true, optional: true },
];
