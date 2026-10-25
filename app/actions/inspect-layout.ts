import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { getDeck } from "../server/lib/decks";
import { renderProof } from "../server/lib/layout";
export default defineAction({ description: "Measure real Chromium card layout at fixed 10 pt; compare numbers, tokens and glossary. variant proposals previews staged wording. Mechanical checks do not prove semantic equivalence.", schema: z.object({ id: z.string().describe("Deck UUID"), variant: z.enum(["current", "proposals"]).default("current").describe("Wording to inspect") }), http: { method: "GET" }, readOnly: true,
  run: async ({ id, variant }, ctx) => { const deck = await getDeck(id, ctx); const content = structuredClone(deck.content); if (variant === "proposals") for (const c of content.cards) c.text = content.proposals.find(p => p.cardId === c.id)?.text ?? c.text; const { findings, layout } = await renderProof(content); return { id, revision: deck.revision, variant, findings, layout, semanticReview: "required" as const }; } });
