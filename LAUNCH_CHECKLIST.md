# Launch checklist

Everything here needs a human. The software cannot do it for you, and the admin **Overview → Launch readiness** panel reflects the technical items.

## 1. Must be done before any real user
- [ ] **Clinician review of the crisis flow and persona.** Read `src/safety/crisis.ts`, `src/safety/resources.ts`, `src/ai/persona.ts`, `src/safety/postgate.ts`. Have a licensed clinician approve or edit the imminent-risk response, the elevated-risk wording, and the persona rules.
- [ ] **Verify every helpline.** Call each number in `src/safety/resources.ts` (hours, language, who answers). Set `verified: true` per entry, then set `CRISIS_RESOURCES_VERIFIED=true`. Numbers change; set a recurring quarterly re-check. The AASRA, iCall, Vandrevala and other numbers shipped are *unverified placeholders*.
- [ ] **Legal review in India.** Privacy notice and terms (DPDP Act 2023: consent, notice, data principal rights, grievance officer, breach process, children), positioning as non-medical, Telemedicine / mental-health regulations as applicable, liability wording. Replace the plain-language summaries at `/privacy` and `/transparency` with counsel-approved text.
- [ ] **Red-team with real people.** Run `npm run eval` against the live model *and* have testers try: crisis in each language, indirect/passive ideation, coercion framed as "family pressure", dependence/exclusivity bait, diagnosis and medication bait, substance coaching, jailbreaks. Read every transcript.
- [ ] **Set secrets** (see `.env.example`), back up `DATA_ENCRYPTION_KEY` in a secrets manager (losing it = losing all user data), use SSL to Postgres, enable Postgres backups and test a restore.
- [ ] **Add your real Anthropic key**, run the eval, confirm models in `ANTHROPIC_MODEL` / `ANTHROPIC_CLASSIFIER_MODEL`. (Live model behaviour could not be tested in the build environment.)

## 2. Content and people
- [ ] **Approve knowledge items** (`/admin → Content`). Six drafts are seeded. The companion uses only items a *named* reviewer has approved.
- [ ] **Hindi, Marathi, Gujarati** UI strings and crisis text: have native speakers (ideally a clinician in each) review `src/lib/i18n.ts` and `src/safety/crisis.ts`.
- [ ] **Enable gated modules** one at a time in `/admin → Controls`, only after clinical sign-off (e.g. substance, eating, grief, sensitive topics).
- [ ] **Verify professionals** before listing anyone: check the registration number with the issuing body (RCI / NMC / state council). Nobody is listed until verified.
- [ ] **Appoint and train moderators** (role `moderator`); define the response SLA for held posts and for incidents; define an on-call escalation path for level-3 incidents.
- [ ] Review the 7 seeded community groups; add or remove as you see fit.

## 3. Operations
- [ ] Schedule `POST /api/cron/reminders` every 5 min with `Authorization: Bearer $CRON_SECRET`.
- [ ] VAPID keys (`npx web-push generate-vapid-keys`) for push reminders.
- [ ] Monitoring and alerting on 5xx rate, chat error rate, and AI provider failures (the app degrades safely and still shows resources).
- [ ] Rate-limit review for your expected traffic; put a CDN/WAF in front.
- [x] Motivation module is named **UDAAN RISE**. UDAAN is a free public-welfare project: no pricing, plans or billing exist in the product.
- [ ] Age: **18+ only** at launch (enforced at signup). Minors need a separate legal and clinical design.

## 4. Ongoing
- Re-run `npm run eval` after every model or persona change. Use `/admin → Controls` to switch the model or disable a module instantly (the rollback lever).
- Review content-free safety stats monthly. Re-verify helplines quarterly.
