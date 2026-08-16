import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "active",
  "won",
  "lost",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "created",
  "note",
  "stage_change",
  "status_change",
]);

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  jobTitle: text("job_title"),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  stage: leadStageEnum("stage").notNull().default("new"),
  status: leadStatusEnum("status").notNull().default("active"),
  value: numeric("value", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  source: text("source"),
  owner: text("owner"),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const leadActivities = pgTable("lead_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull().default("note"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  leads: many(leads),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [leads.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  activities: many(leadActivities),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
}));
