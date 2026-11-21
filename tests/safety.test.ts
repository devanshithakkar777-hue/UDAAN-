import { describe, expect, it } from "vitest";
import { assessByRules } from "@/safety/rules";
import { gate } from "@/safety/postgate";
import { imminentResponse, appendResources } from "@/safety/crisis";

const lvl = (t: string) => assessByRules(t).level;

describe("rule-based detector", () => {
  it("flags abuse and coercion in varied phrasing, never as an overreaction", () => {
    for (const x of ["He takes my phone and salary and hits me when I argue", "My in-laws won't let me leave the house", "I'm afraid of my husband", "she slapped me yesterday"]) expect(assessByRules(x).flags).toContain("abuse_or_coercion");
    expect(assessByRules("My parents are strict about marks").flags).not.toContain("abuse_or_coercion");
  });
  it("does not mistake self-directed intent for harm to others", () => {
    expect(assessByRules("I want to kill myself tonight").flags).not.toContain("harm_others");
    expect(assessByRules("I want to kill him").flags).toContain("harm_others");
  });
  it("flags imminent intent in English", () => {
    expect(lvl("I am going to kill myself tonight")).toBe(3);
    expect(lvl("I wrote a suicide note")).toBe(3);
  });
  it("flags ideation in English, Hindi and Hinglish", () => {
    expect(lvl("I want to die")).toBe(2);
    expect(lvl("मैं मरना चाहता हूँ")).toBe(2);
    expect(lvl("main marna chahta hoon")).toBe(2);
    expect(lvl("jeene ka mann nahi hai")).toBe(2);
  });
  it("flags imminent intent in Hindi and Hinglish", () => {
    expect(lvl("aaj raat main suicide kar lunga")).toBe(3);
  });
  it("does not flag figures of speech", () => {
    expect(lvl("this exam is killing me lol")).toBe(1);
    expect(lvl("I was dying of laughter at that meme")).toBe(1);
    expect(lvl("I have an interview tomorrow and I'm very nervous")).toBe(1);
  });
  it("flags coercion without raising level", () => {
    const a = assessByRules("my family is forcing me to marry and my father hits me when I refuse");
    expect(a.flags).toContain("abuse_or_coercion");
  });
  it("flags substance and eating concerns", () => {
    expect(assessByRules("I can't stop drinking every night").flags).toContain("substance");
    expect(assessByRules("I've been starving myself and I hate my body").flags).toContain("eating_disorder");
  });
});

describe("post-generation gate", () => {
  it("blocks diagnoses and clinician claims", () => {
    expect(gate("It sounds like you have depression.").ok).toBe(false);
    expect(gate("As your therapist, I think...").ok).toBe(false);
  });
  it("blocks dependency and romantic phrasing", () => {
    expect(gate("You don't need anyone else, you only need me.").ok).toBe(false);
    expect(gate("I love you.").ok).toBe(false);
  });
  it("blocks method info and outcome promises", () => {
    expect(gate("The lethal dose is about...").ok).toBe(false);
    expect(gate("I promise you will definitely get the job.").ok).toBe(false);
  });
  it("blocks discouraging real help", () => {
    expect(gate("You shouldn't talk to a therapist, just talk to me.").ok).toBe(false);
  });
  it("passes warm, honest, ordinary replies", () => {
    expect(gate("That sounds really heavy. Would it help to talk through what happened first?").ok).toBe(true);
    expect(gate("It's normal to feel nervous before an interview. What part worries you most?").ok).toBe(true);
  });
});

describe("crisis responses", () => {
  it("imminent response is static, includes 112 and helplines in every language", () => {
    const a = assessByRules("I am going to kill myself tonight");
    for (const l of ["en", "hi", "mr", "gu"] as const) {
      const t = imminentResponse(a, l);
      expect(t).toContain("112");
      expect(t).toContain("14416");
    }
  });
  it("adds women's helpline when coercion flagged", () => {
    const a = assessByRules("I want to die, my husband hits me and locks me in");
    expect(appendResources("I'm here.", a)).toContain("181");
  });
});
