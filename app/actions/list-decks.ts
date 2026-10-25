import { defineAction } from "@agent-native/core/action";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../server/db";
import { scope } from "../server/lib/decks";
export default defineAction({ description: "List your private ProofDeck projects, newest first.", schema: z.object({}), http: { method: "GET" }, readOnly: true,
  run: async (_args, ctx) => ({ decks: await getDb().select({ id: schema.decks.id, name: schema.decks.name, revision: schema.decks.revision, updatedAt: schema.decks.updatedAt }).from(schema.decks).where(scope(ctx)).orderBy(desc(schema.decks.updatedAt)).limit(100) }) });
