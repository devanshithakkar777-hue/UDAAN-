import {
  pgTable, uuid, text, timestamp, integer, smallint, boolean, jsonb, date, index, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const userRef = () => uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" });

/* ───────────────────────── Identity ───────────────────────── */

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull(),
  emailLower: text("email_lower").notNull(),
  passwordHash: text("password_hash").notNull(),
  recoveryHash: text("recovery_hash"),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"), // user | professional | moderator | admin | institution_admin
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  pinHash: text("pin_hash"),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
}, (t) => [uniqueIndex("users_email_lower_uq").on(t.emailLower)]);

export const sessions = pgTable("sessions", {
  id: id(),
  userId: userRef(),
  tokenHash: text("token_hash").notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
}, (t) => [uniqueIndex("sessions_token_uq").on(t.tokenHash), index("sessions_user_idx").on(t.userId)]);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  consentVersion: text("consent_version"),
  consentedAt: timestamp("consented_at", { withTimezone: true }),
  tone: text("tone").notNull().default("balanced"), // gentle | balanced | direct
  style: text("style").notNull().default("guide"), // listener | guide | coach | companion
  askListenOrHelp: boolean("ask_listen_or_help").notNull().default(true),
  language: text("language").notNull().default("en"), // en | hi | mr | gu
  stage: text("stage"), // student | early_career | parent | older_adult | caregiver | other (user-stated only)
  memoryEnabled: boolean("memory_enabled").notNull().default(true),
  sensitiveMemoryEnabled: boolean("sensitive_memory_enabled").notNull().default(false),
  discreetMode: boolean("discreet_mode").notNull().default(false),
  discreetName: text("discreet_name"),
  lowEnergyMode: boolean("low_energy_mode").notNull().default(false),
  dailyReflection: boolean("daily_reflection").notNull().default(false),
  seasonalSupport: boolean("seasonal_support").notNull().default(false),
  independentDays: boolean("independent_days").notNull().default(false),
  showDayCounter: boolean("show_day_counter").notNull().default(false),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  trainingConsent: boolean("training_consent").notNull().default(false),
  researchConsent: boolean("research_consent").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consents = pgTable("consents", {
  id: id(),
  userId: userRef(),
  kind: text("kind").notNull(),
  granted: boolean("granted").notNull(),
  version: text("version"),
  createdAt: createdAt(),
}, (t) => [index("consents_user_idx").on(t.userId)]);

/* ───────────────────────── Conversations and memory ───────────────────────── */

export const conversations = pgTable("conversations", {
  id: id(),
  userId: userRef(),
  mode: text("mode").notNull().default("talk"), // module id
  titleEnc: text("title_enc"),
  maxRisk: smallint("max_risk").notNull().default(1),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (t) => [index("conv_user_idx").on(t.userId, t.updatedAt)]);

export const messages = pgTable("messages", {
  id: id(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: userRef(),
  role: text("role").notNull(), // user | assistant | event
  contentEnc: text("content_enc").notNull(),
  reasoningEnc: text("reasoning_enc"),
  safetyLevel: smallint("safety_level").notNull().default(1),
  createdAt: createdAt(),
}, (t) => [index("msg_conv_idx").on(t.conversationId, t.createdAt)]);

export const memories = pgTable("memories", {
  id: id(),
  userId: userRef(),
  kind: text("kind").notNull(), // fact | person | trigger | goal | coping | value | event | preference | pattern
  contentEnc: text("content_enc").notNull(),
  sensitive: boolean("sensitive").notNull().default(false),
  pinned: boolean("pinned").notNull().default(false),
  status: text("status").notNull().default("active"), // active | proposed | archived
  source: text("source").notNull().default("user"), // user | companion
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (t) => [index("mem_user_idx").on(t.userId, t.status)]);

/* ───────────────────────── Tracking and reflection ───────────────────────── */

export const moodEntries = pgTable("mood_entries", {
  id: id(),
  userId: userRef(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  valence: smallint("valence").notNull(), // 1..5
  energy: smallint("energy"),
  anxiety: smallint("anxiety"),
  intensity: smallint("intensity"),
  emotionsEnc: text("emotions_enc"),
  triggersEnc: text("triggers_enc"),
  noteEnc: text("note_enc"),
}, (t) => [index("mood_user_idx").on(t.userId, t.at)]);

export const journalEntries = pgTable("journal_entries", {
  id: id(),
  userId: userRef(),
  kind: text("kind").notNull().default("journal"), // journal | safe_space | unsent | gratitude | reflection | wisdom | timeline
  titleEnc: text("title_enc"),
  bodyEnc: text("body_enc").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => [index("journal_user_idx").on(t.userId, t.createdAt)]);

export const sleepEntries = pgTable("sleep_entries", {
  id: id(),
  userId: userRef(),
  day: date("day").notNull(),
  bedtime: text("bedtime"),
  wake: text("wake"),
  quality: smallint("quality"),
  noteEnc: text("note_enc"),
}, (t) => [uniqueIndex("sleep_user_day_uq").on(t.userId, t.day)]);

export const eatingNotes = pgTable("eating_notes", {
  id: id(),
  userId: userRef(),
  day: date("day").notNull(),
  meals: smallint("meals"), // count only; never calories or weight
  energy: smallint("energy"),
  noteEnc: text("note_enc"),
}, (t) => [uniqueIndex("eat_user_day_uq").on(t.userId, t.day)]);

export const wearableEntries = pgTable("wearable_entries", {
  id: id(),
  userId: userRef(),
  day: date("day").notNull(),
  sleepMinutes: integer("sleep_minutes"),
  steps: integer("steps"),
  restingHr: integer("resting_hr"),
  activeMinutes: integer("active_minutes"),
  source: text("source").notNull().default("manual"),
}, (t) => [uniqueIndex("wear_user_day_uq").on(t.userId, t.day)]);

export const strengths = pgTable("strengths", {
  id: id(),
  userId: userRef(),
  kind: text("kind").notNull(), // small_win | receipt | milestone | feedback | lesson
  textEnc: text("text_enc").notNull(),
  domain: text("domain"), // growth map domain
  createdAt: createdAt(),
}, (t) => [index("strength_user_idx").on(t.userId, t.createdAt)]);

export const kitItems = pgTable("kit_items", {
  id: id(),
  userId: userRef(),
  section: text("section").notNull(), // helps | people | avoid | reminders | if_then | reasons
  textEnc: text("text_enc").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index("kit_user_idx").on(t.userId, t.section)]);

export const safetyPlans = pgTable("safety_plans", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  dataEnc: text("data_enc").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trustedContacts = pgTable("trusted_contacts", {
  id: id(),
  userId: userRef(),
  nameEnc: text("name_enc").notNull(),
  relationEnc: text("relation_enc"),
  phoneEnc: text("phone_enc"),
  role: text("role").notNull().default("friend"), // friend | family | mentor | therapist | caregiver
  shareLevel: text("share_level").notNull().default("none"), // none | rough_week_flag
  createdAt: createdAt(),
}, (t) => [index("tc_user_idx").on(t.userId)]);

export const goals = pgTable("goals", {
  id: id(),
  userId: userRef(),
  titleEnc: text("title_enc").notNull(),
  stepsEnc: text("steps_enc"),
  status: text("status").notNull().default("active"), // active | paused | done
  createdAt: createdAt(),
  doneAt: timestamp("done_at", { withTimezone: true }),
}, (t) => [index("goals_user_idx").on(t.userId)]);

export const substanceLogs = pgTable("substance_logs", {
  id: id(),
  userId: userRef(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  kind: text("kind").notNull(), // urge | used | resisted
  intensity: smallint("intensity"),
  triggerEnc: text("trigger_enc"),
  noteEnc: text("note_enc"),
}, (t) => [index("sub_user_idx").on(t.userId, t.at)]);

export const userJourneys = pgTable("user_journeys", {
  id: id(),
  userId: userRef(),
  journeyId: text("journey_id").notNull(),
  step: integer("step").notNull().default(0),
  reflectionsEnc: text("reflections_enc"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [uniqueIndex("uj_user_journey_uq").on(t.userId, t.journeyId)]);

export const moduleRuns = pgTable("module_runs", {
  id: id(),
  userId: userRef(),
  moduleId: text("module_id").notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  summaryEnc: text("summary_enc"),
  outcome: jsonb("outcome").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("runs_user_idx").on(t.userId, t.createdAt)]);

export const growthEvents = pgTable("growth_events", {
  id: id(),
  userId: userRef(),
  domain: text("domain").notNull(), // eight Growth Map domains
  kind: text("kind").notNull(), // explored | practised | independent | reflection
  noteEnc: text("note_enc"),
  createdAt: createdAt(),
}, (t) => [index("growth_user_idx").on(t.userId, t.createdAt)]);

export const selfRatings = pgTable("self_ratings", {
  id: id(),
  userId: userRef(),
  dimension: text("dimension").notNull(), // eight independence dimensions
  value: smallint("value").notNull(), // 1..5
  createdAt: createdAt(),
}, (t) => [index("rating_user_idx").on(t.userId, t.dimension, t.createdAt)]);

export const reminders = pgTable("reminders", {
  id: id(),
  userId: userRef(),
  kind: text("kind").notNull(), // check_in | event_followup | wind_down | morning | daily_reflection | seasonal
  textEnc: text("text_enc"),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("rem_due_idx").on(t.dueAt)]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: id(),
  userId: userRef(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("push_endpoint_uq").on(t.endpoint)]);

/* ───────────────────────── Safety and governance ───────────────────────── */

export const safetyEvents = pgTable("safety_events", {
  id: id(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  conversationId: uuid("conversation_id"),
  level: smallint("level").notNull(),
  signals: text("signals").array().notNull().default(sql`ARRAY[]::text[]`),
  stage: text("stage").notNull(), // pre | post | trajectory
  action: text("action").notNull(),
  createdAt: createdAt(),
}, (t) => [index("safety_level_idx").on(t.level, t.createdAt)]);

export const incidents = pgTable("incidents", {
  id: id(),
  safetyEventId: uuid("safety_event_id").references(() => safetyEvents.id, { onDelete: "set null" }),
  status: text("status").notNull().default("open"), // open | reviewing | closed
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: createdAt(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  ipHash: text("ip_hash"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index("audit_user_idx").on(t.userId, t.createdAt)]);

export const aiSettings = pgTable("ai_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.key, t.windowStart] })]);

export const contentItems = pgTable("content_items", {
  id: id(),
  slug: text("slug").notNull(),
  type: text("type").notNull(), // general_education | self_help | professional_guidance | emergency_protocol
  title: text("title").notNull(),
  bodyMd: text("body_md").notNull(),
  topics: text("topics").array().notNull().default(sql`ARRAY[]::text[]`),
  source: text("source").notNull(),
  audience: text("audience"),
  limits: text("limits"),
  reviewer: text("reviewer"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  status: text("status").notNull().default("draft"), // draft | approved | retired
  createdAt: createdAt(),
}, (t) => [uniqueIndex("content_slug_uq").on(t.slug)]);

/* ───────────────────────── Professional care ───────────────────────── */

export const professionals = pgTable("professionals", {
  id: id(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  credentialType: text("credential_type").notNull(), // counsellor | clinical_psychologist | psychiatrist | other
  registrationBody: text("registration_body"),
  registrationNo: text("registration_no"),
  qualifications: text("qualifications"),
  languages: text("languages").array().notNull().default(sql`ARRAY[]::text[]`),
  modes: text("modes").array().notNull().default(sql`ARRAY[]::text[]`), // online | in_person | group | family
  city: text("city"),
  specialties: text("specialties").array().notNull().default(sql`ARRAY[]::text[]`),
  feeInr: integer("fee_inr"),
  bio: text("bio"),
  contactUrl: text("contact_url"),
  status: text("status").notNull().default("pending"), // pending | verified | rejected | suspended
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: uuid("verified_by"),
  createdAt: createdAt(),
}, (t) => [index("pro_status_idx").on(t.status)]);

export const bookings = pgTable("bookings", {
  id: id(),
  userId: userRef(),
  professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  slot: timestamp("slot", { withTimezone: true }),
  mode: text("mode").notNull().default("online"),
  status: text("status").notNull().default("requested"), // requested | confirmed | completed | cancelled | declined
  messageEnc: text("message_enc"),
  prepSummaryEnc: text("prep_summary_enc"),
  createdAt: createdAt(),
}, (t) => [index("book_user_idx").on(t.userId), index("book_pro_idx").on(t.professionalId)]);

export const shareGrants = pgTable("share_grants", {
  id: id(),
  userId: userRef(),
  professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  scope: text("scope").array().notNull(), // mood_summary | sleep_summary | assigned_exercises | prep_summary | journal_excerpt
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (t) => [index("share_user_idx").on(t.userId)]);

export const assignedExercises = pgTable("assigned_exercises", {
  id: id(),
  professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  userId: userRef(),
  titleEnc: text("title_enc").notNull(),
  descriptionEnc: text("description_enc"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  doneAt: timestamp("done_at", { withTimezone: true }),
  userNoteEnc: text("user_note_enc"),
  createdAt: createdAt(),
}, (t) => [index("assigned_user_idx").on(t.userId)]);

/* ───────────────────────── Community and family ───────────────────────── */

export const communityGroups = pgTable("community_groups", {
  id: id(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  kind: text("kind").notNull().default("peer"), // peer | student | grief | relationship | caregiver | workshop
  language: text("language").notNull().default("en"),
  createdAt: createdAt(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (t) => [uniqueIndex("group_slug_uq").on(t.slug)]);

export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => communityGroups.id, { onDelete: "cascade" }),
  userId: userRef(),
  handle: text("handle").notNull(),
  role: text("role").notNull().default("member"), // member | moderator
  joinedAt: createdAt(),
  mutedUntil: timestamp("muted_until", { withTimezone: true }),
}, (t) => [primaryKey({ columns: [t.groupId, t.userId] })]);

export const communityPosts = pgTable("community_posts", {
  id: id(),
  groupId: uuid("group_id").notNull().references(() => communityGroups.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  handle: text("handle").notNull(),
  parentId: uuid("parent_id"),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"), // visible | held | removed
  riskLevel: smallint("risk_level").notNull().default(1),
  createdAt: createdAt(),
}, (t) => [index("post_group_idx").on(t.groupId, t.createdAt)]);

export const communityReports = pgTable("community_reports", {
  id: id(),
  postId: uuid("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  createdAt: createdAt(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by"),
  resolution: text("resolution"),
});

export const stories = pgTable("stories", {
  id: id(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  topic: text("topic"),
  status: text("status").notNull().default("pending"), // pending | published | rejected
  createdAt: createdAt(),
  reviewedBy: uuid("reviewed_by"),
}, (t) => [index("story_status_idx").on(t.status)]);

export const familySessions = pgTable("family_sessions", {
  id: id(),
  creatorId: userRef2("creator_id"),
  inviteCode: text("invite_code").notNull(),
  topic: text("topic"),
  status: text("status").notNull().default("open"), // open | active | closed
  createdAt: createdAt(),
}, (t) => [uniqueIndex("fam_code_uq").on(t.inviteCode)]);

export const familyParticipants = pgTable("family_participants", {
  sessionId: uuid("session_id").notNull().references(() => familySessions.id, { onDelete: "cascade" }),
  userId: userRef(),
  privateNotesEnc: text("private_notes_enc"),
  sharedStatementEnc: text("shared_statement_enc"),
  sharedAt: timestamp("shared_at", { withTimezone: true }),
  consentedAt: timestamp("consented_at", { withTimezone: true }),
  joinedAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.sessionId, t.userId] })]);

function userRef2(name: string) {
  return uuid(name).notNull().references(() => users.id, { onDelete: "cascade" });
}

/* ───────────────────────── Institutions (aggregate-only) ───────────────────────── */

export const institutions = pgTable("institutions", {
  id: id(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // university | employer | school | ngo | clinic
  joinCode: text("join_code").notNull(),
  minCohort: integer("min_cohort").notNull().default(20),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("inst_code_uq").on(t.joinCode)]);

export const institutionMembers = pgTable("institution_members", {
  institutionId: uuid("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),
  userId: userRef(),
  role: text("role").notNull().default("member"), // member | admin
  joinedAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.institutionId, t.userId] })]);

