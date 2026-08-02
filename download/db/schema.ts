// ShiftGrid — Drizzle ORM schema for Postgres (Neon-compatible)
// Ported 1:1 from the Prisma schema used in development.
// Drop this file into your production project at `db/schema.ts`.
//
// Pair with the `neon-http` adapter for simple queries or `neon-serverless`
// for transactions / WebSocket access — both first-class Neon integrations.

import { relations } from "drizzle-orm";
import {
  pgTable, uuid, text, varchar, integer, real, boolean,
  timestamp, date, jsonb, pgEnum, uniqueIndex, primaryKey,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["super_admin", "hospital_admin", "staff"]);
export const offerTypeEnum = pgEnum("offer_type", ["locum", "permanent"]);
export const offerStatusEnum = pgEnum("offer_status", ["draft", "published", "closed", "filled"]);
export const visibilityEnum = pgEnum("visibility", ["public", "internal"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "applied", "under_review", "shortlisted", "offered", "accepted", "declined", "withdrawn",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────────────────────────────

export const hospitals = pgTable("hospitals", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  address: text("address"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("staff"),
  hospitalId: uuid("hospital_id").references(() => hospitals.id, { onDelete: "set null" }),
  specialty: text("specialty"),
  experienceYears: integer("experience_years"),
  resumeUrl: text("resume_url"),
  availability: text("availability"),
  bio: text("bio"),
  location: text("location"),
  preferredTypes: text("preferred_types"), // comma-separated "locum,permanent"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  hospitalId: uuid("hospital_id").notNull().references(() => hospitals.id, { onDelete: "cascade" }),
  createdById: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: offerTypeEnum("type").notNull(),
  title: text("title").notNull(),
  specialty: text("specialty"),
  description: text("description"),
  requirements: text("requirements"), // JSON-encoded string[]
  location: text("location"),
  status: offerStatusEnum("status").notNull().default("draft"),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  deadline: timestamp("deadline", { withTimezone: true }),

  // Locum-only
  shiftStart: timestamp("shift_start", { withTimezone: true }),
  shiftEnd: timestamp("shift_end", { withTimezone: true }),
  rate: real("rate"),
  rateUnit: text("rate_unit"),
  urgent: boolean("urgent").default(false).notNull(),

  // Permanent-only
  employmentType: text("employment_type"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  benefits: text("benefits"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull().default("applied"),
  coverNote: text("cover_note"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("applications_offer_user_unique").on(table.offerId, table.userId),
]);

export const credentials = pgTable("credentials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // license | certification | resume | id
  name: text("name").notNull(),
  fileUrl: text("file_url").notNull(),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  payload: text("payload"), // JSON
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const savedOffers = pgTable("saved_offers", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.offerId] }),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id").notNull().references(() => offers.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  members: many(users),
  offers: many(offers),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  hospital: one(hospitals, { fields: [users.hospitalId], references: [hospitals.id] }),
  applications: many(applications),
  credentials: many(credentials),
  sentMessages: many(messages, { relationName: "MessageSender" }),
  receivedMessages: many(messages, { relationName: "MessageRecipient" }),
  notifications: many(notifications),
  savedOffers: many(savedOffers),
  offersCreated: many(offers, { relationName: "OfferCreator" }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  hospital: one(hospitals, { fields: [offers.hospitalId], references: [hospitals.id] }),
  createdBy: one(users, { fields: [offers.createdById], references: [users.id], relationName: "OfferCreator" }),
  applications: many(applications),
  savedBy: many(savedOffers),
  messages: many(messages),
  auditEvents: many(auditEvents),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  offer: one(offers, { fields: [applications.offerId], references: [offers.id] }),
  user: one(users, { fields: [applications.userId], references: [users.id] }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  user: one(users, { fields: [credentials.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  offer: one(offers, { fields: [messages.offerId], references: [offers.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "MessageSender" }),
  recipient: one(users, { fields: [messages.recipientId], references: [users.id], relationName: "MessageRecipient" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const savedOffersRelations = relations(savedOffers, ({ one }) => ({
  user: one(users, { fields: [savedOffers.userId], references: [users.id] }),
  offer: one(offers, { fields: [savedOffers.offerId], references: [offers.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  offer: one(offers, { fields: [auditEvents.offerId], references: [offers.id] }),
  actor: one(users, { fields: [auditEvents.actorId], references: [users.id] }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Type exports (for use in API routes / server actions)
// ─────────────────────────────────────────────────────────────────────────────

export type Hospital = typeof hospitals.$inferSelect;
export type NewHospital = typeof hospitals.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type SavedOffer = typeof savedOffers.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
