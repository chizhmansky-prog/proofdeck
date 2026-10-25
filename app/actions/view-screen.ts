import { defineAction } from "@agent-native/core/action";
import { readAppState } from "@agent-native/core/application-state";
import { getDeck } from "../server/lib/decks";
import { z } from "zod";

export default defineAction({
  description:
    "Read the Chat app's current navigation state. Basic navigation is already included in <current-screen>; use this action only when you need a fresh read.",
  schema: z.object({}),
  http: false,
  readOnly: true,
  run: async (_args, ctx) => {
    const navigation = await readAppState("navigation");

    const screen: Record<string, unknown> = {};
    if (navigation) screen.navigation = navigation;
    const state = z.object({ deckId: z.string().optional(), cardId: z.string().optional() }).safeParse(navigation);
    if (state.success && state.data.deckId) { const deck = await getDeck(state.data.deckId, ctx); screen.deck = { id: deck.id, name: deck.name, revision: deck.revision, targetLanguage: deck.content.language, selectedCardId: state.data.cardId }; }

    if (Object.keys(screen).length === 0) {
      return "No application state found. Is the app running?";
    }
    return screen;
  },
});
