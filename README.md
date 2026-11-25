# UDAAN — Find Your Wings

[![Live demo](https://img.shields.io/badge/Live%20demo-udaan--7alw.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://udaan-7alw.onrender.com)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

> **Try it live:** <https://udaan-7alw.onrender.com>. The demo runs on free hosting and may take about 50 seconds to wake up on the first visit.

An AI personal-growth and emotional-wellness companion. *Comfort when needed, challenge when necessary, encourage always.* It is built to make people need it less over time, not more.

Mobile-first PWA · Next.js 16 (App Router) · TypeScript · Postgres 16 · Claude via the Anthropic API.

## Quick start (development)

```bash
npm install
cp .env.example .env.local          # fill in DATABASE_URL, DATA_ENCRYPTION_KEY, IP_HASH_SALT, CRON_SECRET
                                    # for local work without an API key set AI_PROVIDER=mock
npm run db:migrate && npm run db:seed
npm run dev                         # http://localhost:3000
```

Generate secrets: `openssl rand -base64 32` (DATA_ENCRYPTION_KEY), `openssl rand -hex 16` (IP_HASH_SALT, CRON_SECRET).
Create the first admin: `npm run admin:create -- you@example.com 'a-strong-password'` (or set `ADMIN_BOOTSTRAP_EMAIL` before signing up).

## Production

```bash
docker compose up --build            # local production-like run with Postgres
```
Or deploy the Dockerfile anywhere that runs containers, with a managed Postgres 16 (`?sslmode=require`).
Set every variable in `.env.example`. `AI_PROVIDER=mock` is refused in production by design.

**Reminders:** schedule `POST /api/cron/reminders` every 5 minutes with header `Authorization: Bearer $CRON_SECRET`.
**Backups:** back up Postgres *and* `DATA_ENCRYPTION_KEY`. Without the key, every encrypted field is unrecoverable.

## Commands

| | |
|---|---|
| `npm test` | unit tests (safety rules, post-gate, encryption) |
| `npm run typecheck` | TypeScript |
| `bash scripts/smoke.sh http://localhost:3000` | 54-check integration smoke test against a running dev server |
| `APP_URL=http://localhost:3000 npm run eval` | behaviour evaluation: crisis, honesty, coercion, dependence, limits → `eval-report.md` for human review |

## Architecture in brief

- **Companion:** `ai/` — persona prompt built per turn (tone, style, language, memory, approved knowledge, module instructions), streaming chat, memory proposals, "why did you say that".
- **Safety layer (independent of the model):** `safety/` — multilingual rules (EN/HI/Hinglish/MR/GU) as a floor, an LLM classifier on top (never lowers the rules' result), trajectory escalation across a conversation, a static no-model response at imminent risk, resources always appended in code at elevated risk and for abuse/medical flags, a post-generation gate (no diagnosis, doses, outcome promises, method detail, substance coaching) with regenerate-then-fallback, and content-free logging. The `/safe` page is static, public, works offline, and shows personal contacts from the device.
- **Privacy:** every user-content field is AES-256-GCM encrypted with a per-user key derived from `DATA_ENCRYPTION_KEY`; hashed session tokens; recovery code (no email dependency); rate limiting in Postgres; origin checks; audit log; full export and real deletion.
- **Modules:** `modules/` — ~150 config-driven guided tools (chat, step flows, interactive tools). Sensitive/gated modules stay hidden until an admin enables them after clinician review.
- **Care:** safety plan, trusted contacts, Low-Day Kit, verified-professional directory with consent-scoped sharing, moderated anonymous communities (no DMs), Two Perspectives family sessions, aggregate-only institution dashboard (minimum cohort + small-cell suppression).
- **Consoles:** `/admin` (content approval with named reviewer, professional verification, moderation, incidents, runtime model/module controls, users, audit), `/pro`, `/org`.

## Before real users

Read **LAUNCH_CHECKLIST.md**. The code is complete; several things *must* be done by people (clinical review, verifying helplines, legal review, translation review, red-teaming) and the app is honest in the admin Overview about what is still unverified.
