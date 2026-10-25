import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { getDeck } from "../server/lib/decks";
export default defineAction({ description: "Read a private deck's source, current wording, glossary and proposed edits. Read before proposing changes.", schema: z.object({ id: z.string().describe("Deck UUID") }), http: { method: "GET" }, readOnly: true,
  run: async ({ id }, ctx) => { const { ownerEmail: _owner, orgId: _org, ...deck } = await getDeck(id, ctx); return deck; } });
