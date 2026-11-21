export type Domain = "ei" | "self_awareness" | "accountability" | "social" | "resilience" | "communication" | "decision" | "growth";
export const DOMAINS: { id: Domain; label: string }[] = [
  { id: "ei", label: "Emotional intelligence" }, { id: "self_awareness", label: "Self-awareness" },
  { id: "accountability", label: "Accountability" }, { id: "social", label: "Social intelligence" },
  { id: "resilience", label: "Resilience" }, { id: "communication", label: "Communication" },
  { id: "decision", label: "Decision-making" }, { id: "growth", label: "Personal growth" },
];

export type CategoryId =
  | "first_aid" | "daily" | "sensitivity" | "understand" | "mirror" | "relationships" | "decisions"
  | "moments" | "momentum" | "journeys" | "learn" | "clear_path" | "creative" | "connect" | "digital";

export interface Category { id: CategoryId; title: string; blurb: string; icon: string }

export type StepType = "text" | "scale" | "choice" | "multi" | "note";
export interface Step {
  id: string; prompt: string; type: StepType;
  options?: string[]; placeholder?: string; min?: number; max?: number; optional?: boolean;
  /** Shown below the prompt to explain why we ask. */
  hint?: string;
}

export type ToolId =
  | "breathing" | "box_breathing" | "pranayama" | "grounding" | "body_scan" | "urge_surf" | "body_double" | "soundscape"
  | "wind_down" | "worry_dump" | "movement" | "overload" | "low_energy" | "sleep_story" | "visualisation" | "pause_reflect_respond"
  | "courage" | "ritual" | "daily_reflection" | "rumination_breaker";

export interface ModuleDef {
  id: string;
  title: string;
  blurb: string;
  category: CategoryId;
  icon: string;
  kind: "chat" | "flow" | "tool";
  /** chat: instructions appended to persona. flow: instructions for the synthesis step. */
  instructions?: string;
  opener?: string;
  starters?: string[];
  steps?: Step[];
  tool?: ToolId;
  domain?: Domain;
  /** Specialist review recommended; hidden until an admin enables it. */
  gated?: boolean;
  /** Adults only in v1 (all are, but flagged for the substance module etc.). */
  sensitive?: boolean;
  /** Keywords for search and for the companion to suggest the module. */
  tags?: string[];
}
