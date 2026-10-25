import { runMigrations } from "@agent-native/core/db";
export default runMigrations([{ version: 1, name: "proofdeck-private-decks-and-history", sql: `
CREATE TABLE IF NOT EXISTS proofdeck_decks (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_email TEXT NOT NULL, org_id TEXT,
 revision INTEGER NOT NULL DEFAULT 1, approved_revision INTEGER,
 content JSONB NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS proofdeck_owner_updated ON proofdeck_decks(owner_email, updated_at);
CREATE TABLE IF NOT EXISTS proofdeck_revisions (
 id TEXT PRIMARY KEY, deck_id TEXT NOT NULL REFERENCES proofdeck_decks(id),
 owner_email TEXT NOT NULL, org_id TEXT, revision INTEGER NOT NULL,
 summary TEXT NOT NULL, content JSONB NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(deck_id, revision)
);
CREATE INDEX IF NOT EXISTS proofdeck_history ON proofdeck_revisions(deck_id, revision);
` }], { table: "proofdeck_app_migrations" });
