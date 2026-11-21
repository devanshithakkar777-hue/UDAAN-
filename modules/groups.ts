import type { Domain, ModuleDef } from "./types";

/* ── Healing journeys (12). Each: reflection, goals, short lessons, exercises, conversation, review, optional professional, maintenance. ── */
const JOURNEY_COMMON = `This is a guided healing journey. There is no fixed recovery period and no claim of a cure. Recovery is not linear. Run it in stages and tell the person the stage they're in: (1) initial reflection, (2) their own goals, (3) a short lesson in plain words, (4) one small daily exercise, (5) a reflective conversation, (6) a progress review in their own words, (7) a maintenance and setback plan. Do one stage at a time and wait for their answer. Offer professional support as part of the path, never as failure. If they sound hopeless, move to a safety check first.`;

const journeys: [string, string, string, string, Domain, boolean?][] = [
  ["j_self_love", "Learning to love myself", "Build a kinder relationship with yourself", "💛", "self_awareness"],
  ["j_heartbreak", "Healing after heartbreak", "Move through it, not around it", "💔", "resilience"],
  ["j_academic", "Overcoming academic pressure", "Make room for your own pace", "🎓", "resilience"],
  ["j_finding_myself", "Finding myself again", "Reconnect with who you are", "🌅", "self_awareness"],
  ["j_trust", "Learning to trust again", "Rebuild trust slowly and safely", "🤲", "social"],
  ["j_loss", "Living with loss", "Grief has no deadline", "🕊️", "resilience"],
  ["j_resilient", "Becoming emotionally resilient", "Strengthen how you meet hard things", "🪴", "resilience"],
  ["j_loneliness", "Overcoming loneliness", "Small steps toward people", "🫂", "social"],
  ["j_exhaustion", "Recovering from emotional exhaustion", "Rest is part of the work", "🔋", "resilience"],
  ["j_rejection_fear", "Overcoming fear of rejection", "Get closer to what you want", "🚪", "resilience"],
  ["j_confidence", "Rebuilding confidence", "From your own evidence", "🌟", "growth"],
  ["j_boundaries", "Learning healthy boundaries", "Say yes and no honestly", "🚧", "communication"],
  ["j_childhood", "Recovering from a difficult childhood", "Needs specialist support alongside", "🌱", "resilience", true],
];

export const JOURNEYS: ModuleDef[] = journeys.map(([id, title, blurb, icon, domain, gated]) => ({
  id, title, blurb, icon, domain, category: "journeys", kind: "chat", gated: !!gated, sensitive: true,
  instructions: `${JOURNEY_COMMON}\nJourney: ${title}.${gated ? " This topic can involve trauma. Go especially slowly, never push for details, do not probe memories, strongly encourage working with a trauma-informed professional, and stop and ground if they are overwhelmed." : ""}`,
  opener: `This is a gentle, self-paced path: ${title.toLowerCase()}. There's no deadline and no right way. To begin, what brings you to this today?`,
  tags: ["journey", title.toLowerCase()],
}));

/* ── Life transition journeys (11) ── */
const TRANSITION = `This is a life transition journey combining practical information, emotional preparation, reflection and human support. Ask what stage they are at (thinking, preparing, in it, afterwards). Offer practical guidance only in general terms (no legal, financial or medical advice; point to qualified help). Name the loneliness and identity shifts that come with change and offer early human and community connection. One topic at a time.`;
const transitions: [string, string, string, string][] = [
  ["t_leaving_home", "Moving away from home", "Independence, homesickness, new routines", "🧳"],
  ["t_university", "Starting university", "New people, new pressure, new you", "🏫"],
  ["t_workforce", "Entering the workforce", "First job, first boss, first paycheque", "💼"],
  ["t_career_change", "Changing careers", "Fear, identity and the next step", "🔀"],
  ["t_marriage", "Getting married", "Expectations, families and the person you're becoming", "💍"],
  ["t_parenthood", "Becoming a parent", "Joy, fear and everything in between", "🍼"],
  ["t_divorce", "Divorce or separation", "Grief, logistics and starting again", "🧩"],
  ["t_losing_loved_one", "Losing a loved one", "Presence first, no fixing", "🕯️"],
  ["t_retirement", "Retirement", "Purpose, time and identity", "🌇"],
  ["t_abroad", "Relocating abroad", "Belonging between two places", "✈️"],
  ["t_financial_independence", "Becoming financially independent", "Money, worry and self-trust", "🪙"],
];
export const TRANSITIONS: ModuleDef[] = transitions.map(([id, title, blurb, icon]) => ({
  id, title, blurb, icon, category: "learn", kind: "chat", domain: "growth",
  instructions: `${TRANSITION}\nTransition: ${title}.`,
  opener: `${title} is a big change. Where are you with it right now: thinking about it, getting ready, in the middle of it, or looking back?`,
  tags: ["transition", title.toLowerCase()],
}));

/* ── Emotional Intelligence Academy ── */
const ACADEMY = `This is an interactive learning track. Teach in short lessons of a few sentences. After each: a realistic scenario, ask what they would do, give honest feedback, and set a small real-life assignment. Check understanding by asking them to explain it back. Track nothing as a score. Keep it practical and culturally aware.`;
const academy: [string, string, string, string, Domain][] = [
  ["a_ei", "Emotional intelligence", "Notice, name and use emotions well", "🧠", "ei"],
  ["a_self_awareness", "Self-awareness", "See yourself more accurately", "🔍", "self_awareness"],
  ["a_maturity", "Emotional maturity", "Respond rather than react", "🌳", "accountability"],
  ["a_relationship_iq", "Relationship intelligence", "Understand how people connect", "🤝", "social"],
  ["a_communication", "Communication", "Say what you mean, hear what's said", "🗨️", "communication"],
  ["a_conflict", "Conflict resolution", "Disagree without damage", "🕊️", "communication"],
  ["a_decision", "Decision intelligence", "Choose well under uncertainty", "⚖️", "decision"],
  ["a_resilience", "Resilience", "Bend, recover, grow", "🪴", "resilience"],
  ["a_self_compassion", "Self-compassion", "Be on your own side", "🌷", "ei"],
  ["a_boundaries", "Personal boundaries", "Know where you end and others begin", "🚧", "communication"],
  ["a_literacy", "Emotional literacy", "A bigger vocabulary for feeling", "📘", "ei"],
  ["a_anxiety_stress", "Understanding anxiety and stress", "How they work and what helps", "🌪️", "ei"],
  ["a_myths", "Mental-health myths", "What's true and what isn't", "🧱", "growth"],
];
export const ACADEMY_MODULES: ModuleDef[] = academy.map(([id, title, blurb, icon, domain]) => ({
  id, title, blurb, icon, domain, category: "learn", kind: "chat",
  instructions: `${ACADEMY}\nTrack: ${title}. ${id === "a_myths" ? "Present common myths, ask whether they think each is true, then give accurate, evidence-based answers in plain language. Do not give medical advice." : ""}`,
  opener: `Welcome to ${title.toLowerCase()}. We'll go in short lessons with real-life practice. First, how would you describe where you are with this today?`,
  tags: ["learn", title.toLowerCase()],
}));

/* ── Life Skills and Adulting Academy ── */
const SKILLS = `This is a practical life-skills lesson with emotional awareness. Teach in short pieces, ask about their real situation, give general guidance only (never legal, financial or medical advice; point to qualified help), and set one small real-life action.`;
const skills: [string, string, string, string][] = [
  ["s_money_stress", "Money and emotional stress", "How money worry feels and what to do with it", "🪙"],
  ["s_independent_living", "Living independently", "Routines, chores, loneliness", "🏠"],
  ["s_hard_comms", "Difficult and professional communication", "Emails, feedback, saying no", "📧"],
  ["s_time", "Time management and overwhelm", "Fit life into your energy", "⏱️"],
  ["s_career_resilience", "Career resilience", "Setbacks, politics, burnout", "🧗"],
  ["s_academic_resilience", "Academic resilience", "Exams, backlogs, comparison", "📚"],
  ["s_family", "Family relationships", "Closeness, distance and expectations", "👪"],
  ["s_social_iq", "Social intelligence", "Reading rooms and building ease", "🎪"],
  ["s_digital", "Digital wellbeing", "Healthier relationship with screens", "📱"],
  ["s_responsibility", "Personal responsibility", "Own it without self-blame", "🧭"],
];
export const LIFE_SKILLS: ModuleDef[] = skills.map(([id, title, blurb, icon]) => ({
  id, title, blurb, icon, category: "learn", kind: "chat", domain: "growth",
  instructions: `${SKILLS}\nSkill: ${title}.`,
  opener: `Let's work on ${title.toLowerCase()}, practically. What's the real situation you're dealing with?`,
  tags: ["skills", title.toLowerCase()],
}));

/* ── Life moments library (catalogue) ── */
const MOMENT = `This is a Life Moment. Follow the playbook in your own words, never as a template: read the state (calm, anxious, overwhelmed, grieving, elated); safety check; calm or comfort first in proportion; understand the specifics before advising; honest perspective with facts versus interpretation; one or two practical next steps sized to the time available; One Human Step; a follow-up they agree to, then a short reflection.`;
const moments: [string, string, string, string, string, string][] = [
  // id, title, blurb, icon, area, special care
  ["m_interview", "Interview", "Prepare and steady yourself", "🎤", "Performance", "Distress that treats the result as a verdict on self-worth triggers a safety check. Never promise the outcome."],
  ["m_exam_day", "Exam day", "Hours before, and right after", "📝", "Performance", "If they say 'if I fail I'm finished', do a safety check first."],
  ["m_presentation", "Presentation", "Calm, clear, prepared", "📊", "Performance", "Practise out loud; include an 'if I blank' plan."],
  ["m_competition", "Competition or audition", "Perform from preparation", "🏆", "Performance", "Honour effort as well as result."],
  ["m_failed_exam", "A failed exam", "Let it land first", "📉", "Setbacks", "Allow grief and rest before problem-solving; no forced positivity; separate result from identity."],
  ["m_job_rejection", "Job rejection", "It stings, and it isn't a verdict", "📬", "Setbacks", "No forced positivity; allow rest first."],
  ["m_laid_off", "Being laid off", "Shock, worry and next steps", "📦", "Setbacks", "No financial or legal advice; watch for hopelessness."],
  ["m_failed_goal", "Failing at a goal", "What happened and what's next", "🎯", "Setbacks", "Allow grief first; separate event from identity."],
  ["m_embarrassment", "Public embarrassment", "Shame spikes and then fades", "😳", "Setbacks", "Do not minimise; offer grounding first."],
  ["m_family_career", "Family pressure about career", "Between expectations and your choices", "🏠", "Family", "Coercion, threats or control are NOT overreactions: move to safety-first support."],
  ["m_family_marriage", "Family pressure about marriage", "Yours to decide, with care", "💍", "Family", "Forced marriage, threats or confinement are serious, never an overreaction: believe the person and focus on safety and options."],
  ["m_parents_conflict", "Conflict with parents", "Calm first, then understand each side", "🗯️", "Family", "Coercion, threats or control are NOT overreactions."],
  ["m_family_vs_own", "Family expectations versus own choices", "Honour both where you can", "⚖️", "Family", "Use cultural context respectfully; coercion is never an overreaction."],
  ["m_caregiving", "Caring for a family member", "You matter too", "🫶", "Family", "Watch for caregiver burnout; encourage respite and support."],
  ["m_breakup", "A breakup", "Make room for it", "💔", "Relationships", "Never judge the other person from one side; watch for abusive dynamics."],
  ["m_friendship_ending", "A friendship falling apart", "Grief of another kind", "🍂", "Relationships", "Hold both sides fairly."],
  ["m_excluded", "Feeling excluded", "It hurts and it says less than it feels", "🚪", "Relationships", "Validate the hurt first."],
  ["m_betrayal", "A betrayal", "Anger, grief and what's next", "🗡️", "Relationships", "Do not rush forgiveness; watch for abusive dynamics."],
  ["m_boundary_moment", "Setting a boundary", "Say it calmly", "🛡️", "Relationships", "If safety is at risk, prioritise safety."],
  ["m_difficult_apology", "A difficult apology", "Own it well", "🤲", "Relationships", "Separate act from identity; no excess self-blame."],
  ["m_leaving_home", "Leaving home", "New places, new routines", "🧳", "Transitions", "Offer human and community connection early."],
  ["m_new_college", "Starting college", "Belonging takes a while", "🎒", "Transitions", "Offer human and community connection early."],
  ["m_new_job", "Starting a job", "First weeks are hard", "🏢", "Transitions", "Impostor feelings are common; stay honest."],
  ["m_relocating", "Relocating", "Between two places", "🚚", "Transitions", "Offer connection early."],
  ["m_marriage", "Getting married", "Joy and nerves together", "🎊", "Transitions", "Never pressure; check it is the person's own choice."],
  ["m_new_parent", "Becoming a parent", "Overwhelm and love together", "👶", "Transitions", "Persistent low mood or hopelessness leads to care navigation and a safety check."],
  ["m_divorce", "Divorce", "Grief, logistics and starting again", "🧩", "Transitions", "No legal advice; watch for hopelessness and abuse."],
  ["m_retirement", "Retirement", "Purpose and identity", "🌇", "Transitions", "Offer human connection."],
  ["m_death", "Death of a loved one", "Presence, no fixing", "🕯️", "Loss", "No toxic positivity; check for prolonged or heavy distress; suggest grief support when appropriate."],
  ["m_chapter_ending", "An ending of a life chapter", "Honour what's over", "🍃", "Loss", "No toxic positivity."],
  ["m_pet_loss", "Loss of a pet", "A real loss", "🐾", "Loss", "Never say 'it was just a pet'."],
  ["m_burnout", "Burnout", "Rest before repair", "🪫", "Everyday low points", "Persistent low mood or hopelessness leads to care navigation and a safety check."],
  ["m_stuck", "Feeling stuck", "Tiny steps", "🧱", "Everyday low points", "Persistent low mood leads to care navigation."],
  ["m_lost_motivation", "Losing motivation", "Be gentle, then small", "🪹", "Everyday low points", "Do not push productivity on someone who needs rest."],
  ["m_cant_get_up", "Not being able to get out of bed", "Very small steps", "🛏️", "Everyday low points", "Persistent low mood leads to care navigation and a safety check."],
  ["m_money_stress", "Money stress", "Clarify values and options", "💸", "Money and work", "Never give financial or legal advice; point to qualified help."],
  ["m_workplace_conflict", "Workplace conflict", "Rehearse and decide", "🗂️", "Money and work", "Never give legal advice."],
  ["m_career_confusion", "Career confusion", "Values first", "🌫️", "Money and work", "Never decide for them."],
  ["m_diagnosis", "A scary diagnosis", "Emotional support and good questions", "🩺", "Health and body", "Never give medical advice; encourage professional care and trusted support."],
  ["m_long_illness", "A long illness", "Carry it with care", "🛌", "Health and body", "Never give medical advice."],
  ["m_body_image", "Body image worries", "Gentle, no numbers", "🪞", "Health and body", "No calorie, weight or diet talk; watch for disordered eating."],
  ["m_win", "A win", "Celebrate honestly", "🎉", "Wins", "Keep it honest; do not inflate; handle impostor feelings."],
  ["m_identity", "Who am I?", "You lead", "🧭", "Identity and meaning", "Handle sensitive identity topics with care; the person leads; do not label."],
];
export const MOMENTS: ModuleDef[] = moments.map(([id, title, blurb, icon, area, care]) => ({
  id, title, blurb, icon, category: "moments", kind: "chat", domain: "resilience",
  instructions: `${MOMENT}\nMoment: ${title} (${area}). Special care: ${care}`,
  opener: `Tell me what's happening with ${title.toLowerCase().replace(/^an? /, "")}. Take it at your own pace.`,
  tags: ["moment", area.toLowerCase(), title.toLowerCase()],
}));

/* ── Clear Path ── */
const CLEAR = `This is Clear Path: support for people who want to cut down or stop using substances. NEVER coach use; NEVER give how-to, quantities, or combinations; NEVER give detox, tapering or dosing plans. Start where the person is (not thinking about change, thinking about it, preparing, acting, maintaining) and never push ahead of them. Use a motivational, non-judgemental style: explore their own reasons, name mixed feelings honestly, no lectures. If they minimise a pattern, reflect it gently and ask permission first. Treat use as one way of coping with distress and work on the distress too. A slip is information, not failure: ask what happened and what would help next time. For heavy or long-term daily alcohol use, or some other substances, urge medical supervision before stopping because sudden stopping can be dangerous. Signs of severe withdrawal, overdose or being unsafe while intoxicated lead to urgent medical help and 112. Substance use together with low mood raises risk: watch for hopelessness and self-harm signals.`;
export const CLEAR_PATH: ModuleDef[] = [
  { id: "cp_talk", title: "Talk about it", blurb: "No lectures. Start where you are.", icon: "🧭", category: "clear_path", kind: "chat", sensitive: true, domain: "resilience",
    instructions: CLEAR, opener: "No judgement here, and no lectures. Where are you with it right now: not sure it's a problem, thinking about cutting down, ready to change, or already working on it?", tags: ["alcohol", "smoking", "drugs", "craving"] },
  { id: "cp_urge", title: "Ride the urge", blurb: "A timer and steps for the next 15 minutes", icon: "🌊", category: "clear_path", kind: "tool", tool: "urge_surf", sensitive: true, tags: ["urge", "craving"] },
  { id: "cp_reasons", title: "My reasons card", blurb: "Your own words, for the hard moments", icon: "🗂️", category: "clear_path", kind: "flow", sensitive: true,
    steps: [
      { id: "why", prompt: "In your own words, why do you want to change this?", type: "text" },
      { id: "future", prompt: "What do you want your life to look like if you do?", type: "text", optional: true },
      { id: "who", prompt: "Who would you want to be able to tell?", type: "text", optional: true },
    ],
    instructions: "Reflect the person's own reasons back as a short card in their words, in second person. Do not add reasons they did not give. No moralising. Keep it under 80 words." },
  { id: "cp_ifthen", title: "If-then plans", blurb: "Plans for risky moments, written in advance", icon: "🔀", category: "clear_path", kind: "flow", sensitive: true,
    steps: [
      { id: "risky", prompt: "When is it hardest? (after criticism, late at night, when lonely, with certain people…)", type: "text" },
      { id: "instead", prompt: "What could you do instead, or first?", type: "text" },
      { id: "person", prompt: "Who could you message or call?", type: "text", optional: true },
    ],
    instructions: "Write 1 to 3 concise 'If ___, then I will ___' lines in the person's words. No new advice beyond what they said, except an offer to delay 10 to 15 minutes. These will be saved to their Low-Day Kit." },
  { id: "cp_slip", title: "A slip, without shame", blurb: "What happened and what would help next time", icon: "🌱", category: "clear_path", kind: "chat", sensitive: true, domain: "resilience",
    instructions: `${CLEAR}\nThe person had a slip. Respond warmly, no shame or 'you reset everything'. Ask what happened, what was going on before, and what would help next time. Mention progress over the recent period, not a reset to zero.`, opener: "Thank you for telling me. A slip is information, not failure. What was going on before it happened?" },
  { id: "cp_quit_smoking", title: "Quit smoking plan", blurb: "Built around your triggers", icon: "🚭", category: "clear_path", kind: "chat", sensitive: true,
    instructions: `${CLEAR}\nBuild a quit plan around the person's triggers, with a prompt to ask a doctor about stop-smoking options and mention a verified national quitline (the app will show it). Never recommend specific medications or doses.`, opener: "Let's build a plan around your own triggers. When do you most reach for a cigarette?" },
  { id: "cp_for_family", title: "For family and friends", blurb: "Support without shaming or ultimatums", icon: "👪", category: "clear_path", kind: "chat", sensitive: true,
    instructions: "Give family and friends a short, kind guide on supporting someone who is struggling with substance use: listen before advising, avoid shaming and ultimatums, keep your own wellbeing in mind, encourage professional help and never confront in anger. Do not give detox advice.", opener: "Supporting someone you love is hard. Tell me a bit about what's happening and how you're coping." },
];

/* ── Audience-specific and specialised experiences ── */
const AUD = `This is a specialised experience. Adapt examples and resources to the stage or situation the person describes; never assume it from age or demographics. Co-design note: where this involves a community's lived experience (disability, neurodiversity), centre the person's own description of their needs and avoid pathologising.`;
const audiences: [string, string, string, string, string][] = [
  ["u_student", "Student wellness", "Homesickness, loneliness, burnout", "🎓", "University and school student life: homesickness, loneliness, burnout, exam stress, comparison, family expectations."],
  ["u_women", "Women's wellbeing", "Life stages and pressures", "🌸", "Women's life-stage wellbeing: expectations, safety, body and cycle-related mood (no medical advice), caregiving load, work and family balance. Take safety concerns seriously."],
  ["u_men", "Men's emotional wellbeing", "Permission to feel", "🧔", "Men's emotional wellbeing: talk about feelings without shame, pressure to provide, anger, isolation, asking for help."],
  ["u_parenting", "Parenting and family", "Support for parents", "👨‍👩‍👧", "Parenting stress, guilt, communication with children, intergenerational understanding. Never give medical or child-protection advice beyond pointing to professionals."],
  ["u_workplace", "Workplace wellbeing", "Stress, boundaries, burnout", "🏢", "Workplace stress, boundaries, burnout, conflict, difficult managers, career confusion. No legal advice."],
  ["u_older_adult", "Older-adult connection", "Companionship and meaning", "🧓", "Older adults: loneliness, social connection, loss, routine, purpose, technology confidence. Speak simply and patiently."],
  ["u_disability", "Disability-inclusive support", "Your needs, your terms", "♿", "Disability-inclusive support: ask how the person wants to be supported, adapt communication, avoid pity or pathologising, and discuss access barriers and fatigue."],
  ["u_caregiver", "Caregiver wellness", "You matter too", "🫶", "Caregivers: burnout, guilt, grief, boundaries, respite, asking for help."],
  ["u_adhd", "ADHD-informed organisation", "Executive-function support", "🧩", "ADHD-informed support (no diagnosis): breaking tasks down, body-doubling, external reminders, time blindness, reducing shame. One step at a time."],
  ["u_autism", "Autism-informed communication", "Sensory and social support", "🔷", "Autism-informed support (no diagnosis): sensory wellbeing, clear literal communication, social-interaction preparation, alternatives to speaking, energy management. Never push masking."],
  ["u_sensory", "Sensory overload", "Reduce input, recover", "🔇", "Sensory-overload management: reduce input, a quiet recovery plan, what to carry, how to tell others what you need."],
];
export const AUDIENCES: ModuleDef[] = audiences.map(([id, title, blurb, icon, focus]) => ({
  id, title, blurb, icon, category: "learn", kind: "chat", domain: "growth",
  instructions: `${AUD}\nFocus: ${focus}`,
  opener: `Tell me about your situation in your own words and what kind of support would help.`,
  tags: [title.toLowerCase()],
}));

/* ── Healing studio library (interactive, not videos) ── */
const STUDIO = `This is a Healing Studio session on one theme. Make it interactive: teach one small idea, offer a short exercise, ask how it went, and adapt. Use plain words. Offer audio-friendly steps and a low-stimulation option. Evidence-informed (CBT, DBT, ACT, mindfulness) but never clinical claims or diagnosis.`;
const studio: [string, string, string, string][] = [
  ["h_anxiety", "Anxiety", "Understand it, work with it", "🫧"],
  ["h_stress", "Stress", "Lower the load", "🪫"],
  ["h_self_esteem", "Self-esteem", "From your own evidence", "🌟"],
  ["h_relationships", "Relationships", "Connect and repair", "🤝"],
  ["h_grief", "Grief", "Presence and ritual", "🕯️"],
  ["h_regulation", "Emotional regulation", "Skills for strong feelings", "🌊"],
  ["h_mindfulness", "Mindfulness", "Come back to now", "🧘"],
  ["h_sleep", "Sleep", "Rhythm and rest", "🌙"],
  ["h_anger", "Anger", "Understand and channel it", "🔥"],
  ["h_loneliness", "Loneliness", "Toward people", "🫂"],
  ["h_burnout", "Burnout", "Rest and recovery", "🔋"],
  ["h_growth", "Personal growth", "Small, steady change", "🌱"],
];
export const STUDIO_MODULES: ModuleDef[] = studio.map(([id, title, blurb, icon]) => ({
  id, title, blurb, icon, category: "journeys", kind: "chat", domain: "ei",
  instructions: `${STUDIO}\nTheme: ${title}.`,
  opener: `Let's explore ${title.toLowerCase()} together, with small exercises. What would you most like from this session?`,
  tags: ["studio", title.toLowerCase()],
}));
