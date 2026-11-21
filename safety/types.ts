export type RiskLevel = 1 | 2 | 3; // 1 ordinary · 2 elevated (ideation, self-harm, hopelessness) · 3 imminent (plan, means, intent, in progress)

export type Flag =
  | "self_harm" | "suicide_ideation" | "suicide_plan" | "hopeless" | "harm_others"
  | "abuse_or_coercion" | "substance" | "eating_disorder" | "minor_signal" | "medical_emergency";

export interface Assessment {
  level: RiskLevel;
  flags: Flag[];
  source: "rules" | "llm" | "merged";
  /** Short, content-free reason codes for logging. */
  signals: string[];
}

export interface CrisisResource {
  id: string;
  name: string;
  detail: string;
  phone?: string;
  hours: string;
  scope: "india" | "global";
  kind: "suicide" | "mental_health" | "emergency" | "women" | "child" | "substance" | "eating_disorder";
  /** Flip to true only after a human has called and confirmed the line. */
  verified: boolean;
}
