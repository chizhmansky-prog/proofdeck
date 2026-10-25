import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../server/db";
import { getDeck } from "../server/lib/decks";
export default defineAction({ description: "Read the latest 50 revision summaries of an authorized deck.", schema: z.object({ id: z.string().describe("Deck UUID") }), http: { method: "GET" }, readOnly: true,
  run: async ({ id }, ctx) => { await getDeck(id, ctx); const r = schema.revisions; return { revisions: await getDb().select({ revision: r.revision, summary: r.summary, createdAt: r.createdAt }).from(r).where(eq(r.deckId, id)).orderBy(desc(r.revision)).limit(50) }; } });
