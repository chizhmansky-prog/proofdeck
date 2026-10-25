import { pgTable, text, integer, jsonb, index } from "drizzle-orm/pg-core";
import type { DeckContent } from "../../shared/deck";

export const decks = pgTable("proofdeck_decks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  revision: integer("revision").notNull().default(1),
  approvedRevision: integer("approved_revision"),
  content: jsonb("content").$type<DeckContent>().notNull(),
  updatedAt: text("updated_at").notNull(),
}, t => [index("proofdeck_owner_updated").on(t.ownerEmail, t.updatedAt)]);

export const revisions = pgTable("proofdeck_revisions", {
  id: text("id").primaryKey(),
  deckId: text("deck_id").notNull().references(() => decks.id),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  revision: integer("revision").notNull(),
  summary: text("summary").notNull(),
  content: jsonb("content").$type<DeckContent>().notNull(),
  createdAt: text("created_at").notNull(),
}, t => [index("proofdeck_history").on(t.deckId, t.revision)]);
