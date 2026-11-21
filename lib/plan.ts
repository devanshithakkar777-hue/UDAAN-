import { z } from "zod";

const L = z.array(z.string().trim().max(300)).max(12).default([]);
export const PlanSchema = z.object({
  warningSigns: L, copingSteps: L, peopleAndPlaces: L, peopleToAsk: L, professionals: L, makingSafe: L, reasons: L,
});
export const emptyPlan = { warningSigns: [], copingSteps: [], peopleAndPlaces: [], peopleToAsk: [], professionals: [], makingSafe: [], reasons: [] };

export const CONSENT_VERSION = "2026-11-v1";
