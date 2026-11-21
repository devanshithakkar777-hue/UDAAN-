import type { CrisisResource } from "./types";

/**
 * IMPORTANT FOR LAUNCH: these entries are widely published Indian helplines, but numbers and hours change.
 * A human must call each one and then set verified: true (and CRISIS_RESOURCES_VERIFIED=true in the environment).
 * The app shows an "unverified" warning to admins until then.
 */
export const RESOURCES: CrisisResource[] = [
  { id: "emergency", name: "Emergency services", detail: "Police, ambulance, fire. If someone is in immediate danger.", phone: "112", hours: "24×7", scope: "india", kind: "emergency", verified: false },
  { id: "tele-manas", name: "Tele-MANAS (Government of India)", detail: "Free mental health support in many languages.", phone: "14416", hours: "24×7", scope: "india", kind: "mental_health", verified: false },
  { id: "kiran", name: "KIRAN Mental Health Helpline", detail: "Free national mental health rehabilitation helpline.", phone: "1800-599-0019", hours: "24×7", scope: "india", kind: "mental_health", verified: false },
  { id: "vandrevala", name: "Vandrevala Foundation", detail: "Free counselling support by phone.", phone: "9999 666 555", hours: "24×7", scope: "india", kind: "suicide", verified: false },
  { id: "icall", name: "iCall (TISS)", detail: "Counselling by trained professionals.", phone: "9152987821", hours: "Mon–Sat, daytime", scope: "india", kind: "mental_health", verified: false },
  { id: "aasra", name: "AASRA", detail: "Support for people in distress or thinking of suicide.", phone: "9820466726", hours: "24×7", scope: "india", kind: "suicide", verified: false },
  { id: "women", name: "Women Helpline", detail: "Help for women facing violence or abuse.", phone: "181", hours: "24×7", scope: "india", kind: "women", verified: false },
  { id: "childline", name: "Childline", detail: "Help for children and teenagers in trouble.", phone: "1098", hours: "24×7", scope: "india", kind: "child", verified: false },
  { id: "tele-manas-sub", name: "Tele-MANAS (substance use)", detail: "Support for alcohol, tobacco and drug use concerns.", phone: "14416", hours: "24×7", scope: "india", kind: "substance", verified: false },
];

export function resourcesFor(kinds: CrisisResource["kind"][]): CrisisResource[] {
  const set = new Set(kinds);
  return RESOURCES.filter((r) => set.has(r.kind));
}

export function formatResources(rs: CrisisResource[]): string {
  return rs.map((r) => `• ${r.name}${r.phone ? ` — ${r.phone}` : ""} (${r.hours})`).join("\n");
}
