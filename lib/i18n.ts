export type Lang = "en" | "hi" | "mr" | "gu";
export const LANGS: { id: Lang; label: string }[] = [{ id: "en", label: "English" }, { id: "hi", label: "हिंदी" }, { id: "mr", label: "मराठी" }, { id: "gu", label: "ગુજરાતી" }];

/** UI strings. Hindi, Marathi and Gujarati should be reviewed by native speakers before launch. The companion itself replies in the person's language. */
const D: Record<string, Record<Lang, string>> = {
  tagline: { en: "Find Your Wings.", hi: "अपने पंख खोजिए।", mr: "तुमचे पंख शोधा.", gu: "તમારી પાંખો શોધો." },
  "nav.talk": { en: "Talk", hi: "बात करें", mr: "बोला", gu: "વાત કરો" },
  "nav.grow": { en: "Grow", hi: "आगे बढ़ें", mr: "वाढा", gu: "આગળ વધો" },
  "nav.reflect": { en: "Reflect", hi: "मनन", mr: "चिंतन", gu: "ચિંતન" },
  "nav.care": { en: "Care", hi: "सहायता", mr: "आधार", gu: "સહાય" },
  safe: { en: "I need help now", hi: "मुझे अभी मदद चाहिए", mr: "मला आत्ता मदत हवी", gu: "મને હમણાં મદદ જોઈએ" },
  "safe.short": { en: "Safe", hi: "सुरक्षित", mr: "सुरक्षित", gu: "સુરક્ષિત" },
  send: { en: "Send", hi: "भेजें", mr: "पाठवा", gu: "મોકલો" },
  "talk.placeholder": { en: "Say what's on your mind…", hi: "जो मन में है, कहिए…", mr: "मनात जे आहे ते सांगा…", gu: "મનમાં જે છે તે કહો…" },
  "talk.new": { en: "New conversation", hi: "नई बातचीत", mr: "नवीन संभाषण", gu: "નવી વાતચીત" },
  "talk.greeting": { en: "How are you feeling right now?", hi: "आप अभी कैसा महसूस कर रहे हैं?", mr: "तुम्हाला आत्ता कसं वाटतंय?", gu: "તમને અત્યારે કેવું લાગે છે?" },
  "talk.listen": { en: "Just listen", hi: "बस सुनिए", mr: "फक्त ऐका", gu: "ફક્ત સાંભળો" },
  "talk.help": { en: "Help me think", hi: "सोचने में मदद करें", mr: "विचार करायला मदत करा", gu: "વિચારવામાં મદદ કરો" },
  "talk.why": { en: "Why did you say that?", hi: "आपने ऐसा क्यों कहा?", mr: "तुम्ही असं का म्हणालात?", gu: "તમે આવું કેમ કહ્યું?" },
  "talk.disclaimer": { en: "UDAAN is an AI companion for support and growth. It isn't a therapist or a doctor, and can't handle emergencies.", hi: "UDAAN सहारे और विकास के लिए एक AI साथी है। यह थेरेपिस्ट या डॉक्टर नहीं है और आपात स्थितियों को नहीं संभाल सकता।", mr: "UDAAN हा आधार आणि वाढीसाठी AI सोबती आहे. तो थेरपिस्ट किंवा डॉक्टर नाही आणि आणीबाणी हाताळू शकत नाही.", gu: "UDAAN આધાર અને વિકાસ માટેનો AI સાથી છે. તે થેરાપિસ્ટ કે ડૉક્ટર નથી અને કટોકટી સંભાળી શકતો નથી." },
  "grow.title": { en: "Grow", hi: "आगे बढ़ें", mr: "वाढा", gu: "આગળ વધો" },
  "grow.search": { en: "Search what you need…", hi: "जो चाहिए खोजें…", mr: "हवं ते शोधा…", gu: "જોઈતું શોધો…" },
  "reflect.title": { en: "Reflect", hi: "मनन", mr: "चिंतन", gu: "ચિંતન" },
  "care.title": { en: "Care", hi: "सहायता", mr: "आधार", gu: "સહાય" },
  "mood.how": { en: "How are you, honestly?", hi: "सच में, आप कैसे हैं?", mr: "खरं सांगा, कसे आहात?", gu: "સાચે, તમે કેમ છો?" },
  "mood.save": { en: "Save check-in", hi: "चेक-इन सहेजें", mr: "चेक-इन जतन करा", gu: "ચેક-ઇન સાચવો" },
  "settings.title": { en: "You and your privacy", hi: "आप और आपकी निजता", mr: "तुम्ही आणि तुमची गोपनीयता", gu: "તમે અને તમારી ગોપનીયતા" },
  signin: { en: "Sign in", hi: "साइन इन", mr: "साइन इन", gu: "સાઇન ઇન" },
  signup: { en: "Create account", hi: "खाता बनाएं", mr: "खाते तयार करा", gu: "ખાતું બનાવો" },
  email: { en: "Email", hi: "ईमेल", mr: "ईमेल", gu: "ઇમેઇલ" },
  password: { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड", gu: "પાસવર્ડ" },
  name: { en: "What should I call you?", hi: "मैं आपको क्या कहूँ?", mr: "मी तुम्हाला काय म्हणू?", gu: "હું તમને શું કહું?" },
  continue: { en: "Continue", hi: "आगे बढ़ें", mr: "पुढे जा", gu: "આગળ વધો" },
  back: { en: "Back", hi: "वापस", mr: "मागे", gu: "પાછા" },
  save: { en: "Save", hi: "सहेजें", mr: "जतन करा", gu: "સાચવો" },
  delete: { en: "Delete", hi: "हटाएं", mr: "हटवा", gu: "કાઢી નાખો" },
  cancel: { en: "Cancel", hi: "रद्द करें", mr: "रद्द करा", gu: "રદ કરો" },
  "crisis.title": { en: "You're not alone. Reach a person now.", hi: "आप अकेले नहीं हैं। अभी किसी इंसान से बात करें।", mr: "तुम्ही एकटे नाही. आत्ता कोणाशी तरी बोला.", gu: "તમે એકલા નથી. હમણાં કોઈ વ્યક્તિ સાથે વાત કરો." },
  "crisis.free": { en: "Crisis information is always free and always here, with no sign-in.", hi: "संकट की जानकारी हमेशा मुफ़्त है और यहाँ मौजूद है, साइन-इन के बिना।", mr: "संकटाची माहिती नेहमी मोफत आणि येथे उपलब्ध आहे, साइन-इन शिवाय.", gu: "કટોકટીની માહિતી હંમેશા મફત અને અહીં છે, સાઇન-ઇન વગર." },
  call: { en: "Call", hi: "कॉल करें", mr: "कॉल करा", gu: "કૉલ કરો" },
  "overload.title": { en: "One thing at a time.", hi: "एक बार में एक चीज़।", mr: "एका वेळी एक गोष्ट.", gu: "એક સમયે એક વસ્તુ." },
  "low.on": { en: "Low-energy mode is on", hi: "लो-एनर्जी मोड चालू है", mr: "लो-एनर्जी मोड सुरू आहे", gu: "લો-એનર્જી મોડ ચાલુ છે" },
  hide: { en: "Hide", hi: "छिपाएं", mr: "लपवा", gu: "છુપાવો" },
  offline: { en: "You're offline. Your emergency toolkit still works.", hi: "आप ऑफ़लाइन हैं। आपकी आपातकालीन किट अभी भी काम करती है।", mr: "तुम्ही ऑफलाइन आहात. तुमची आणीबाणी किट अजूनही चालते.", gu: "તમે ઑફલાઇન છો. તમારી કટોકટી કિટ હજુ પણ કામ કરે છે." },
};

export function tr(lang: Lang, key: string): string {
  return D[key]?.[lang] ?? D[key]?.en ?? key;
}
