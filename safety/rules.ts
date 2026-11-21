import type { Assessment, Flag, RiskLevel } from "./types";

type Rule = { re: RegExp; level: RiskLevel; flag?: Flag; code: string };

/**
 * Rule-based detector. Deliberately high-recall: a false alarm costs a gentle check-in,
 * a miss costs far more. Covers English, Hindi (Devanagari) and Hinglish (romanised Hindi).
 * This is the floor; the LLM classifier adds nuance on top, never replaces it.
 */
const RULES: Rule[] = [
  // ── Level 3: plan, means, intent, in progress ──
  { re: /\b(i\s*(am|'m)\s*going\s*to|i\s*will|i\s*want\s*to|i\s*plan\s*to|about\s*to)\s*(kill\s*myself|end\s*(my|it\s*all)|take\s*my\s*(own\s*)?life|commit\s*suicide)/i, level: 3, flag: "suicide_plan", code: "en_intent" },
  { re: /\b(i\s*have|i('ve|\s*have)\s*got|got)\s*(the\s*)?(pills|rope|blade|knife|gun|poison)\b.*\b(to\s*(die|end)|kill\s*myself|tonight|ready)/i, level: 3, flag: "suicide_plan", code: "en_means" },
  { re: /\b(wrote|writing|written)\s*(a\s*)?(suicide\s*note|goodbye\s*note|last\s*note)/i, level: 3, flag: "suicide_plan", code: "en_note" },
  { re: /\b(tonight|today|right\s*now|this\s*(evening|afternoon))\b.{0,40}\b(kill\s*myself|end\s*my\s*life|suicide|die)\b/i, level: 3, flag: "suicide_plan", code: "en_timeframe" },
  { re: /\b(just\s*)?(took|swallowed|overdosed|cut\s*(my\s*)?(wrists?|myself\s*deep))\b.{0,40}\b(to\s*die|kill|end\s*it|too\s*many|overdose)/i, level: 3, flag: "suicide_plan", code: "en_in_progress" },
  { re: /(मैं|मै|मैंने|मुझे)?.{0,12}(आत्महत्या|खुदकुशी|जान\s*दे)\s*(करने\s*(जा|वाला|वाली)|कर\s*लूँगा|कर\s*लूंगा|कर\s*लूँगी|कर\s*लूंगी|करूँगा|करूंगा|करूँगी|करूंगी)/, level: 3, flag: "suicide_plan", code: "hi_intent" },
  { re: /\b(aaj\s*raat|abhi|aaj)\b.{0,40}\b(suicide|khudkushi|jaan\s*de|mar\s*jaa(un|ungi)|khatam\s*kar)/i, level: 3, flag: "suicide_plan", code: "hinglish_timeframe" },
  { re: /\b(suicide|khudkushi|khud\s*kushi)\s*(kar\s*(lu|lunga|lungi|raha|rahi)|karne\s*ja\s*(raha|rahi))/i, level: 3, flag: "suicide_plan", code: "hinglish_intent" },
  { re: /\b(goliyan|goli|zeher|rassi|blade)\b.{0,40}\b(le\s*(aaya|aayi|li)|kha\s*(li|liya)|kha\s*raha)/i, level: 3, flag: "suicide_plan", code: "hinglish_means" },

  // ── Level 2: ideation, self-harm, hopelessness ──
  { re: /\b(want\s*to\s*die|wanna\s*die|wish\s*i\s*(was|were)\s*(dead|never\s*born)|don'?t\s*want\s*to\s*(live|be\s*alive|exist)|better\s*off\s*without\s*me|no\s*reason\s*to\s*live|can'?t\s*go\s*on|end\s*it\s*all|kill\s*myself|suicid(e|al))\b/i, level: 2, flag: "suicide_ideation", code: "en_ideation" },
  { re: /\b(self[-\s]?harm|hurt(ing)?\s*myself|cut(ting)?\s*myself|burn(ing)?\s*myself|harm\s*myself)\b/i, level: 2, flag: "self_harm", code: "en_selfharm" },
  { re: /\b(everyone|they|family|world)\s*(would\s*be|is|are)\s*better\s*(off\s*)?without\s*me\b/i, level: 2, flag: "suicide_ideation", code: "en_burden" },
  { re: /\b(i\s*am|i'?m|feel(ing)?)\s*(such\s*)?a\s*burden\b/i, level: 2, flag: "hopeless", code: "en_burden2" },
  { re: /\b(no\s*(point|hope|way\s*out|future)|nothing\s*(matters|will\s*ever\s*change)|hopeless|trapped\s*and\s*(can'?t|cannot)\s*escape)\b/i, level: 2, flag: "hopeless", code: "en_hopeless" },
  { re: /(मरना\s*चाहता|मरना\s*चाहती|जीना\s*नहीं\s*चाहता|जीना\s*नहीं\s*चाहती|जीने\s*का\s*मन\s*नहीं|जीने\s*की\s*इच्छा\s*नहीं|आत्महत्या|खुदकुशी|खुद\s*को\s*(खत्म|नुकसान|चोट)|मर\s*जाऊं|मर\s*जाऊँ|सब\s*खत्म\s*कर)/, level: 2, flag: "suicide_ideation", code: "hi_ideation" },
  { re: /\b(marna\s*chahta|marna\s*chahti|mar\s*jaana\s*chahta|mar\s*jaana\s*chahti|jeena\s*nahi\s*chahta|jeena\s*nahi\s*chahti|jeene\s*ka\s*(mann|man)\s*nahi|jeene\s*ki\s*(iccha|ichha)\s*nahi|khudkushi|khud\s*kushi|suicide\s*karna|mar\s*jaun|mar\s*jau|mar\s*jaaun|sab\s*khatam\s*kar|zindagi\s*khatam|khud\s*ko\s*(hurt|nuksan|chot|khatam)|main\s*bojh\s*hoon|mere\s*bina\s*sab\s*theek)\b/i, level: 2, flag: "suicide_ideation", code: "hinglish_ideation" },
  { re: /(મરવું\s*છે|જીવવું\s*નથી|આત્મહત્યા|मरायचं\s*आहे|जगायचं\s*नाही|जगावंसं\s*वाटत\s*नाही|आत्महत्या)/, level: 2, flag: "suicide_ideation", code: "gu_mr_ideation" },
  { re: /\b(sab\s*bekaar|kuch\s*nahi\s*badlega|koi\s*(umeed|ummeed)\s*nahi|thak\s*gaya\s*hoon\s*jeene\s*se|thak\s*gayi\s*hoon\s*jeene\s*se)\b/i, level: 2, flag: "hopeless", code: "hinglish_hopeless" },

  // ── Flags that do not by themselves raise level ──
  { re: /\b(he|she|they|my\s*(husband|wife|partner|father|mother|brother|in-laws?|boyfriend|girlfriend))\s*(hits?|beats?|slaps?|chokes?|threatens?|locks?\s*me|won'?t\s*let\s*me\s*(leave|go\s*out)|control(s)?\s*(my\s*)?(phone|money|everything)|forc(es|ing)\s*me\s*to\s*(marry|have\s*sex|stop))/i, level: 1, flag: "abuse_or_coercion", code: "en_abuse" },
  { re: /\b(hits?|beats?|slaps?|chokes?|kicks?|punche[sd]?|burns?)\s+me\b|\b(hit|beat|slapped|choked|kicked|punched)\s+me\b|\b(takes?|took|confiscates?)\s+my\s+(phone|salary|money|passport|documents)\b|\b(won'?t|doesn'?t|not)\s+(let|allow)s?\s+me\s+(meet|see|talk\s+to|leave|go\s+out|work)\b|\bthreaten(s|ed)?\s+(to\s+)?(me|kill|hurt|leave\s+me)\b|\bafraid\s+of\s+(him|her|my\s+(husband|wife|partner|father|brother|in-laws?))\b/i, level: 1, flag: "abuse_or_coercion", code: "en_abuse3" },
  { re: /\b(forced\s*(marriage|to\s*marry)|being\s*abused|domestic\s*violence|marital\s*rape|sexually\s*(assaulted|abused)|molest(ed|ing)|raped)\b/i, level: 1, flag: "abuse_or_coercion", code: "en_abuse2" },
  { re: /\b(maarta|maarti|peette|peeta|peet(ta|ti)|dhamki|jabardasti|zabardasti|gharwale\s*(zabardasti|jabardasti)|shaadi\s*ke\s*liye\s*(force|majboor))\b/i, level: 1, flag: "abuse_or_coercion", code: "hinglish_abuse" },
  { re: /(मारता|मारती|पीटता|पीटती|धमकी|जबरदस्ती|ज़बरदस्ती)/, level: 1, flag: "abuse_or_coercion", code: "hi_abuse" },
  { re: /\b(want\s*to|going\s*to|plan\s*to)\s*(kill|hurt|stab|shoot|beat\s*up)\s*(him|her|them|my\s+(?!self)\w+|someone)\b/i, level: 2, flag: "harm_others", code: "en_harm_others" },
  { re: /\b(maar\s*dunga|maar\s*dungi|jaan\s*se\s*maar|khatam\s*kar\s*dunga|khatam\s*kar\s*dungi)\b/i, level: 2, flag: "harm_others", code: "hinglish_harm_others" },
  { re: /\b(drink(ing)?\s*(too\s*much|every\s*(day|night))|can'?t\s*stop\s*(drinking|smoking|using)|relaps(e|ed)|craving|urge\s*to\s*(drink|smoke|use)|(weed|ganja|cocaine|heroin|meth|mdma|pills)\s*(again|daily)|alcohol|sharaab|daaru|nasha|cigarette|smoking|vaping)\b/i, level: 1, flag: "substance", code: "en_substance" },
  { re: /\b(starv(e|ing)\s*myself|purg(e|ing)|make\s*myself\s*(throw\s*up|vomit)|binge|haven'?t\s*eaten\s*(in|for)\s*days|hate\s*my\s*body|so\s*fat|laxatives?\s*to\s*lose)\b/i, level: 1, flag: "eating_disorder", code: "en_ed" },
  { re: /\b(i\s*am|i'?m)\s*(1[0-7]|[5-9])\s*(years?\s*old|yo)\b|\bin\s*(class|grade|std\.?)\s*(\d|1[0-2])\b/i, level: 1, flag: "minor_signal", code: "minor" },
  { re: /\b(chest\s*pain|can'?t\s*breathe|overdos(e|ed)|bleeding\s*(heavily|a\s*lot)|unconscious|having\s*a\s*(seizure|stroke|heart\s*attack))\b/i, level: 2, flag: "medical_emergency", code: "en_medical" },
];

/** Phrases that look alarming but are clearly figurative or about fiction/other topics. Only de-escalate level 2 → 1 when matched and nothing level-3 matched. */
const FIGURATIVE = /\b(dying\s*(of|from)\s*(laughter|embarrassment|boredom|cringe)|kill(ing)?\s*it|killed\s*it|to\s*die\s*for|dead\s*tired|i('m|\s*am)\s*dead\s*lol|this\s*traffic\s*is\s*killing\s*me|kill\s*the\s*process|kill\s*-9|die\s*hard)\b/i;

export function assessByRules(text: string): Assessment {
  const t = text.normalize("NFKC");
  let level: RiskLevel = 1;
  const flags = new Set<Flag>();
  const signals: string[] = [];
  for (const r of RULES) {
    if (r.re.test(t)) {
      if (r.level > level) level = r.level;
      if (r.flag) flags.add(r.flag);
      signals.push(r.code);
    }
  }
  if (level === 2 && FIGURATIVE.test(t) && ![...flags].some((f) => f === "self_harm" || f === "suicide_plan") && !/\b(kill\s*myself|suicid|want\s*to\s*die|end\s*my\s*life)/i.test(t)) {
    level = 1;
    signals.push("figurative_deescalate");
  }
  if (flags.has("suicide_plan")) level = 3;
  return { level, flags: [...flags], source: "rules", signals };
}

export function mergeAssessments(a: Assessment, b: Assessment | null): Assessment {
  if (!b) return a;
  // Never let the model lower what the rules caught. It can only raise or add flags.
  const level = Math.max(a.level, b.level) as RiskLevel;
  return { level, flags: [...new Set([...a.flags, ...b.flags])], source: "merged", signals: [...a.signals, ...b.signals.map((s) => `llm:${s}`)] };
}
