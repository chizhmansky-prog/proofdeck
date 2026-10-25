import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";
import { parseCsv, type DeckContent } from "../shared/deck";
import { getDb, schema } from "../server/db";
import { owner } from "../server/lib/decks";
export default defineAction({ description: "Import a new private deck from UTF-8 CSV: id,name,source,text. Stable unique IDs; 1–100 cards; no existing deck is replaced.", schema: z.object({ name: z.string().trim().min(1).max(100).describe("Deck name"), language: z.string().trim().min(1).max(60).describe("Target language, such as German"), csv: z.string().max(1_000_000).describe("CSV text with id,name,source,text headers") }),
  link: ({ result }) => ({ url: buildDeepLink({ view: "decks", to: `/decks?id=${result.id}` }), label: "Open deck" }),
  run: async ({ name, language, csv }, ctx) => {
    let cards; try { cards = parseCsv(csv); } catch (e) { fail(e instanceof Error ? e.message : "Invalid CSV.", { errorCode: "invalid_csv", statusCode: 400 }); }
    const content: DeckContent = { language, cards, glossary: language.toLowerCase() === "german" ? [{ source: "card", target: "Karte" }] : [], proposals: [] };
    const id = crypto.randomUUID(), now = new Date().toISOString(), ownerEmail = owner(ctx), orgId = ctx?.orgId ?? null;
    await getDb().transaction(async tx => { await tx.insert(schema.decks).values({ id, name, content, ownerEmail, orgId, updatedAt: now }); await tx.insert(schema.revisions).values({ id: crypto.randomUUID(), deckId: id, ownerEmail, orgId, revision: 1, summary: "Imported CSV", content, createdAt: now }); });
    return { id, revision: 1, cards: cards.length };
  } });
