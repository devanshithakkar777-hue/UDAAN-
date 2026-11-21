import type { Assessment } from "./types";
import { formatResources, resourcesFor } from "./resources";
import type { CrisisResource } from "./types";

export type Lang = "en" | "hi" | "mr" | "gu";

/**
 * Static crisis copy. These strings are intentionally NOT model-generated: at the moment of highest risk,
 * the wording must be predictable and reviewed. A clinician should review all four languages before launch.
 */
const IMMINENT: Record<Lang, string> = {
  en: "I'm really glad you told me. What you're feeling right now matters, and your safety matters more than anything else in this moment.\n\nPlease reach out to a person right now. Call one of the numbers below, or tell someone near you: a family member, a friend, a neighbour. If you have anything with you that you could use to hurt yourself, please put it in another room or hand it to someone.\n\nIf you are in immediate danger, call 112 now.",
  hi: "आपने मुझे बताया, यह बहुत अच्छा किया। आप अभी जो महसूस कर रहे हैं वह मायने रखता है, और इस पल में आपकी सुरक्षा सबसे ज़रूरी है।\n\nकृपया अभी किसी इंसान से बात कीजिए। नीचे दिए नंबरों में से किसी पर कॉल करें, या अपने पास के किसी व्यक्ति को बताइए: परिवार का सदस्य, दोस्त, पड़ोसी। अगर आपके पास ऐसी कोई चीज़ है जिससे आप खुद को नुकसान पहुँचा सकते हैं, तो उसे दूसरे कमरे में रख दें या किसी को दे दें।\n\nअगर आप तुरंत खतरे में हैं, तो अभी 112 पर कॉल करें।",
  mr: "तुम्ही मला सांगितलंत, हे खूप चांगलं केलंत. तुम्ही आत्ता जे अनुभवत आहात ते महत्त्वाचं आहे, आणि या क्षणी तुमची सुरक्षितता सर्वात महत्त्वाची आहे.\n\nकृपया आत्ताच कोणाशी तरी बोला. खालील क्रमांकांपैकी एकावर कॉल करा, किंवा जवळच्या व्यक्तीला सांगा: कुटुंबातील सदस्य, मित्र, शेजारी. स्वतःला इजा करता येईल अशी कोणतीही वस्तू जवळ असेल तर ती दुसऱ्या खोलीत ठेवा किंवा कोणाला तरी द्या.\n\nतुम्ही तात्काळ धोक्यात असाल तर आत्ताच 112 वर कॉल करा.",
  gu: "તમે મને કહ્યું, તે ખૂબ સારું કર્યું. તમે અત્યારે જે અનુભવો છો તે મહત્વનું છે, અને આ ક્ષણે તમારી સલામતી સૌથી મહત્વની છે.\n\nકૃપા કરીને હમણાં જ કોઈ વ્યક્તિ સાથે વાત કરો. નીચેના નંબરોમાંથી કોઈ એક પર કૉલ કરો, અથવા નજીકના કોઈને કહો: પરિવારનો સભ્ય, મિત્ર, પડોશી. જો તમારી પાસે સ્વયંને નુકસાન પહોંચાડી શકાય તેવી કોઈ વસ્તુ હોય, તો તેને બીજા રૂમમાં મૂકો અથવા કોઈને આપી દો.\n\nજો તમે તાત્કાલિક જોખમમાં હોવ તો હમણાં 112 પર કૉલ કરો.",
};

const FOLLOWUP: Record<Lang, string> = {
  en: "I'm here with you. Can you tell me, are you safe right now, and is there someone who can be with you?",
  hi: "मैं आपके साथ हूँ। क्या आप बता सकते हैं कि आप अभी सुरक्षित हैं, और क्या कोई आपके साथ रह सकता है?",
  mr: "मी तुमच्यासोबत आहे. तुम्ही आत्ता सुरक्षित आहात का, आणि कोणी तुमच्यासोबत राहू शकेल का?",
  gu: "હું તમારી સાથે છું. શું તમે અત્યારે સુરક્ષિત છો, અને શું કોઈ તમારી સાથે રહી શકે?",
};

const HEADER: Record<Lang, string> = { en: "People you can reach right now", hi: "जिनसे आप अभी संपर्क कर सकते हैं", mr: "ज्यांच्याशी तुम्ही आत्ता संपर्क साधू शकता", gu: "જેમનો તમે હમણાં સંપર્ક કરી શકો" };

export function crisisKinds(a: Assessment): CrisisResource["kind"][] {
  const k: CrisisResource["kind"][] = ["emergency", "mental_health", "suicide"];
  if (a.flags.includes("abuse_or_coercion")) k.push("women");
  if (a.flags.includes("minor_signal")) k.push("child");
  if (a.flags.includes("substance")) k.push("substance");
  return k;
}

export function resourceBlock(a: Assessment, lang: Lang = "en", kinds = crisisKinds(a)): string {
  return `${HEADER[lang]}:\n${formatResources(resourcesFor(kinds))}`;
}

/** Level 3: fully static, no model call. */
export function imminentResponse(a: Assessment, lang: Lang = "en"): string {
  return `${IMMINENT[lang]}\n\n${resourceBlock(a, lang)}\n\n${FOLLOWUP[lang]}`;
}

/** Level 2: the model writes the warm part under a crisis-mode prompt, and this block is always appended in code. */
export function appendResources(modelText: string, a: Assessment, lang: Lang = "en"): string {
  return `${modelText.trimEnd()}\n\n${resourceBlock(a, lang)}`;
}

export function resourceBlockFor(kinds: CrisisResource["kind"][], lang: Lang = "en"): string {
  return `${HEADER[lang]}:\n${formatResources(resourcesFor(kinds))}`;
}
