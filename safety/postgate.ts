/**
 * Post-generation gate. Runs on every model reply before the user sees it.
 * It blocks things UDAAN must never say, whatever the model produced.
 */
export interface GateResult { ok: boolean; reasons: string[] }

const BLOCKS: { re: RegExp; code: string }[] = [
  // Diagnosis
  { re: /\b(you\s*(have|are\s*suffering\s*from|are\s*clinically|likely\s*have|probably\s*have|definitely\s*have|seem\s*to\s*have)\s*(major\s*)?(depression|bipolar|adhd|ocd|ptsd|anxiety\s*disorder|borderline|bpd|schizophreni\w*|autism|an?\s*eating\s*disorder|anorexia|bulimia|npd|narcissistic\s*personality))\b/i, code: "diagnosis" },
  { re: /\b(your|this\s*is)\s*(clinical\s*)?(diagnosis|disorder)\s*(is|of)\b/i, code: "diagnosis2" },
  { re: /\b(तुम्हें|आपको)\s*(डिप्रेशन|बाइपोलर|एडीएचडी|ओसीडी)\s*(है|हो\s*सकता)/, code: "diagnosis_hi" },
  // Claiming to be a clinician or a person
  { re: /\bas\s*(your|a)\s*(therapist|psychologist|psychiatrist|doctor|counsellor|counselor)\b/i, code: "claims_clinician" },
  { re: /\bi('m|\s*am)\s*(a\s*)?(licensed|qualified|real)?\s*(therapist|psychologist|psychiatrist|doctor|human)\b/i, code: "claims_identity" },
  // Medication and dosing
  { re: /\b(take|try|increase|stop|reduce|skip|double)\s*(your\s*)?\d*\s*(mg|milligrams?)?\s*(of\s*)?(sertraline|fluoxetine|escitalopram|clonazepam|alprazolam|lorazepam|diazepam|lithium|quetiapine|olanzapine|amitriptyline|zolpidem|melatonin|ssri|antidepressants?|benzos?)\b/i, code: "medication_advice" },
  // Method information
  { re: /\b(lethal|fatal|deadly)\s*(dose|amount|quantity)|how\s*many\s*(pills|tablets)\s*(would|will|to)\s*(kill|be\s*fatal|overdose)|painless\s*(way|method)s?\s*(to|of)\s*(die|suicide|kill)/i, code: "method_info" },
  { re: /\b(best|easiest|quickest|surest)\s*way\s*to\s*(kill\s*yourself|die|commit\s*suicide|end\s*your\s*life)/i, code: "method_info2" },
  // Dependency and exclusivity
  { re: /\b(you\s*(only\s*)?need\s*me|you\s*don'?t\s*need\s*(anyone|anybody|other\s*people)|i('m|\s*am)\s*(all|the\s*only\s*(one|person))\s*you\s*(need|have)|i('ll|\s*will)\s*always\s*be\s*(here|there)\s*(for\s*you)?\s*(no\s*matter|unlike)|no\s*one\s*(understands|gets)\s*you\s*(like\s*i\s*do|but\s*me)|better\s*than\s*(your\s*)?(friends|family|therapist))\b/i, code: "dependency" },
  { re: /\b(come\s*back\s*(every\s*day|daily|tomorrow)\s*(or|so\s*that|because)\s*(i|you'?ll)\s*(miss|lose|fall))\b/i, code: "engagement_bait" },
  { re: /\bi\s*(love|miss)\s*you\b/i, code: "romantic_attachment" },
  // Outcome promises
  { re: /\b(i\s*promise|guarantee(d)?|definitely|100%|for\s*sure)\b.{0,40}\b(you'?ll|you\s*will|everything\s*will|it\s*will)\s*(\w+\s+)?(get\s*the\s*job|pass|be\s*(fine|okay|ok|cured)|work\s*out|succeed|recover|get\s*better)\b/i, code: "outcome_promise" },
  // Discouraging real help
  { re: /\b(don'?t|no\s*need\s*to|you\s*shouldn'?t)\s*(see|go\s*to|talk\s*to|call|tell)\s*(a\s*)?(therapist|doctor|psychiatrist|counsellor|helpline|anyone|your\s*(family|parents|friends))\b/i, code: "discourages_help" },
];

export function gate(text: string): GateResult {
  const reasons = BLOCKS.filter((b) => b.re.test(text)).map((b) => b.code);
  return { ok: reasons.length === 0, reasons };
}

export const REGEN_NOTE = (reasons: string[]) =>
  `Your previous draft broke these safety rules: ${reasons.join(", ")}. Rewrite the reply without: diagnosing, claiming to be a clinician or human, giving medication or method information, saying you are all they need or better than other people, saying you love them, or promising outcomes. Keep the warmth and the substance. Encourage real-world support where it fits.`;

export const SAFE_FALLBACK: Record<string, string> = {
  en: "I want to make sure I say this carefully, so let me keep it simple. I'm here and I'm listening. What you're going through deserves real attention, and the people in your life, or a counsellor, can give you something I can't. What feels most important to talk about right now?",
  hi: "मैं इसे सावधानी से कहना चाहता हूँ, इसलिए सीधी बात करता हूँ। मैं यहाँ हूँ और सुन रहा हूँ। आप जिससे गुज़र रहे हैं वह गंभीरता से सुने जाने लायक है, और आपके अपने लोग या कोई काउंसलर आपको वह दे सकते हैं जो मैं नहीं दे सकता। अभी सबसे ज़रूरी क्या लग रहा है?",
  mr: "मला हे काळजीपूर्वक सांगायचं आहे, म्हणून सोपं ठेवतो. मी इथे आहे आणि ऐकतोय. तुम्ही ज्यातून जात आहात त्याकडे गांभीर्याने लक्ष द्यायला हवं, आणि तुमच्या जवळची माणसं किंवा एखादा समुपदेशक तुम्हाला मी देऊ शकत नाही ते देऊ शकतो. आत्ता सर्वात महत्त्वाचं काय वाटतंय?",
  gu: "હું આ કાળજીથી કહેવા માંગુ છું, એટલે સરળ રાખું છું. હું અહીં છું અને સાંભળું છું. તમે જેમાંથી પસાર થઈ રહ્યા છો તેને ગંભીરતાથી લેવાની જરૂર છે, અને તમારી નજીકના લોકો કે કોઈ કાઉન્સેલર તમને તે આપી શકે જે હું નથી આપી શકતો. અત્યારે સૌથી મહત્વનું શું લાગે છે?",
};
